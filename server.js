const path   	= require('path');
const chalk  	= require('chalk');
const server 	= require('http').createServer();
const db 	 	= require(path.join(__dirname, 'db')).db;
const Gdax   	= require(path.join(__dirname, 'Gdax'));
const Process 	= require(path.join(__dirname, 'Process'));
const Strategy 	= require(path.join(__dirname, 'Strategy'));
const Candle 	= require(path.join(__dirname, 'Candle'));
const Valid 	= require(path.join(__dirname, 'Valid'));
const port   	= process.env.PORT || 3037;

class Server{
	constructor(server){
		this.server = server;
	};
	start(port){
		this.server.listen(port, ()=>{
			console.log('on port', port);
		});
	};
};

db.sync()
.then( db =>{
	this.server = new Server(server);
	this.initialPriceList = new Valid();
	this.gdax   = new Gdax(this.initialPriceList);
	this.server.start(port);
	this.gdax.ingestStream();
	this.processBuffer  = new Process(this.gdax, this.gdax.processStream,  1000 * 30);
	this.updateAccounts = new Process(this.gdax, this.gdax.updateAccounts, 1000 * 5 );
	this.determine      = new Process(this.gdax, this.gdax.determine, 1000 * 30);
	this.strat          = new Process(this.gdax, this.gdax.createStrategy, 1000 * 1);
	this.displayValidPrices = new Process(this.gdax, this.gdax.displayValidPrices, 1000 * 20);
});
