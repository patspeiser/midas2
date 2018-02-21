const loki = require('lokijs');
const path = require('path');
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
	processBuffer(collection){
		console.log('buffering');
		this.events = this.getAllEventsInCollection(collection);
		if(this.events.length > 0){
			console.log(this.events.length);
			for(let i = 0; i < this.events.length; i++){
				Ticker.create(this.events[i]);
				this.removeEventFromCollection(this.events[i], collection);
			};	
		};
	};
};

module.exports = Buffer;
