const chalk = require('chalk');
const T = require('tulind');
console.log(chalk.yellow('##strategy handler##'));

class Strategy{
	constructor(name){
		this.name = name;
	};
};

module.exports = Strategy;