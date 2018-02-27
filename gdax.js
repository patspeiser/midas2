const gdax = require('gdax');
const path = require('path');
const chalk = require('chalk');
const config = require(path.join(__dirname, 'config')).config.gdax;
const Account = require(path.join(__dirname,'db')).models.Account;
const Ticker = require(path.join(__dirname,'db')).models.Ticker;
const Buffer = require(path.join(__dirname, 'Buffer'));

class Gdax {
	constructor(initialPrices){
		this.products = ['BCH-BTC','ETH-BTC','LTC-BTC','BTC-USD'];
		this.socket = new gdax.WebsocketClient(this.products,config.websocketUrl,null,['full']);
		this.client = new gdax.AuthenticatedClient(config.auth.apiKey, config.auth.apiSecret, config.auth.passphrase, config.baseUrl);
		this.buffer = new Buffer();
		this.messages = this.buffer.addCollection('message');
		this.valids   = this.buffer.addCollection('valids');
		this.buffer.addEventToCollection(initialPrices, this.valids);
	};
	ingestStream(){
		this.socket.on('message', data =>{
			if(data.type === 'done' && data.reason === 'filled' && data.product_id && data.price){
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