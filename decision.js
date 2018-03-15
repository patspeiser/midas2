const chalk = require('chalk');
const path  = require('path');
const moment = require('moment');
const Op = require(path.join(__dirname, 'db')).Op;
const Ticker = require(path.join(__dirname,'db')).models.Ticker;
const Transaction = require(path.join(__dirname,'db')).models.Transaction;
const Strategy = require(path.join(__dirname, 'Strategy'));
const T = require('tulind');

class Decision {
	constructor(){};
	evaluate(buffer){
		this.buffer = buffer;
		return new Promise( (resolve, reject)=>{
			this.interval = {amount: 30, type: 'minutes'};
			this.products = ['BTC-USD','BCH-USD','ETH-USD','LTC-USD']	
			return this.getProducts(this.interval, this.products)
			.then( prods=>{
				if(prods){
					this.datasets = [];
					prods.forEach(product=>{
						this.product = product.reverse();
						if(this.product && this.product.length > 0){
							this.info = this.getDataSetInfo(this.product);
							this.runStrats(this.product).then( data=>{
								this.buffer.insert(data);
							});
							this.datasets.push(this.info);	
						}
					});
					this.rec = this.createRecommendation(this.datasets);
					if(this.rec){
						resolve(this.rec);
						reject();
					};
				};
			});
		});
	};
	runStrats(sets){
		if(sets){
			this.product_id = sets[0].product_id;
			this.strat = new Strategy('gdax');
			this.sets = sets;
			this.prices = this.sets.map( set=>{
				if (set.price)
					return set.price;
			});
			this.candles = this.createCandles(this.prices, 10);
			this.highs = [];
			this.lows  = [];
			this.opens = [];
			this.closes= [];
			this.candles.map( c=>{
				if(c.open && c.close && c.high && c.low){
					this.highs.push(c.high);
					this.lows.push(c.low);
					this.opens.push(c.open);
					this.closes.push(c.close);
				};
			});
			this.priceSets = {
				allPrices: this.prices,
				high: this.highs,
				low : this.lows,
				open: this.opens,
				close: this.closes
			};
			this.strategies = [
				this.strat.adx(		this.priceSets, {period: 5}),
				this.strat.atr(		this.priceSets, {period: 5}),
				this.strat.bbands(	this.priceSets, {period: 5, stdDev: 1}),
				this.strat.cci(		this.priceSets, {period: 5}),
				this.strat.ema(		this.priceSets, {period: 5}),
				this.strat.macd(	this.priceSets, {short: 1, long: 3, period: 5}),
				this.strat.rsi(		this.priceSets, {period: 5}),
				this.strat.sma(		this.priceSets, {period: 5}),
				this.strat.stoch(	this.priceSets, {kPeriod: 5, kSlowingPeriod: 3 , dPeriod: 3}),
				this.strat.ultosc(	this.priceSets, {short: 2, medium: 3, long: 5})
			];
			var that = this;
			return Promise.all(this.strategies).then(function(data){
				if(data)
					return {
						product_id: that.product_id,
						data: data
					};
			});
		}
	};
	createCandles(set, period){
		this.set = set;
		this.period = period;
		this.candles = [];
		if(this.set.length > this.period){
			for(let i = 0; i < this.set.length-this.period-1; i+=this.period){
				this.candle = {
					high: 0,
					low : 0,
					open: 0,
					close:0
				};	
				for(let j = 0; j<this.period; j++){
					this.price = set[i+j];
					if(this.candle.low === 0)
						this.candle.low = this.price;
					if(this.price >= this.candle.high)
						this.candle.high = this.price;
					if(this.price <= this.candle.low)
						this.candle.low  = this.price;
					if(j === 0)
						this.candle.open = this.price;
					if(j === this.period-1)
						this.candle.close = this.price;
				};
				this.candles.push(this.candle);
			};
			return this.candles;
		};
	};
	createRecommendation(rows){
		this.rows = rows;
		this.stats = {
			highestGain : 0,
			highestLoss : 0
		};
		this.rows.forEach( (row)=>{
			this.dataSet = row;
			if (this.dataSet.long.slope > 0){
				if(this.dataSet.short.slope < 0){
					if(this.dataSet.long.gainOrLoss > this.stats.highestGain){
						this.stats.highestGain = this.dataSet.long.gainOrLoss;
						this.stats['highestGainProductId'] = this.dataSet.product_id;
						this.stats['highestGainMostRecentPrice'] = this.dataSet.mostRecentPrice;
						this.stats['highestGainAveragePrice'] = this.dataSet.long.averagePrice;
					};
				}
			}	
		});
		if(this.stats.highestGainProductId){
			return this.stats;
		};
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