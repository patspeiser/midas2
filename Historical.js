const readline = require('readline');
const chalk = require('chalk');
const path  = require('path');
const moment = require('moment');
const Ticker = require(path.join(__dirname,'db')).models.Ticker;
const Op = require(path.join(__dirname, 'db')).Op;

class Historical {
	constructor(){};
	init(){
		this.interface = this.createInterface();
		this.handleCmd('run');
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
					this.candles = this.createCandles(this.results, 8);
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
};

module.exports = Historical;