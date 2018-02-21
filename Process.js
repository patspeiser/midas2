const chalk = require('chalk');
console.log(chalk.magenta('process handler initialized'));

class Process{
	constructor(context, fn, interval){
		setInterval( ()=>{
			fn.call(context,);
		}, interval)
	};
};

module.exports = Process;