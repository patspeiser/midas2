const chalk = require('chalk');
const T = require('tulind');
console.log(chalk.yellow('##strategy handler##'));

class Strategy{
	constructor(name){
		this.name = name;
	};
	sma(set){
		T.indicators.sma.indicator([set],[10], (err, res)=>{
			console.log(res);
		});
	};
};

module.exports = Strategy;