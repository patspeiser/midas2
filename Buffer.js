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
	}
	processBuffer(collection, valids){
		this.upperBound = 1.02;
		this.lowerBound = .98;
		this.events = this.getAllEventsInCollection(collection);
		this.valids = this.getAllEventsInCollection(valids);
		this.events.forEach( event =>{
			console.log(event);
			this.valids.map( (v)=>{
				this.validPrice = v[event.product_id];
				if(event && event.product_id && v && this.validPrice){
					if(event.price < this.validPrice * this.upperBound && event.price > this.validPrice > this.lowerBound){
						console.log('old price', this.validPrice);
						this.validPrice = event.price; 
						valids.update(v);
						console.log('new price', v[event.product_id]);
						Ticker.create(event).then( ()=>{
							this.removeEventFromCollection(event, collection);
						});
					}
				}
			});
		});
	};
};

module.exports = Buffer;
/*
[ { 'BTC-USD': 9661,
    'BCH-BTC': 0.12291,
    'ETH-BTC': 0.08758,
    'LTC-BTC': 0.02276,
    meta: { revision: 0, created: 1519601200669, version: 0 },
    '$loki': 1 } ]*/