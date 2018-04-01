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
			this.interval = {amount: 180, type: 'minutes'};
			this.products = ['BTC-USD','BCH-USD','ETH-USD','LTC-USD']	
			return this.getProducts(this.interval, this.products)
			.then( prods=>{
				if(prods){
					this.runStrats(this.buffer, prods, 4);
				};
			});
		});
	};
	getProductSetById(id){
		this.id  = id;
		return this.data[this.id];
	};
	getStrategySetById(id, set){
		this.id  = id;
		this.set = set; 
		if(this.set && this.set.data[this.id]){
			return this.set.data[this.id];
		}
	};
	getStrategyByName(name, set){
		this.name 		= name;
		this.set 		= set;
		if(this.set && Object.keys(this.set.strategies).indexOf(this.name) >= 0){
			this.index = Object.keys(this.set.strategies).indexOf(this.name);
			return this.getStrategySetById(this.index, this.set);
		};
	};
	runAlgo(buffer){
		this.buffer = buffer;
		if(this.buffer){
			this.strats = this.buffer.strats.chain().data();
			if(this.strats){
				this.strats.forEach(strat =>{
					if(strat && strat.product_id === 'BTC-USD'){
						console.log(chalk.magenta(strat.product_id));
						this.strat 	= strat;
						this.atr 	= this.getStrategyByName('atr', this.strat);
						this.rsi 	= this.getStrategyByName('rsi', this.strat);
						this.ultOsc = this.getStrategyByName('ultOsc', this.strat);
						this.volOsc = this.getStrategyByName('volOsc', this.strat);
						this.volume = this.strat.sets.volume;	
						if(this.ultOsc && this.ultOsc[0]){
							//SELL
							if(this.ultOsc[0][this.ultOsc[0].length-1] > 70){
								console.log(chalk.green('overbought'));
								console.log(chalk.green('---->ultOsc'));
								if(this.rsi[0][this.rsi[0].length-1] > 80){
									console.log(chalk.green('---->rsi'));
									if(this.cci[0][this.cci[0].length-1] < -100){
										console.log(chalk.green('---->cci'));
										if(this.adx[0][this.adx[0].length-1] > 70){
											console.log(chalk.green('---->adx'));
										};
									};
								};
							};
							//BUY
							if(this.ultOsc[0][this.ultOsc[0].length-1] < 30){
								console.log(chalk.red('oversold'));
								console.log(chalk.red('---->ultOsc'));
								if(this.rsi[0][this.rsi[0].length-1] < 20){
									console.log(chalk.red('---->rsi'));
									if(this.cci[0][this.cci[0].length-1] > 100){
										console.log(chalk.red('---->cci'));
										if(this.adx[0][this.adx[0].length-1] > 70){
											console.log(chalk.green('---->adx'));
										};
									};
								};
							};
						};
					};
				});
			};
		};
	};
	runStrats(buffer, prods, period){
		var buffer = buffer; 
		this.prods = prods;
		this.strats = []; 
		this.prods.forEach(product=>{
			this.period = period;
			this.product = product.reverse();
			if(this.product && this.product.length > 0){
				this.product_id = this.product[0].product_id;
				this.strat = new Strategy('gdax');
				this.prices   = [];
				this.product.map( product =>{
					this.prices.push(product.price);
				});
				//console.log(chalk.green(this.period));
				this.candles = this.createCandles(this.product, this.period, this.product_id);
				this.highs   = [];
				this.lows    = [];
				this.opens   = [];
				this.closes  = [];
				this.volumes  = [];
				if(this.candles && this.candles.length > 0){
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
						close: this.closes,
						volume: this.volumes
					};
					this.strategies = {
						adx: 	this.strat.adx(		this.priceSets, {period: period*3}),
						atr: 	this.strat.atr(		this.priceSets, {period: period}),
						bbands: this.strat.bbands(	this.priceSets, {period: period, stdDev: 1}),
						cci: 	this.strat.cci(		this.priceSets, {period: period}),
						ema: 	this.strat.ema(		this.priceSets, {period: period}),
						macd: 	this.strat.macd(	this.priceSets, {short: period*12, long: period*26, period: period}),
						rsi: 	this.strat.rsi(		this.priceSets, {period: Math.pow(period, period)}),
						sma:    this.strat.sma(		this.priceSets, {period: period}),
						stoch: 	this.strat.stoch(	this.priceSets, {kPeriod: 5, kSlowingPeriod: 3 , dPeriod: 3}),
						ultOsc: this.strat.ultOsc(	this.priceSets, {short: period, medium: period * 2 , long: period * 3}),
						vosc:   this.strat.vosc( 	this.priceSets, {short: period, long: period*3}),
					};
					this.strats.push({
						product_id: this.product_id,
						sets:       this.priceSets,
						strategies: this.strategies
					});
				}
			}
		});
		return Promise.all(this.strats.map( s=>{
			return Promise.all(Object.values(s.strategies)).then( (data)=>{
				s.data = data;
				buffer.insert(s);
				return data;
			});	
		})).then(function(data){
			/*
				return {
					sets     	: that.priceSets, 
					strategies 	: that.keys, 
					data       	: data
				};
				*/
		});
	};
	createCandles(set, period, id){
		this.set = set;
		this.period = period;
		this.candles = [];
		this.set = set;
		this.period = period * ( 60 * 1000 );
		if(this.set){
			this.startTime = new Date(this.set[0].time).getTime();
			this.endTime   = parseFloat(this.startTime) + parseFloat(this.period);
			this.candle = {
				high: 	0,
				low : 	0,
				open: 	0,
				close: 	0,
				volume: 0
			};
			while(this.set && this.set.length > 0){
				this.event = this.set.shift();
				if(this.event){
					this.eventTime = new Date(this.event.time).getTime();
					if(this.eventTime <= this.endTime){
						this.candle.volume+=1;
						this.price = this.event.price;
						if(this.candle.open === 0){
							this.candle.open = this.price;
						}
						if(this.candle.low === 0){
							this.candle.low = this.price;
						};
						if(this.price >= this.candle.high){
							this.candle.high = this.price;
						};
						if(this.price <= this.candle.low){
							this.candle.low  = this.price;
						};
					}  else {
						this.candle.close = this.price;
						if(this.candle.volume > 0){
							this.candles.push(this.candle);
						}
						this.candle = {
							high: 	0,
							low : 	0,
							open: 	0,
							close: 	0,
							volume: 0
						}
						this.startTime = this.endTime;
						this.endTime   = this.startTime + this.period;
					};
				}
			};
		};
		//console.log(chalk.gray(this.candles.length));
		return this.candles;	
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
};

module.exports = Decision;