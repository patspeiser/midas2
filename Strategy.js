const chalk = require('chalk');
const T = require('tulind');
console.log(chalk.yellow('##strategy handler##'));

class Strategy{
	constructor(name){
		this.name = name;
	};
	adx(sets, options){
		//Average Directional Movement Index
		//over 25  === strong
		this.sets 		= sets;
		this.options 	= options;
		this.period 	= this.options.period;
		return new Promise( (resolve, reject)=>{
			T.indicators.adx.indicator([this.sets.high, this.sets.low, this.sets.close], [this.period], (err, res)=>{
				resolve(res);
				reject(err);
			});
		});
	};
	atr(sets, options){
		//Average True Range
		this.sets = sets;
		this.options = options;
		this.high = this.sets.high;
		this.low  = this.sets.low;
		this.close = this.sets.close;
		this.period  = this.options.period;
		return new Promise( (resolve,reject)=>{
			T.indicators.atr.indicator([this.high, this.low, this.close], [this.period], (err, res)=>{
				resolve(res);
				reject(err);
			});
		});
	};	
	bbands(sets, options){
		//Bollinger Bands
		this.sets    = sets;
		this.options = options;
		this.period = this.options.period;
		this.stdDev = this.options.stdDev;
		return new Promise( (resolve,reject)=>{
			T.indicators.bbands.indicator([this.sets.allPrices], [this.period, this.stdDev], (err, res)=>{
				resolve(res);
				reject(err);
			});
		});
	};
	cci(sets, options){
		//Commodity Channel Index
		this.sets = sets;
		this.options = options;
		this.high = this.sets.high;
		this.low  = this.sets.low;
		this.close = this.sets.close;
		this.period  = this.options.period;
		return new Promise( (resolve,reject)=>{
			T.indicators.cci.indicator([this.high, this.low, this.close], [this.period], (err, res)=>{
				resolve(res);
				reject(err);
			});
		});
	};
	ema(sets, options){
		//Exponential Moving Average
		this.sets = sets;
		this.options = options;
		this.period = this.options.period;
		return new Promise( (resolve, reject)=>{
			T.indicators.ema.indicator([this.sets.allPrices], [this.period], (err, res)=>{
				resolve(res);
				reject(err);
			});
		});
	};
	macd(sets, options){
		//Moving Average Convergence/Divergence
		this.sets    = sets;
		this.options = options;
		this.short  = this.options.short;
		this.long   = this.options.long;
		this.period = this.options.period;
		return new Promise( (resolve, reject)=>{
			T.indicators.macd.indicator([this.sets.allPrices], [this.short, this.long, this.period], (err, res)=>{
				resolve(res);
				reject(err);
			});
		});
	};
	rsi(sets, options){
		//Relative Strength Index
		this.sets = sets;
		this.options = options;
		this.period = this.options.period;
		return new Promise( (resolve, reject)=>{
			T.indicators.rsi.indicator([this.sets.allPrices], [this.period], (err, res)=>{
				resolve(res);
				reject(err);
			});
		});
	};
	sma(sets, options){
		//Simple Moving Average
		this.sets = sets;
		this.options = options;
		this.period  = this.options.period; 
		return new Promise( (resolve,reject)=>{
			T.indicators.sma.indicator([this.sets.allPrices],[this.period], (err, res)=>{
				resolve(res);
				reject(err);		
			});
		});
	};
	stoch(sets, options){
		//Stochastic Oscillator
		this.sets = sets;
		this.options 		= options;
		this.kPeriod        = this.options.kPeriod;
		this.kSlowingPeriod = this.options.kSlowingPeriod;
		this.dPeriod        = this.options.dPeriod; 
		return new Promise( (resolve,reject)=>{
			T.indicators.stoch.indicator([this.sets.high, this.sets.low, this.sets.close], [this.kPeriod, this.kSlowingPeriod, this.dPeriod], (err, res)=>{
				resolve(res);
				reject(err);
			});
		});
	};
	ultOsc(sets, options){
		//Ultimate Oscillator
		this.sets = sets;
		this.options 		= options;
		this.short        	= this.options.short;
		this.medium 		= this.options.medium;
		this.long        	= this.options.long; 
		return new Promise( (resolve,reject)=>{
			T.indicators.ultosc.indicator([this.sets.high, this.sets.low, this.sets.close], [this.short, this.medium, this.long], (err, res)=>{
				console.log(res);
				resolve(res);
				reject(err);
			});
		});
	};
};

/*
Elder ray — Bulls/Bears Power.
High-Low Index
Williams R% - %R = (Highest High - Close)/(Highest High - Lowest Low) * -100
Price Rate Of Change
Stochastic RSI
*/

module.exports = Strategy;