const chalk = require('chalk');
const io = require('socket.io');
const path = require('path');
const Process 	= require(path.join(__dirname, 'Process'));

class Socket {
	constructor(server, buffers){
		console.log(chalk.cyan('##socket server##'));
		this.server = server;
		this.buffers = buffers;
	};
	init(){
		this.io = io(this.server);			
		this.listen(this.io);
	};
	listen(io){
		this.io = io;
		this.io.on('connection', socket=>{
			console.log(chalk.green('connection'));
			setInterval( (socket)=>{
				this.strats = this.buffers.strats.chain().data();
				if(this.strats){
					this.io.emit('refreshChart', { strategies: this.strats});
				}	
			}, 2000);
		});
	};
};

module.exports = Socket;