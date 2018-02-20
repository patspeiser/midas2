const path   = require('path');
const chalk  = require('chalk');
const processHandler = require(path.join(__dirname, 'prochandle'));
const server = require('http').createServer();
const config = require(path.join(__dirname, 'config')).config;
const db 	 = require(path.join(__dirname, 'db')).db;
const port   = 3037;

db.sync()
.then( db =>{
	server.listen(port, ()=>{
		console.log(chalk.magenta('server on', port));
	});
});