const chalk = require('chalk');
const io = require('socket.io');
class Socket {
	constructor(server){
		console.log('##socket server##');
		this.server = server;
	};
	init(){
		this.io = io(this.server);			
	};
	listen(io){
		this.io = io;
		return new Promise( (resolve, reject)=>{
			this.io.on('connection', socket=>{
				resolve(socket);
			});
		});
	};
};

module.exports = Socket;