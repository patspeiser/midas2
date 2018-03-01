const gdax = require('gdax');
const path = require('path');
const chalk = require('chalk');
const config = require(path.join(__dirname, 'config')).config.gdax;
const Account = require(path.join(__dirname,'db')).models.Account;
const Ticker = require(path.join(__dirname,'db')).models.Ticker;
const Transaction = require(path.join(__dirname,'db')).models.Transaction;
const Buffer = require(path.join(__dirname, 'Buffer'));
const Decision 	= require(path.join(__dirname, 'Decision'));

class Gdax {
	constructor(initialPrices){
		this.products = ['BCH-BTC','ETH-BTC','LTC-BTC','BTC-USD'];
		this.socket = new gdax.WebsocketClient(this.products,config.websocketUrl,null,['full']);
		this.client = new gdax.AuthenticatedClient(config.auth.apiKey, config.auth.apiSecret, config.auth.passphrase, config.baseUrl);
		this.buffer = new Buffer();
		this.messages = this.buffer.addCollection('message');
		this.valids   = this.buffer.addCollection('valids');
		this.buffer.addEventToCollection(initialPrices, this.valids);
		this.decision  = new Decision();
	};
	ingestStream(){
		this.socket.on('message', data =>{
			if(data.type === 'done' && data.reason === 'filled' && data.product_id && data.price){
				console.log(chalk.gray(JSON.stringify(data)));
				this.buffer.addEventToCollection(data, this.messages);
			};
		});
		this.socket.on('error', err =>{
			console.log(err);
		});
	};
	processStream(){
		this.buffer.processBuffer(this.messages, this.valids);
	};
	determine(){
		Transaction.findOne({
			order: [['id', 'DESC']],
			limit: 1
		}).then( transaction =>{
			this.transaction = transaction;
			if(!this.transaction){
				console.log('no transaction.');
				this.decision.evaluate().then( (e)=>{
					if(e){
						this.marketBuy(e);
					}	
				});
			};
			if(this.transaction){
				console.log('transaction');
				this.side = this.transaction.side;
				this.product = this.transaction.product_id.split('-');
				this.qouteCurrency = this.product[0];
				this.baseCurrency  = this.product[1];
				if(this.side === 'sell'){
					this.decision.evaluate().then( (e)=>{
						this.marketBuy(e);	
					});
				};
				if(this.side === 'buy'){
					Tickers.findOne({
						where: {
							product_id: this.transaction.product_id
						},
						order: [['id', 'DESC']],
						limit: 1
					}).then( ticker =>{
						this.ticker = ticker;
						if(this.ticker.price > this.transaction.price){
							this.timeSince = Date.now() - this.transaction.time;
							if(this.timeSince < 1000 * 60){
								//less than min time only sell if over goal or big loss
								if(this.ticker.price > this.transaction.price * 1.02){
									this.marketSell(this.product, this.ticker.price);	
								} 
								if(this.ticker.price < this.transaction.price * .99){
									this.marketSell(this.product, this.ticker.price);	
								};
							};
							if(this.timeSince > 1000 * 60){
								//over min time but less than max time
								if( this.timeSince > this.minTime && this.timeSince < this.maxTime ){
									//idk think of something	
								};
								if(this.timeSince > this.maxTime){
									this.marketSell(this.product, this.ticker.price);
								}
							};
						};
					});
				};
			};	
		});
	};
	marketBuy(rec){
		this.rec = rec;
		this.product = this.rec.highestGainProductId;
		this.currencyNeeded = this.product.split('-')[1]; 
		Account.findOne({where: {currency: this.currencyNeeded}})
		.then( (account)=>{
			this.account = account;
			if(this.rec && this.account && this.account.available > .01){
				this.orderParams = {
					side: 'buy',
					type: 'market',
					size: this.account.available, 
					product_id: this.product,
				};
				console.log(chalk.green(JSON.stringify(this.orderParams)));
				this.client.placeOrder(this.orderParams, (err, res, data)=>{
					if (err){
						console.log('err', err);
					} else {
						Transaction.create({
							transaction_id: data.id, 
							product_id:  	data.product_id,
							price: 			rec.highestGainMostRecentPrice,
							amount:         data.amount,
							side:  			data.side,
							time:           Date.now()
						});
					};
				});
			};
		});
	};
	marketSell(product, price){
		//price here is pointless in a market sell. just used to market a price in the 
		//transaction table 
		this.product = product;
		this.currencyNeeded = this.product.split('-')[0]; 
		Account.findOne({where: {currency: this.currencyNeeded}})
		.then( (account)=>{
			this.account = account;
			if(this.rec && this.account && this.account.available > .01){
				this.orderParams = {
					side: 'sell',
					type: 'market',
					product_id: this.product,
					size: this.account.available
				}	
				console.log(chalk.green(JSON.stringify(this.orderParams)));
				this.client.placeOrder(this.orderParams, (err, res, data)=>{
					if (err){
						console.log('err', err);
					} else {
						Transaction.create({
							transaction_id: data.id, 
							product_id:  	data.product_id,
							price: 			price,
							amount:         data.amount,
							side:  			data.side,
							time:           Date.now()
						});
						console.log('hup!');
					};
				});
			};
		});
	}
	updateAccounts(){
		this.client.getAccounts().then( (accounts)=>{
			accounts.forEach( (account)=>{
				account['account_id'] = account.id;
				delete account['id'];
				if(account.currency === 'USD'){
					this.available = +account.available;
					delete account['available'];
					account.available = this.available.toFixed(2);
				} else {
					this.available = +account.available;
					delete account['available'];
					account.available = this.available.toFixed(8);
				}
				Account.findOne({
					where: {
						currency: account.currency
					}
				})
				.then( (row)=>{
					if(row){
						row.update({
							account_id: 	account.account_id,
							balance:        account.balance,
							available:      account.available,
							hold:           account.hold
						});
					}
					else {
						Account.create(account);
					}
				})
			});
		});
	};
	displayValidPrices(){
		console.log('-----------');
		this.valids.data.map( (e)=>{
			console.log(chalk.cyan(JSON.stringify(e)));
		});	
	};
};

module.exports = Gdax;