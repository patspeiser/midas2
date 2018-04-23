const gdax = require('gdax');
const path = require('path');
const chalk = require('chalk');
const config = require(path.join(__dirname, 'config')).config.gdax;
const Account = require(path.join(__dirname,'db')).models.Account;
const Ticker = require(path.join(__dirname,'db')).models.Ticker;
const Transaction = require(path.join(__dirname,'db')).models.Transaction;
const Buffer = require(path.join(__dirname, 'Buffer'));
const Strategy = require(path.join(__dirname, 'Strategy'));
const Decision 	= require(path.join(__dirname, 'Decision'));
const Process   =  require(path.join(__dirname, 'Process'));

class Gdax {
	constructor(buffers){
		this.buffers = buffers;
		console.log(chalk.yellow('##new gdax instance##'));
		this.products = ['BTC-USD','BCH-USD','ETH-USD','LTC-USD'];
		this.socket = new gdax.WebsocketClient(this.products,config.websocketUrl,null,['match']);
		this.client = new gdax.AuthenticatedClient(config.auth.apiKey, config.auth.apiSecret, config.auth.passphrase, config.baseUrl);
		this.decision  = new Decision(this);
	};
	init(){
		this.ingestStream();
		//this.processBuffer  	= new Process(this, this.processStream,  	1000 * 10);
		this.updateAccounts		= new Process(this, this.updateAccounts, 	1000 * 5 );
		this.evaluate    		= new Process(this, this.evaluate, 			1000 * 60 * 2);
		this.determine   		= new Process(this, this.determine, 		1000 * 60 * 1);
		this.getRecs    		= new Process(this, this.getRecs, 			1000 * 15 * 1);
		this.runAlgo   		    = new Process(this, this.runAlgo, 			1000 * 30 * 1);
		//this.historical       = new Process(this, this.historical, 		1000 * 5);
		//wash determinations.
		//rename determine / evaluate
		//this.infolog 			= new Process(this, this.infolog, 1000 * 30);
	};
	getRecs(){
		this.recs = this.buffers.recs.data;
		this.recs.forEach( (rec)=>{
			if(rec){
				this.rec = rec;
				this.now = Date.now();
				this.recTime = this.rec.time;
				this.expireRecTime = 1000 * 60 * 5;
				if(this.now - this.recTime > this.expireRecTime){
					this.buffers.recs.remove(this.rec); 
				};
			};
		})
		if (this.recs && this.recs.length > 0){
			console.log(chalk.gray(JSON.stringify(this.recs)));
		};
	};
	ingestStream(){
		this.socket.on('message', data =>{
			if(data.type === 'match' && data.product_id && data.price){
				//console.log(chalk.gray(JSON.stringify(data)));
				Ticker.create(data);
				//this.buffers.messages.insert(data);	
			};
		});
		this.socket.on('error', err =>{
			console.log(chalk.red(JSON.stringify(err)));
		});
	};
	processStream(){
		this.buffers.processStream(this.buffers);
	};
	evaluate(){
		this.decision.evaluate(this.buffers);
		return;
	}
	runAlgo(){
		this.decision.runAlgo(this.buffers);
	}
	historical(){
		this.decision.historical(this.buffers);
		return;
	}
	determine(){
		this.recs = this.buffers.recs.chain().data();
		console.log('#### determine', chalk.cyan(JSON.stringify(this.recs)));
		if(this.recs && this.recs.length > 0){
			this.newestRecTime;
			this.newestBuyRec;
			this.newestSellRec;  
			this.recs.forEach( rec =>{
				if(!this.newestRecTime){
					this.newestRecTime = rec.time;
					this.newestRec = rec;
					if(rec.side === 'buy'){
						this.newestBuyRec = rec;
					} else if (rec.side === 'sell'){
						this.newestSellRec = rec;
					};
				} else {
					if(rec.time > this.newestRecTime){
						this.newestRecTime = rec.time;
						this.newestRec = rec;
						if(rec.side ==='buy'){
							this.newestBuyRec = rec;		
						} else if (rec.side === 'sell'){
							this.newestSellRec = rec;
						};
					};
				};
			});
			console.log(chalk.red(JSON.stringify(this.newestRec)));
			console.log(chalk.red(JSON.stringify(this.newestBuyRec)));
			console.log(chalk.red(JSON.stringify(this.newestSellRec)));
			this.minTradeTime = 1000 * 60 * 20;
			this.maxTradeTime = this.minTradeTime * 3;
			this.goalMultiplier = 1.01;
			this.lossMultiplier = .99;
			Transaction.findOne({
				order: [['id', 'DESC']],
				limit: 1
			}).then( transaction =>{
				this.transaction = transaction;
				if(!this.transaction){
					if(this.recs.length > 0){
						if(this.newestBuyRec){
							console.log(chalk.red(this.newestBuyRec.product_id, this.newestBuyRec.price));
							this.marketBuy(this.newestBuyRec.product_id, this.newestBuyRec.price);
						};
					};
				};
				if(this.transaction){
					this.side = this.transaction.side;
					this.pair = this.transaction.product_id;
					this.product = this.pair.split('-');
					this.qouteCurrency = this.product[0];
					this.baseCurrency  = this.product[1];
					if(this.side === 'sell'){
						if(this.recs.length > 0 && this.newestBuyRec){
							console.log(chalk.red(this.newestBuyRec.product_id, this.newestBuyRec.price));
							this.marketBuy(this.newestBuyRec.product_id, this.newestBuyRec.price);
						};
					};

					if(this.side === 'buy'){
						Ticker.findOne({
							where: {
								product_id: this.transaction.product_id
							},
							order: [['id', 'DESC']],
							limit: 1
						}).then( ticker =>{
							this.ticker = ticker;
							if(this.ticker && this.transaction){
								if (this.transaction.product_id === this.newestSellRec.product_id){
									console.log(chalk.green(this.transaction.product_id, this.ticker.price));
									this.marketSell(this.transaction.product_id, this.ticker.price);
								} else {
									this.recs.forEach( rec =>{
										if(rec.product_id === this.transaction.product_id){
											if(rec.side === 'sell'){
												console.log(chalk.green(this.transaction.product_id, this.ticker.price));
												this.marketSell(this.transaction.product_id, this.ticker.price);
											};
										};
									});
								};
							};
						});
					};	
				};
			});
		}
	};
	marketBuy(product_id, price){
		console.log('marketbuy', product_id, price);
		this.product_id = this.rec.product_id;
		this.price = price;
		this.currencyNeeded = this.product_id.split('-')[1]; 
		Account.findOne({where: {currency: this.currencyNeeded}})
		.then( (account)=>{
			this.account = account;
			console.log(this.product_id && this.account && this.account.available);
			if(this.product_id && this.account && this.account.available > .01){
				this.tempSize = (this.account.available - (this.account.available * .003));
				this.funds = this.roundDown(this.tempSize, 8);
				this.orderParams = {
					side: 'buy',
					type: 'market',
					funds: this.funds, 
					product_id: this.product_id,
				};
				
				console.log(chalk.magenta(JSON.stringify(this.orderParams)));
				this.client.placeOrder(this.orderParams, (err, res, data)=>{
					if (err){
						console.log('err', err);
					} else {
						Transaction.create({
							transaction_id: data.id, 
							product_id:  	data.product_id,
							price: 			this.price,
							amount:         data.amount,
							side:  			data.side,
							time:           Date.now()
						});
					};
				});
			};
		});
	};
	marketSell(product_id, price){
		console.log('marketsell', product_id, price);
		//price here is pointless in a market sell. just used to mark a price in the 
		//transaction table 
		this.product_id = product_id;
		this.currencyNeeded = this.product_id.split('-')[0]; 
		Account.findOne({where: {currency: this.currencyNeeded}})
		.then( (account)=>{
			this.account = account;
			if(this.product_id && this.account && this.account.available > .01){
				this.orderParams = {
					side: 'sell',
					type: 'market',
					product_id: this.product_id,
					size: this.account.available
				}	
				console.log(chalk.magenta(JSON.stringify(this.orderParams)));
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
					};
				});
			};
		});
	};
	updateAccounts(){
		this.client.getAccounts().then( (accounts)=>{
			accounts.forEach( (account)=>{
				account['account_id'] = account.id;
				delete account['id'];
				if(account.currency === 'USD'){
					this.available = +account.available;
					delete account['available'];
					account.available = this.roundDown(this.available, 2); 
				} else {
					this.available = +account.available;
					delete account['available'];
					account.available = this.roundDown(this.available, 8)
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
	infolog(){
		this._strats = this.buffers.strats.chain().data();
		console.log('Num Strats:', chalk.cyan(JSON.stringify(this._strats.length)));
		Transaction.findAll({
			order: [['id', 'DESC']],
			limit: 1
		}).then( transactions =>{
			if(transactions && transactions.length > 0){
				console.log('Transaction:', chalk.cyan(JSON.stringify(transactions)));
			} else {
				console.log('no transactions');
			}
		});
		Ticker.findAll({
			order: [['id', 'DESC']],
			limit: 3
		}).then( tickers =>{
			if(tickers && tickers.length > 0){
				//console.log('Tickers:', chalk.cyan(JSON.stringify(tickers)));
			} else {
				console.log('no tickers');
			};
		});	
	};
	roundDown(number, decimals) {
		decimals = decimals || 0;
		return ( Math.floor( number * Math.pow(10, decimals) ) / Math.pow(10, decimals) );
	};
};

module.exports = Gdax;

/*
this.timeSince = Date.now() - this.transaction.time;
if(this.ticker.price > this.transaction.price){
	if(this.ticker.price > this.transaction.price * this.goalMultiplier){
		console.log(chalk.bgGreen('ticker greater - GOAL!'));
										//this.marketSell(this.pair, this.ticker.price);	
									};
									if(this.timeSince > this.maxTradeTime){
										console.log(chalk.bgGreen('ticker greater - max time'));
										//this.marketSell(this.pair, this.ticker.price);
									};
								};
								if(this.ticker.price < this.transaction.price){
									if(this.ticker.price < this.transaction.price * this.lossMultiplier){
										console.log(chalk.bgRed('ticker less - too low'));
										//this.marketSell(this.pair, this.ticker.price);	
									};
									if(this.timeSince > this.maxTradeTime){
										console.log(chalk.bgRed('ticker less - max time'));
										//this.marketSell(this.pair, this.ticker.price);
									} else if (this.timeSince > this.minTradeTime){
									//	
								} else {
									// 
								}
								*/
