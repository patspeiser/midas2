const chalk = require('chalk');
const T = require('tulind');
console.log(chalk.yellow('##strategy handler##'));

class Strategy{
	constructor(name){
		this.name = name;
		console.log();
	};
	adx(set, options){
		this.set = set;
		this.options = options;
		this.short = this.options.short;
		this.long  = this.options.long;
		this.signal = this.options.signal;
		return new Promise( (resolve, reject)=>{
			T.indicators.adx.indicator([set], [this.short, this.long, this.signal], (err, res)=>{
				resolve(res);
				reject(err);
			});
		});
	};
	atr(high, low, close, options){
		this.high = high;
		this.low  = low;
		this.close = close;
		this.options = options;
		this.period  = this.options.period;
		return new Promise( (resolve,reject)=>{
			T.indicators.atr.indicator([this.high, this.low, this.close], [this.period], (err, res)=>{
				resolve(res);
				reject(err);
			});
		});
	};	
	bbands(set, options){
		this.set     = set;
		this.options = options;
		this.period = this.options.period;
		this.stdDev = this.options.stdDev;
		return new Promise( (resolve,reject)=>{
			T.indicators.bbands.indicator([set], [10,1], (err, res)=>{
				resolve(res);
				reject(err);
			});
		});
	};
	cci(high, low, close, options){
		this.high = high;
		this.low  = low;
		this.close = close;
		this.options = options;
		this.period  = this.options.period;
		return new Promise( (resolve,reject)=>{
			T.indicators.cci.indicator([this.high, this.low, this.close], [this.period], (err, res)=>{
				resolve(res);
				reject(err);
			});
		});
	};
	ema(set, options){
		this.set = set;
		this.options = options;
		this.period = this.options.period;
		return new Promise( (resolve, reject)=>{
			T.indicators.ema.indicator([this.set], [this.period], (err, res)=>{
				resolve(res);
				reject(err);
			});
		});
	};
	macd(set, options){
		this.set    = set;
		this.short  = options.short;
		this.long   = options.long;
		this.period = options.period;
		return new Promise( (resolve, reject)=>{
			T.indicators.macd.indicator([this.set], [this.short, this.long, this.period], (err, res)=>{
				resolve(res);
				reject(err);
			});
		});
	};
	rsi(set, options){
		this.set = set;
		this.options = options;
		this.period = this.options.period;
		return new Promise( (resolve, reject)=>{
			T.indicators.rsi.indicator([this.set], [this.period], (err, res)=>{
				this.err = err;
				this.res = res;
				resolve(this.res);
				reject(this.err);
			});
		});
	};
	stoch(high, low, close, options){
		this.high 			= high;
		this.low  			= low;
		this.close 			= close;
		this.options 		= options;
		this.kPeriod        = this.options.kPeriod;
		this.kSlowingPeriod = this.options.kSlowingPeriod;
		this.dPeriod        = this.options.dPeriod; 
		return new Promise( (resolve,reject)=>{
			T.indicators.stoch.indicator([this.high, this.low, this.close], [this.kPeriod, this.kSlowingPeriod, this.dPeriod], (err, res)=>{
				resolve(res);
				reject(err);
			});
		});
	};
	sma(set, options){
		this.set = set;
		this.options = options;
		this.period  = this.options.period; 
		return new Promise( (resolve,reject)=>{
			T.indicators.sma.indicator([this.set],[this.period], (err, res)=>{
				resolve(res);
				reject(err);		
			});
		});
	};
	ultosc(high, low, close, options){
		this.high 			= high;
		this.low  			= low;
		this.close 			= close;
		this.options 		= options;
		this.short        	= this.options.short;
		this.medium 		= this.options.medium;
		this.long        	= this.options.long; 
		return new Promise( (resolve,reject)=>{
			T.indicators.ultosc.indicator([this.high, this.low, this.close], [this.short, this.medium, this.long], (err, res)=>{
				resolve(res);
				reject(err);
			});
		});
	};
};

/*
-Relative Strength Index (RSI)
-Stochastic Oscillator
-Moving Average Convergence Divergence (MACD)
-Average Directional index (ADX)
/Commodity Channel Index (CCI)
-Average True Range (ATR)
Elder ray — Bulls/Bears Power.
High-Low Index
Williams R% - %R = (Highest High - Close)/(Highest High - Lowest Low) * -100
Ultimate Oscillator
Price Rate Of Change
Stochastic RSI
*/

module.exports = Strategy;