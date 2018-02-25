const loki = require('lokijs');
const path = require('path');
const chalk = require('chalk');
const db = require(path.join(__dirname, 'db'));
const Models = db.models;
const Ticker = Models.Ticker;
const ValidPrice = Models.ValidPrice;

class Buffer{
	constructor(){
		this.buffer = new loki('midas2.json');
	};
	addCollection(name){
		return this.buffer.addCollection(name);
	};
	addEventToCollection(event, collection){
		return collection.insert(event);
	};
	removeEventFromCollection(event, collection){
		return collection.remove(event);
	};
	getAllEventsInCollection(collection){
		return collection.chain().data();
	};
	findOrCreateValidPrices(prices){
		this.prices = prices;
		console.log('prices>', prices);
	}
	processBuffer(collection){
		this.events = this.getAllEventsInCollection(collection);
		this.events.forEach( event =>{
			if(event.product_id === 'BTC-USD' && event.price < 9000){
				console.log(chalk.gray(JSON.stringify(event)));
			}
			if(event.product_id === 'BTC-USD' && event.price > 10000){
				console.log(chalk.magenta(JSON.stringify(event)));
			}
			Ticker.create(event);
		});
	};
};

module.exports = Buffer;
