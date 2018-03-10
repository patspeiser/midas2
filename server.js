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
	init(){
		return new Promise( (resolve, reject)=>{
			this.connectDb().then( db =>{
				this.db = db;
				this.startServer(port).then( server=>{
					this.server = server;
					this.services = this.startServices();
					resolve({
						db: this.db,
						server: this.server,
						services: this.services
					});
					reject('errinit');
				});
			});
		})
	};
	connectDb(){
		return new Promise( (resolve, reject)=>{
			db.sync().then( db =>{
				resolve(db);
				reject('errconnectDb');
			});
		});
	};
	startServer(port){
		return new Promise( (resolve, reject)=>{
			this.listen = this.server.listen(port, ()=>{
				console.log(chalk.cyan('...servers up', port));
			});
			resolve(this.listen);
			reject('errstartServer');
		});
	};
	startServices(){
		this.initialPriceList 	= new Valid();
		this.gdax 				= new Gdax(this.initialPriceList);
		this.gdax.ingestStream();
		this.processBuffer  	= new Process(this.gdax, this.gdax.processStream,  1000 * 30);
		this.updateAccounts		= new Process(this.gdax, this.gdax.updateAccounts, 1000 * 5 );
		this.determine     		= new Process(this.gdax, this.gdax.determine, 1000 * 5);
		this.displayValidPrices = new Process(this.gdax, this.gdax.displayValidPrices, 1000 * 20);
	};
};

this.server = new Server(server).init();
