const chalk = require('chalk');
console.log(chalk.magenta('process handler initialized'));

class Process{
	constructor(name, startScript){
		this.name = name; 
		this.startScript = startScript;
	};
};

module.exports = Process;