const chalk = require('chalk');
const path  = require('path');
const moment = require('moment');
const Op = require(path.join(__dirname, 'db')).Op;
const Ticker = require(path.join(__dirname,'db')).models.Ticker;

class Decision {
	constructor(){};
	evaluate(){
		this.interval = {amount: 30, type: 'minutes'};
		this.products = ['BCH-BTC','ETH-BTC','LTC-BTC','BTC-USD'];	
		this.getProducts(this.interval, this.products)
		.then( prods=>{
			if(prods){
				prods.forEach(product=>{
					this.product = product.reverse();
					console.log(this.product);
				});
			}
		});
	};
	getProducts(interval, productList){
		this.promises = []; 
		this.now = new Date();
		this.when = moment(this.now).subtract(interval.amount, interval.type).format();
		for(let i=0; i < productList.length; i++){
			this.promise = Ticker.findAll({
				where: { 
					product_id: productList[i],
					createdAt: {
						[Op.gt]: this.when
					} 
				},
				order: [['id', 'DESC']],
				limit: 10000
			});
			this.promises.push(this.promise);
		};
		return Promise.all(this.promises).then(function(data){
			if(data)
				return data;
		});
	};
	lessenNoise(set, granularity){
		if(set.length > granularity){
			this.xSet = [];
			for(let i = 0; i < set.length-granularity-1; i+=granularity){
				this.set = [];
				for(let j = 0; j<granularity; j++){
					this.set.push(set[i+j]);
				};
				this.xSet.push(this.set);
			};
			return this.xSet;
		};
	};
	allValidFields(set){
		this.valid = false;
		this.values = Object.values(set);
		this.values.forEach( (value)=>{
			if(!value){
				console.log('invalid set', JSON.stringify(set));
				return this.valid;
			};
		});
		this.valid = true;
		return this.valid; 
	};
};

module.exports = Decision;