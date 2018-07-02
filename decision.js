const chalk = require('chalk');
const path  = require('path');
const moment = require('moment');
const Op = require(path.join(__dirname, 'db')).Op;
const Ticker = require(path.join(__dirname,'db')).models.Ticker;
const Transaction = require(path.join(__dirname,'db')).models.Transaction;
const Strategy 	= require(path.join(__dirname, 'Strategy'));
const Model 	= require(path.join(__dirname, 'Db')).models;
const T = require('tulind');


class Decision {
	constructor(service){
		this.gdax = service;
	};
	evaluate(buffer){
		console.log(chalk.green('#evaluate'));
		//* sorta prod
		this.buffer = buffer;
		this.buffer.strats.clear();
		return new Promise( (resolve, reject)=>{
			this.interval = {amount: 12, type: 'hours'};
			this.products = ['BTC-USD','BCH-USD', 'ETH-USD','LTC-USD'];	
			return this.getProducts(this.interval, this.products, false, 50000)
			.then( prods=>{
				if(prods){
					this.runStrats(this.buffer, prods, 6);
				};
			});
		});
	};
	
	historical(buffers){
		this.buffers = buffers; 
		this.buffer  = this.buffers.strats;
		return new Promise( (resolve, reject)=>{
			this.interval = {amount: 60*48, type: 'minutes'};
			this.period = 3;
			this.products = ['BTC-USD','BCH-USD', 'ETH-USD','LTC-USD']	;
			return this.getProducts(this.interval, this.products, false, 100000)
			.then( prods=>{
				if(prods){
					prods.forEach(prod => {
						this.prod = prod;
						if(this.prod && this.prod[0].product_id === 'BTC-USD'){
							this.product_id = this.prod[0].product_id; 	
							this.strat = new Strategy('gdax');
							this.prices   = [];
							this.prod.map( product =>{
								this.prices.push(product.price);
							});
							//console.log(chalk.green(this.period));
							this.candles = this.createCandles(this.prod, this.period, this.product_id);
							console.log(chalk.cyan('candles', this.candles.length));
						};
					});
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
	runAlgo(strats){
		this.strats = this.strats;
		if(this.strats){
			console.log(chalk.green('#runAlgo num prods', this.strats.length));
			if(this.strats){
				//this.historical(this.strats);
				this.strats.forEach(strat =>{
					this.strat 	= strat;
					//if(strat && strat.product_id === 'BTC-USD'){
						//console.log(chalk.magenta(strat.product_id));
						this.atr 	= this.getStrategyByName('atr', this.strat);
						this.adx	= this.getStrategyByName('adx', this.strat);
						this.cci	= this.getStrategyByName('cci', this.strat);
						this.rsi 	= this.getStrategyByName('rsi', this.strat);
						this.ultOsc = this.getStrategyByName('ultOsc', this.strat);
						this.vosc 	= this.getStrategyByName('vosc', this.strat);
						this.vema 	= this.getStrategyByName('vema', this.strat);
						this.volume = this.strat.sets.volume;
						this.score = 0;
						if(this.atr){
							this._atr 		= this.atr[0][this.atr[0].length-1];
						};
						if(this.atr){
							this._adx  		= this.adx[0][this.adx[0].length-1]; 
						};
						this._cciRec = false;
						if(this.cci){
							this._cci_recent		= this.cci[0][this.cci[0].length-1];
							this._cci_previous		= this.cci[0][this.cci[0].length-2];
							this._cci_distant		= this.cci[0][this.cci[0].length-3];
							console.log(chalk.magenta(this._cci_recent, this._cci_previous));
							if(this._cci_recent !== this._cci_previous && this._cci_recent !== this._cci_previous){
								if( (this._cci_recent > 50 && this._cci_previous < 0) || (this._cci_recent > 50 && this._cci_distant < 0) ){
									this._cciRec = true;
								};
								if( (this._cci_recent < -50 && this._cci_previous > 0) || (this._cci_recent < -50  && this._cci_distant > 0) ){
									this._cciRec = true;
								};
							};
						};
						if (this.rsi){
							this._rsi		= this.rsi[0][this.rsi[0].length-1];
						};
						if(this.ultOsc){
							this._ultOsc	= this.ultOsc[0][this.ultOsc[0].length-1];
						};
						if(this.vosc){
							this._vosc		= this.vosc[0][this.vosc[0].length-1];
						};
						if(this.vema){
							this._vema		= this.vema[0][this.vema[0].length-1];
						};
						if(this.strat.sets.volume){
							this._volume	= this.strat.sets.volume[this.strat.sets.volume.length-1] 
						};
						/*
						for (let i = 0; i < 4; i++){
							this.buffer.recs.insert({
								product_id: this.strat.product_id,
								side: 'sell', 
								price: this.strat.sets.allPrices[this.strat.sets.allPrices.length-1],
								time: Date.now()
							});
							this.buffer.recs.insert({
								product_id: this.strat.product_id,
								side: 'buy', 
								price: this.strat.sets.allPrices[this.strat.sets.allPrices.length-1],
								time: Date.now()
							});
						}
						/*
						this._vema = 1.5;
						this._vosc = 21;
						this._ultOsc = 71;	
						*/
						console.log(chalk.cyan(this._cciRec, this._volume, this._vema, this._vosc, this._ultOsc));
						if(this._volume > this._vema * 1.35){
							if(this._cciRec){
								if(this._vosc > 20){
									if(this._ultOsc > 70){
									//market sell here
									this.sellEvent = {
										product_id: this.strat.product_id,
										side: 'sell', 
										price: this.strat.sets.allPrices[this.strat.sets.allPrices.length-1],
										time: Date.now()
									};
									//this.recs = this.buffer.recs.chain().data();
									/*if(this.recs && this.recs.length > 0){
										this.recs.forEach( rec =>{
											if (rec.product_id === this.sellEvent.product_id){
												this.buffer.recs.remove(rec);
											}
										});
										this.buffer.recs.insert(this.sellEvent);
									} else {
										this.buffer.recs.insert(this.sellEvent);
									}*/
									console.log(Date.now(), chalk.magenta("# SELL EVENT CREATED-> overbought", this.strat.product_id, this.strat.sets.allPrices[this.strat.sets.allPrices.length-1]));
									Model.Rec.create(this.sellEvent);
								};
								if(this._ultOsc < 30){
									//market buy
									this.buyEvent = {
										product_id: this.strat.product_id,
										side: 'buy', 
										price: this.strat.sets.allPrices[this.strat.sets.allPrices.length-1],
										time: Date.now()
									};
									/*
									this.recs = this.buffer.recs.chain().data();
									if(this.recs && this.recs.length > 0){
										this.recs.forEach( rec =>{
											if (rec.product_id === this.buyEvent.product_id){
												this.buffer.recs.remove(rec);
											}
											try {
												this.buffer.recs.insert(this.buyEvent);
											} catch (err){
												console.log(err);
											}
										});
									} else {
										this.buffer.recs.insert(this.buyEvent);
									}
									*/
									console.log(Date.now(), chalk.magenta('# BUY EVENT CREATED  -> over sold', this.strat.product_id, this.strat.sets.allPrices[this.strat.sets.allPrices.length-1]));
									Model.Rec.create(this.buyEvent);
								};
							};
						};
					};
				});
};
};
};
runStrats(buffer, prods, period){
	console.log(chalk.green('#runstrats'));
	var buffer = buffer.strats;
		//console.log('-------',buffer); 
		this.prods = prods;
		this.strats = [];
		this.prods.forEach(product=>{
			this.product = product.reverse();
			this.period = period;
			if(this.product && this.product.length > 0){
				this.product_id = this.product[0].product_id;
				//console.log(this.product[0].time, this.product[this.product.length-1].time);
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
						ema: 	this.strat.ema(		this.priceSets.allPrices, {period: period}),
						vema: 	this.strat.ema(		this.priceSets.volume, {period: period}),
						macd: 	this.strat.macd(	this.priceSets, {short: period*12, long: period*26, period: period}),
						rsi: 	this.strat.rsi(		this.priceSets, {period: Math.pow(period, period)}),
						sma:    this.strat.sma(		this.priceSets, {period: period}),
						stoch: 	this.strat.stoch(	this.priceSets, {kPeriod: 5, kSlowingPeriod: 3 , dPeriod: 3}),
						ultOsc: this.strat.ultOsc(	this.priceSets, {short: period*1.25, medium: period * 2 , long: period * 3}),
						vosc:   this.strat.vosc( 	this.priceSets, {short: period*1.25, long: period*3}),
					};
					this.strats.push({
						product_id: this.product_id,
						sets:       this.priceSets,
						strategies: this.strategies
					});
				}
			}
		});
		var that = this;
		return Promise.all(this.strats.map( s =>{
			return Promise.all(Object.values(s.strategies)).then( (data)=>{
				console.log(chalk.gray('_stategyData', data.length))
				s.data = data;
				buffer.insert(s);
				return data;
			});	
		})).then(function(data){
			that.runAlgo(data);
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
		console.log(chalk.gray('_createcandles'));
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
	runBlaster(buffers){
		this.buffers = buffers;
		this.getProductsByInterval(null,['BTC-USD']);

	};
	getProductsByInterval(interval, productList, raw, limit){
		this.promises = [];
		this.now = new Date(); 
		this.raw = raw || false;
		this.limit = limit || 1000000;

		this.from = moment(this.now).subtract(7, 'days').format();

		Ticker.findAll({ 
			where: {
				product_id: productList[0],
				createdAt: {
					[Op.gt]: this.from
				},
			},
			order: [['id', 'DESC']],
			limit: this.limit,
			raw:   this.raw
		}).then( (tickers)=>{
			//create candles
			//run strategies against candles
			//new stuff
		})
	}

	getProducts(interval, productList, raw, limit){
		this.promises = []; 
		this.now = new Date();
		this.raw = raw || false;
		this.limit = limit || 25000;
		if(interval){
			this.when = moment(this.now).subtract(interval.amount, interval.type).format();
		} else {
			this.when = undefined;
		};
		for(let i=0; i < productList.length; i++){
			if(this.when){
				this.promise = Ticker.findAll({
					where: { 
						product_id: productList[i],
						createdAt: {
							[Op.gt]: this.when
						} 
					},
					order: [['id', 'DESC']],
					limit: this.limit,
					raw: this.raw
				});
			} else {
				this.promise = Ticker.findAll({
					where: {
						product_id: productList[i]
					},
					order: [['id', 'DESC']],
					limit: this.limit,
					raw: this.raw
				})
			}
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