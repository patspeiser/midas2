const loki = require('lokijs');
const path = require('path');
const chalk = require('chalk');
const db = require(path.join(__dirname, 'db'));
const Models = db.models;
const Ticker = Models.Ticker;

class Buffer{
	constructor(){
		console.log(chalk.yellow('##new buffer instance##'));
		this.buffer = new loki('midas2.json');
	};
	init(){
		this.messages = 	this.buffer.addCollection('message');
		this.strats   =		this.buffer.addCollection('strategies');
		return new Promise( (resolve, reject)=>{
			this.buffers = {
				processStream   : this.processStream,
				messages 		: this.messages,
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
	processStream(buffers){
		this.buffers 	= buffers;
		this.messages	= this.buffers.messages
		this.events 	= this.messages.chain().data();
		if(this.events){
			this.events.forEach( event =>{
				Ticker.create(event).then( t =>{
					this.messages.remove(event);
				});
			});
		};
	};
	/*
	processBuffer(buffers){
		this.buffers = buffers;
		this.collection = this.buffers.messages;
		this.valids     = this.buffers.valids
		if(this.collection && this.valids){
			this.upperBound = 1.02;
			this.lowerBound = .98;
			this.events = this.collection.chain().data();
			//this.validPrices = this.valids.chain().data();
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
	*/
};

module.exports = Buffer;
