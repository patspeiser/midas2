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
		this.buffer.clear();
		return new Promise( (resolve, reject)=>{
			this.interval = {amount: 45, type: 'minutes'};
			this.products = ['BTC-USD','BCH-USD','ETH-USD','LTC-USD']	
			return this.getProducts(this.interval, this.products)
			.then( prods=>{
				if(prods){
					prods.forEach(product=>{
						this.product = product.reverse();
						if(this.product && this.product.length > 0){
							this.runStrats(this.product, 14).then( data=>{
								this.data = data;
								this.data.product_id = product[0].product_id;
								this.buffer.insert(this.data);
								resolve();
							});
						};
					});
				};
			});
			reject('errDecisionEvaluate');
		});
	};
	runStrats(sets, period){
		this.period = period;
		this.sets = sets; 
		if(this.sets){
			this.product_id = sets[0].product_id;
			this.strat = new Strategy('gdax');
			this.candles = this.createCandles(this.sets, this.period);
			this.highs   = [];
			this.lows    = [];
			this.opens   = [];
			this.closes  = [];
			this.volumes  = []
			if(this.candles.length > 0){
				this.candles.map( c=>{
					if(c.open && c.close && c.high && c.low && c.volume){
						this.highs.push(c.high);
						this.lows.push(c.low);
						this.opens.push(c.open);
						this.closes.push(c.close);
						this.volumes.push(c.volume);
					};
				});
				this.priceSets = {
					product_id: this.product_id,
					allPrices: this.prices,
					high: this.highs,
					low : this.lows,
					open: this.opens,
					close: this.closes
				};
				this.period = this.priceSets.high.length / 5;
				this.strategies = {
					/*0*/	adx: 	this.strat.adx(		this.priceSets, {period: this.period}),
					/*1*/	atr: 	this.strat.atr(		this.priceSets, {period: this.period}),
					/*2*/	bbands: this.strat.bbands(	this.priceSets, {period: this.period, stdDev: 1}),
					/*3*/	cci: 	this.strat.cci(		this.priceSets, {period: this.period}),
					/*4*/	ema: 	this.strat.ema(		this.priceSets, {period: this.period}),
					/*5*/	macd: 	this.strat.macd(	this.priceSets, {short: 10, long: 20, period: this.period}),
					/*6*/	rsi: 	this.strat.rsi(		this.priceSets, {period: this.period}),
					/*7*/	sma:    this.strat.sma(		this.priceSets, {period: this.period}),
					/*8*/	stoch: 	this.strat.stoch(	this.priceSets, {kPeriod: 5, kSlowingPeriod: 3 , dPeriod: 3}),
					/*9*/	ultOsc: this.strat.ultOsc(	this.priceSets, {short:this.period, medium: this.period * 2 , long: this.period * 3})
				};

				this.keys = Object.keys(this.strategies);
				this.values = Object.values(this.strategies);
				var that = this;
				return Promise.all(this.values).then(function(data){
					if(data){
						return {
							sets     	: that.priceSets, 
							strategies 	: that.keys, 
							data       	: data
						};
						resolve();
					} else {
						reject("errDecisionRunStrats")
					};
				});
			}
		}
	};
	createCandles(set, period){
		this.set = set;
		this.period = period;

		function candle(set, period){
			this.set = set;
			this.period = period * 1000 * 60; // period should be minutes for now
			this.candles = [];
			if(this.set){
				this.startTime = new Date(this.set[0].time).getTime();
				this.endTime   = this.startTime + this.period;
				while(this.set){
					this.candle = {
						high: 	0,
						low : 	0,
						open: 	0,
						close: 	0,
						volume: 0
					};
					this.event = this.set.shift();
					if(this.event){
						this.eventTime = new Date(this.event.time).getTime();
						if(this.eventTime < this.endTime){
							this.volume+=1;
							this.price = this.event.price;
							if(this.candle.low === 0)
								this.candle.low = this.price;
							if(this.price >= this.candle.high)
								this.candle.high = this.price;
							if(this.price <= this.candle.low)
								this.candle.low  = this.price;
							if(this.open === 0)
								this.candle.open = this.price;
							if(this.close === this.period-1)
								this.candle.close = this.price;
						}  else {
							this.candles.push(this.candle);
							this.startTime = this.endTime;
							this.endTime   = this.startTime + this.endTime;
						};
					}
				};
				console.log(this.candles);	
			};		
		};
		candle.call(this, this.set, this.period);
		/*
		this.prices = this.sets.map( set=>{
			if (set.price)
				return set.price;
		});
		
		if(this.sets.length > this.period){
			for(let i = 0; i < this.set.length-1; i++){
				
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
		*/
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
				data[1].map(d =>{
					//console.log(chalk.magenta(d.product_id));
				});
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