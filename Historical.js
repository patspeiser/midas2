const readline = require('readline');
const chalk = require('chalk');
const path  = require('path');
const moment = require('moment');
const Ticker = require(path.join(__dirname,'db')).models.Ticker;
const Op = require(path.join(__dirname, 'db')).Op;
const Strategy = require(path.join(__dirname, 'Strategy'));

class Historical {
	constructor(){};
	init(){
		this.interface = this.createInterface();
		this.handleCmd('run');
		this.strat = new Strategy('historical');
	};
	createInterface(){
		const rl = readline.createInterface({
			input : process.stdin,
			output: process.stdout,
			prompt: '\n$> \n' 
		});
		rl.prompt();
		rl.on('line', (line)=>{
			this.cmd = line.trim();
			this.handleCmd(this.cmd);
		}).on('close', ()=>{
			process.exit(0);
		})
	};
	handleCmd(cmd){
		this.cmd = cmd;
		switch(this.cmd) {
			case 'run':
				let period = 8;
				this.now = Date.now();
				this.when = moment(this.now).subtract(48, 'hours').format(); 
				Ticker.findAll({
					where: { 
						product_id: 'BTC-USD',
						createdAt: {
							[Op.gt]: this.when
						} 
					},
					order: [['id', 'DESC']],
					limit: 100000,
					raw: true
				}).then( results =>{
					this.results = (results) ? results.reverse() : [];
					this.candles = this.createCandles(this.results, period);
					this.prices = [];
					this.candles.map( c =>{
						return this.prices.push(c.price); 
					});
					this.highs   = [];
					this.lows    = [];
					this.opens   = [];
					this.closes  = [];
					this.volumes = [];
					this.strats  = [];
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
						if (this.strats){
							Promise.all(Object.values(this.strats[0].strategies)).then( (data)=>{
								//console.log('hup', data.length, data)
								return data;
							});	
						};
					};
					//console.log(this.candles);
				});
				break;
			default:
				break;
			};
		};

	createCandles(set, period, id){
		this.set = set;
		this.period = period;
		this.candles = [];
		this.set = set;
		this.period = period * ( 60 * 1000 );
		if(this.set && this.set[0]){
			this.startTime = new Date(this.set[0].time).getTime();
			this.endTime   = this.startTime + this.period;
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
					//console.log(this.eventTime, this.endTime, this.eventTime < this.endTime);
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
};

module.exports = Historical;