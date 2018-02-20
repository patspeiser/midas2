const path   = require('path');
const chalk  = require('chalk');
const app    = require(path.join(__dirname, 'app'));
const server = require('http').createServer(app);
const config = require(path.join(__dirname, 'config')).config;
const db 	 = require(path.join(__dirname, 'db')).db;
const Gdax   = require(path.join(__dirname, 'Gdax'));
const port   = 3037;

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
	this.server.start(port);
	this.gdax   = new Gdax();
	this.gdax.ingestStream();
});

