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
				//console.log(chalk.gray(JSON.stringify(data)));
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
			if (this.transaction){
				console.log('transaction');
				this.side = this.transaction.side;
				this.products = this.transaction.product_id.split('-');
				this.qouteCurrency = this.products[0];
				this.baseCurrency  = this.products[1];
				if(this.side === 'sell'){
					this.decision.evaluate().then( (e)=>{
						this.marketBuy(e);	
					});
				};
				if(this.side === 'buy'){
					this.product = this.products[0];
					Tickers.findOne({
						where: {
							product_id: this.transaction.product_id
						},
						order: [['id', 'DESC']],
						limit: 1
					}).then( ticker =>{
						this.ticker = ticker;
						if(this.ticker.price > this.transaction.price){
							if(Date.now() - this.transaction.time < 1000 * 60){
								if(this.ticker.price > this.transaction.price * 1.02){
									//marketsell	
								};
							} else {
									//marketsell
								};
							} else {
								if(Date.now() - this.transaction.time < 1000 * 60){
									if(this.ticker.price < this.transaction.price * .98){
									//sell
								};
							} else {
								//sell
							};
						};
					});
				};
			};	
		});
	};
	marketBuy(rec){
		this.rec = rec;
		if(this.rec){
			this.orderParams = {
				side: this.side,
				type: 'market',
				size: this.account.available, 
				product_id: this.product_id,
			};
			Gdax.placeOrder(this.orderParams, (err, res, data)=>{
				if (err){
					console.log('err', err);
				} else {
					console.log('hup!');
				};
			});
		};
	};
	marketSell(){}
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