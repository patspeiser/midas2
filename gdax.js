const gdax = require('gdax');
const path = require('path');
const chalk = require('chalk');
const config = require(path.join(__dirname, 'config'));
const Buffer = require(path.join(__dirname, 'Buffer'));

class Gdax {
	constructor(){
		this.socket = new gdax.WebsocketClient(
			this.prods,
			config.websocketUrl,
			null,
			['full']
		);
		this.buffer = new Buffer();
		this.messages = this.buffer.addCollection('message');
	};
	ingestStream(){
		this.socket.on('message', data =>{
			if(data.type === 'done' && data.reason === 'filled' && data.price){
				this.buffer.addEventToCollection(data, this.messages);
			}
		});
	};
	processStream(){
		this.buffer.processBuffer(this.messages);
	};
};

module.exports = Gdax;