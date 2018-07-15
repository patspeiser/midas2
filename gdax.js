const gdax = require('gdax');
const path = require('path');
const chalk = require('chalk');
const config = require(path.join(__dirname, 'config')).config.gdax;
const Account = require(path.join(__dirname,'db')).models.Account;
const Op = require(path.join(__dirname,'db')).Op;
const Ticker = require(path.join(__dirname,'db')).models.Ticker;
const Transaction = require(path.join(__dirname,'db')).models.Transaction;
const Rec = require(path.join(__dirname,'db')).models.Rec;
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
		this.evaluate    		= new Process(this, this.evaluate, 			1000 * 60 * 1);
		this.determine   		= new Process(this, this.determine, 		1000 * 60 * 3);
		this.getRecs    		= new Process(this, this.getRecs, 			1000 * 5 * 1);
		//this.runAlgo   		= new Process(this, this.runAlgo, 			1000 * 60 * 1);
		//this.historical       = new Process(this, this.historical, 		1000 * 5);
		this.infolog 			= new Process(this, this.infolog, 1000 * 30);
		//this.orderTest 			= new Process(this, this.orderTest, 1000 * 3);
		this.blaster = new Process(this, this.runBlaster, 1000 * 30);

	};
	orderTest(){
		Transaction.findOne({
			order: [['id', 'DESC']]
		}).then( (transaction)=>{
			this.transaction = transaction;
			//console.log(chalk.yellow(JSON.stringify(this.transaction)));
			/*
			this.client.getOrder('5554de48-8fc9-41d5-ab1c-da8975447011', (a,b,c)=>{
				console.log('#_#', c);
			});

			this.client.getOrder('94015a4e-046e-439d-9282-62a9e3f71167', (a,b,c)=>{
				console.log('#_#', c);
			});
			*/		
		});
	};
	getRecs(){
		this.recs = this.buffers.recs.chain().data();
		this.recs.forEach( (rec)=>{
			if(rec){
				this.rec = rec;
				this.now = Date.now();
				this.recTime = this.rec.time;
				this.expireRecTime = 1000 * 60 * 3;
				console.log('expirerectime', this.now - this.recTime > this.expireRecTime);
				if(this.now - this.recTime > this.expireRecTime){
					console.log('removing old rec');
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
			};
		});
		this.socket.on('error', err =>{
			console.log(chalk.red(JSON.stringify(err)));
		});
	};
	runBlaster(){
		this.decision.runBlaster(this.buffers);
	}
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
		this.newestRecTime;
		this.newestRec;
		this.newestBuyRec;
		this.newestSellRec;
		this.validRecTime = Date.now() - (1000 * 60 * 3) ;
		Rec.findAll({
			where: {
				createdAt: {
					[Op.gt]: this.validRecTime
				} 
			},
			order: [['id', 'DESC']],
			limit: 6
		}).then( (recs)=>{
			this.recs = recs;
			if(this.recs && this.recs.length > 0){
			for(let i = 0; i < this.recs.length; i++){
				if(!this.newestRecTime){
					this.newestRecTime = this.recs[i].time;
					this.newestRec = this.recs[i];
					if(this.recs[i].side === 'buy'){
						this.newestBuyRec = this.recs[i];
					} else if (this.recs[i].side === 'sell'){
						this.newestSellRec = this.recs[i];
					} else {

					};
				} else {
					if(this.recs[i].time > this.newestRecTime){
						this.newestRecTime = this.recs[i].time;
						this.newestRec = this.recs[i];
						if(this.recs[i].side === 'buy'){
							this.newestBuyRec = this.recs[i];		
						} else if (this.recs[i].side === 'sell'){
							this.newestSellRec = this.recs[i];
						} else {

						};
					};
				};
			};
		};
		Transaction.findOne({
			order: [['id', 'DESC']],
			limit: 1
		}).then( transaction =>{
			this.transaction = transaction;
			//console.log('#transaction', this.transaction);
			if(!this.transaction){
				if(this.newestBuyRec){
					console.log(chalk.red(this.newestBuyRec.product_id, this.newestBuyRec.price));
					return this.marketBuy(this.newestBuyRec.product_id, this.newestBuyRec.price, 'initial transaction');
				};
			};
			this.minTradeTime = 1000 * 60 * 5; // 1000 * 60 * 60 = 1 hours
			this.maxTradeTime = 1000 * 60 * 60 * 12;
			this.goalMultiplier = 1.015;
			this.lossMultiplier = .985;
			if(this.transaction){
				this.side = this.transaction.side;
				if(this.side === 'buy' && (Date.now() - this.transaction.time) > this.maxTradeTime){
					Ticker.findOne({
						where: {
							product_id: this.transaction.product_id
						},
						order: [['id', 'DESC']],
						limit: 1
					}).then( ticker =>{
						this.ticker = ticker;
						return this.marketSell(this.transaction.product_id, this.ticker.price, 'time met')
					});
				} else {
					this.pair = this.transaction.product_id;
					this.product = this.pair.split('-');
					this.qouteCurrency = this.product[0];
					this.baseCurrency  = this.product[1];
					if(this.side === 'sell'){
						Ticker.findOne({
							where: {
								product_id: this.pair
							},
							order: [['id', 'DESC']],
							limit: 1
						}).then( (ticker)=>{
							this.ticker = ticker;
							if(this.ticker && this.transaction){
								if(this.recs.length > 0 && this.newestBuyRec){
									console.log('##RECBUY', chalk.red(this.newestBuyRec.product_id, this.newestBuyRec.price));
									return this.marketBuy(this.newestBuyRec.product_id, this.newestBuyRec.price, 'rec buy');
								};
							}
						})
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
								if(this.ticker.price < this.transaction.price * this.lossMultiplier){
									return this.marketSell(this.transaction.product_id, this.ticker.price, 'loss percent');	
								} else if (this.ticker.price > this.transaction.price * this.goalMultiplier){
									return this.marketSell(this.transaction.product_id, this.ticker.price, 'goal met');
								} else {
									if(this.transaction && this.newestSellRec){
										console.log('inadaelse', this.newestSellRec, this.transaction.product_id, this.newestSellRec.product_id);
									}
									if (this.transaction && this.newestSellRec && (this.transaction.product_id === this.newestSellRec.product_id)){
										console.log('now inadahere', chalk.green(this.transaction.product_id, this.ticker.price));
										return this.marketSell(this.transaction.product_id, this.ticker.price, 'rec sell');
									} else {
										//	
									};
								}
							};
						});
					};
				}	
			};
		});
	});
}
marketBuy(product_id, price, reason){
		this.recs = this.buffers.recs.data;
		console.log('marketbuy', product_id, price);
		this.product_id = product_id;
		this.price = price;
		this.currencyNeeded = this.product_id.split('-')[1]; 
		Account.findOne({where: {currency: this.currencyNeeded}})
		.then( (account)=>{
			this.account = account;
			console.log(this.product_id && this.account && this.account.available);
			if(this.product_id && this.account && this.account.available > .01){
				this.tempSize = (this.account.available - (this.account.available * .003));
				this.funds = this.roundDown(this.tempSize, 2);
				this.orderParams = {
					side: 'buy',
					type: 'market',
					funds: this.funds, 
					product_id: this.product_id,
				};
				Ticker.findOne({
					where: {
						product_id: product_id, 
					},
					order: [['id', 'DESC']]
				}).then( (ticker)=>{
					console.log('TICKER', ticker);
				});	
				console.log(chalk.magenta(JSON.stringify(this.orderParams)));
				this.client.placeOrder(this.orderParams, (err, res, data)=>{
						console.log('#_#MARKETBUYDATA', data);
					if (err){
						console.log('err', err);
					} else {
						this.buffers.recs.clear();
						this.client.getOrder(data.id, (err, req, res)=>{
							console.log('#_#MARKETBUY', res);
							this.price = res.executed_value / res.filled_size;
							Transaction.create({
								transaction_id: data.id, 
								product_id:  	data.product_id,
								price: 			this.price,
								amount:         data.amount,
								side:  			data.side,
								time:           Date.now(),
								reason:         reason
							});
						});
					};
				});
			};
		});
	};
	marketSell(product_id, price, reason){
		//this.recs = this.buffers.recs.data;
		console.log('marketsell', product_id, price);
		//transaction table 
		this.product_id = product_id;
		this.currencyNeeded = this.product_id.split('-')[0];
		console.log('/////////////////////', this.product_id, this.currencyNeeded) ;
		Account.findOne({where: {currency: this.currencyNeeded}})
		.then( (account)=>{
			this.account = account;
			console.log('got account', this.product_id, this.account.available);
			if(this.product_id && this.account && this.account.available > .005){
				this.orderParams = {
					side: 'sell',
					type: 'market',
					product_id: this.product_id,
					size: this.account.available
				}
				Ticker.findOne({
					where: {
						product_id: product_id, 
					},
					order: [['id', 'DESC']]
				}).then( (ticker)=>{
					console.log('TICKER', ticker);
				});		
				console.log(chalk.magenta(JSON.stringify(this.orderParams)));
				this.client.placeOrder(this.orderParams, (err, res, data)=>{
					if (err){
						console.log('err', err);
						
					} else {
						this.buffers.recs.clear();
						this.client.getOrder(data.id, (err, req, res)=>{
							console.log('#_#MARKETSELL', res)
							this.price = res.executed_value / res.filled_size;
							Transaction.create({
								transaction_id: data.id, 
								product_id:  	data.product_id,
								price: 			this.price,
								amount:         data.amount,
								side:  			data.side,
								time:           Date.now(),
								reason:         reason
							});
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
		this._recs = this.buffers.recs.chain().data();
		console.log('Num Recs:', chalk.cyan(JSON.stringify(this._recs.length)));
		console.log('Recs:', chalk.cyan(JSON.stringify(this._recs)));
		Transaction.findAll({
			order: [['id', 'DESC']],
			limit: 3
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
				console.log('Tickers:', chalk.cyan(JSON.stringify(tickers)));
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

