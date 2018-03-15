const chalk = require('chalk');
const io = require('socket.io');
class Socket {
	constructor(server){
		console.log('##socket server##');
		this.server = server;
	};
	init(){
		this.io = io(this.server);			
		this.listen(this.io);
	};
	listen(io){
		this.io = io;
		this.io.on('connection', socket=>{
			console.log(chalk.green('connection'));
			//sockets	
		});
	};
};

module.exports = Socket;