const chalk = require('chalk');
console.log(chalk.yellow('##process handler##'));

class Process{
	constructor(context, fn, interval){
		setInterval( ()=>{
			fn.call(context,);
		}, interval);
	};
};

module.exports = Process;