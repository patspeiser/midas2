const readline = require('readline');
const chalk = require('chalk');
const path  = require('path');
const moment = require('moment');
class Historical {
	constructor(){};
	init(){
		this.interface = this.createInterface();
	};
	createInterface(){
		const rl = readline.createInterface({
			input : process.stdin,
			output: process.stdout,
			prompt: '$> ' 
		});
		rl.prompt();
		rl.on('line', (line)=>{
			this.cmd = line.trim();
			this.handleCmd(this.cmd);
		}).on('close', ()=>{
			console.log('got close');
			process.exit(0);
		})
	};
	handleCmd(cmd){
		console.log(cmd);
		this.cmd = cmd;
		switch(this.cmd) {
			case 'run':
				console.log('got run');
				break;
			default:
				break;
		};
	};
};

module.exports = Historical;