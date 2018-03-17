const path   	= require('path');
const chalk  	= require('chalk');
const fs        = require('fs');
const App 	    = require(path.join(__dirname, 'App'));
const app       = new App();
const server 	= require('http').createServer(app.app);
const db 	 	= require(path.join(__dirname, 'Db')).db;
const Gdax   	= require(path.join(__dirname, 'Gdax'));
const Process 	= require(path.join(__dirname, 'Process'));
const Strategy 	= require(path.join(__dirname, 'Strategy'));
const io 		= require(path.join(__dirname, 'Socket'));
const Buffer = require(path.join(__dirname, 'Buffer'));
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
					this.services = this.startServices(this.server);
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
		this.port = port; 
		return new Promise( (resolve, reject)=>{
			this.listen = this.server.listen(this.port, ()=>{
				console.log(chalk.cyan('##http server##', this.port));
			});
			resolve(this.listen);
			reject('errstartServer');
		});
	};
	startServices(server){
		//now the servers up
		//init memory buckets here then
		//init additional services (socket server, gdax, etc);
		this.server 			= server;
		this.buffer = new Buffer().init().then( (buffers)=>{
			this.buffers = buffers; 
			this.io   = new io(this.server, this.buffers).init();
			this.gdax = new Gdax(this.buffers).init();
			this.routes = app.setRoutes();
		});
	};
};

module.exports = Server;
this.server = new Server(server).init();
