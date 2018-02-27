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
					this.info = this.getDataSetInfo(this.product);	
					console.log('#', this.info);
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
	getDataSetInfo(dataSet){
		this.product_id = dataSet[0].product_id;
		this.dataSet = dataSet;
		if(this.dataSet.length > 0){
			this.longDataSet = this.dataSet;
			this.lastQuarterIndex = Math.floor(this.dataSet.length / 4) * -1;
			this.shortDataSet = this.dataSet.slice(this.lastQuarterIndex);
			this.mostRecentPrice = this.dataSet[this.dataSet.length-1].price;
			function createPoint(set, type){
				this.point;
				if(set){
					this.dataset = set;
					this.yTotal = 0;
					this.totalPoints = 0;
					this.product_id = this.dataset[0].product_id;
					if(type === 'first'){
						this.point = this.dataset.length / 4;
						for(let i=0; i<=this.point; i++){
							this.yTotal+=this.dataset[i].price;
							this.totalPoints+=1;
						};
					};
					if(type === 'second'){
						this.point = 3 * Math.floor((this.dataset.length / 4));
						for(let i=this.point; i<=this.dataset.length-1; i++){
							this.yTotal+=this.dataset[i].price;
							this.totalPoints+=1;
						};
					};
					this.y = this.yTotal / this.totalPoints;
				}
				return [this.point, this.y];
			};
			function calculateSlope(points){
				this.slope;
				if(points){
					this.points = points;
					this.num = this.points.second[1] - this.points.first[1];
					this.denom = this.points.second[0] - this.points.first[0];
					this.slope = this.num / this.denom;
				};
				return this.slope;
			};
			function getAveragePrice(points){
				this.points = points;
				this.averagePrice = (this.points.first[1] + this.points.second[1]) / 2
				return this.averagePrice; 
			};
			function getNormalizedSlope(slope, average){
				return (slope / average) * 100;
			};
			function getGainOrLoss(points){
				this.points = points;
				this.result = Math.abs( 1 - (this.points.second[1] / this.points.first[1]) ) * 100;
				return this.result;
			};
			function createSet(set){
				this.set = {};
				if(set){
					this.set.points = {};
					this.set.points.first = 	createPoint.call(this, set, 'first');
					this.set.points.second = 	createPoint.call(this, set, 'second');
					this.set.slope = 			calculateSlope.call(this, this.set.points); 
					this.set.averagePrice = 	getAveragePrice.call(this, this.set.points); 
					this.set.normalizedSlope =  getNormalizedSlope.call(this, this.set.slope, this.set.averagePrice); 
					this.set.gainOrLoss =       getGainOrLoss.call(this, this.set.points);
					return this.set;
				}
			};

			this.data = {
				product_id:         this.product_id,
				mostRecentPrice: 	this.mostRecentPrice,
				long: 				createSet.call(this, this.longDataSet), 
				short: 				createSet.call(this, this.shortDataSet),
			};
		}
		return this.data;
	};
};

module.exports = Decision;