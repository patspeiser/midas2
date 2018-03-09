const loki = require('lokijs');
const path = require('path');
const chalk = require('chalk');
const db = require(path.join(__dirname, 'db'));
const Models = db.models;
const Ticker = Models.Ticker;

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
	};
	
	processBuffer(collection, valids){
		this.upperBound = 1.02;
		this.lowerBound = .98;
		this.events = this.getAllEventsInCollection(collection);
		this.valids = this.getAllEventsInCollection(valids);
		this.events.forEach( event =>{
			this.valids.map( (v)=>{
				this.validPrice = v[event.product_id];
				if(event && event.product_id && v && this.validPrice){
					if(event.price < this.validPrice * this.upperBound && event.price > this.validPrice * this.lowerBound){
						v[event.product_id] = event.price;
						valids.update(v);
						Ticker.create(event).then( (e)=>{
							this.removeEventFromCollection(event, collection);
						});
					} else {
						console.log(chalk.red('shitty price'), event.product_id, event.price);
					}
				}
			});
		});
	};
};

module.exports = Buffer;
