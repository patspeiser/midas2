const loki = require('lokijs');
const path = require('path');
const chalk = require('chalk');
const db = require(path.join(__dirname, 'db'));
const Models = db.models;
const Ticker = Models.Ticker;
const Valid	= require(path.join(__dirname, 'Valid'));

class Buffer{
	constructor(){
		console.log(chalk.yellow('##new buffer instance##'));
		this.buffer = new loki('midas2.json');
	};
	init(){
		this.messages = 	this.buffer.addCollection('message');
		this.valids  = 		this.buffer.addCollection('valids');
		this.strats   =		this.buffer.addCollection('strategies');
		this.initialPriceList 	= new Valid();
		this.valids.insert(this.initialPriceList);
		return new Promise( (resolve, reject)=>{
			this.buffers = {
				processBuffer   : this.processBuffer,
				messages 		: this.messages,
				valids   		: this.valids,
				strats   		: this.strats
			};
			resolve(this.buffers);
			reject('errbufferinit');
		});
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
	};
	processBuffer(buffers){
		this.buffers = buffers;
		this.collection = this.buffers.messages;
		this.valids     = this.buffers.valids
		if(this.collection && this.valids){
			this.upperBound = 1.02;
			this.lowerBound = .98;
			this.events = this.collection.chain().data();
			this.validPrices = this.valids.chain().data();
			this.events.forEach( event =>{
				this.validPrices.map( (v)=>{
					this.validPrice = v[event.product_id];
					if(event && event.product_id && v && this.validPrice){
						if(event.price < this.validPrice * this.upperBound && event.price > this.validPrice * this.lowerBound){
							v[event.product_id] = event.price;
							this.valids.update(v);
							Ticker.create(event).then( (e)=>{
								this.collection.remove(event);	
							});
						} else {
							console.log(chalk.red('shitty price'), event.product_id, event.price);
						};
					};
				});
			});
		};
	};
};

module.exports = Buffer;
