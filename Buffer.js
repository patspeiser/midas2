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
	validateEventPrice(event){
		this.event      = event;
		this.upperBound = 1.02;
		this.lowerBound =  .98;
		ValidPrice.findOne({where: { product_id: this.event.product_id } }).then( (validPrice)=>{
			if(validPrice){
					if(this.event.price < validPrice.price * this.upperBound && this.event.price >= validPrice.price * this.lowerBound){
						Ticker.create(this.event);
						validPrice.price = this.event.price;
						validPrice.save().then( (err, row)=>{});
					} else {
						console.log(chalk.red('shitty price', chalk.red(this.event.product_id), chalk.red(this.event.price), validPrice.price));
					};
			} else {
				this.validToCreate = { 
					product_id: this.event.product_id,
					price:      this.event.price,
					time:       Date.now()
				};
				ValidPrice.create(this.validToCreate);
			};
		});
	};
	processBuffer(collection){
		this.events = this.getAllEventsInCollection(collection);
		if(this.events.length > 0){
			console.log('buffering...', this.events.length);
			for(let i = 0; i < this.events.length; i++){
				this.validateEventPrice(this.events[i]);
				this.removeEventFromCollection(this.events[i], collection);
			};	
		};
	};
};

module.exports = Buffer;
