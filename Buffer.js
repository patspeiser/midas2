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
		this.recs     =		this.buffer.addCollection('recs');
		return new Promise( (resolve, reject)=>{
			this.buffers = {
				processStream   : this.processStream,
				messages 		: this.messages,
				strats   		: this.strats,
				recs            : this.recs
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
					//console.log(event);
					try {
						//console.log(event);
						this.messages.remove(event);
					} catch(error) {
						console.log(error);
					}
				});
			});
		};
	};
};

module.exports = Buffer;
