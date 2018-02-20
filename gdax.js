const gdax = require('gdax');
const path = require('path');
const config = require(path.join(__dirname, 'config'));

class Gdax {
	constructor(){
		this.socket = new gdax.WebsocketClient(
			this.prods,
			config.websocketUrl,
			null,
			['full']
		);
	};

	ingestStream(){
		this.socket.on('message', data =>{
			console.log(data);
		});
	};
};

module.exports = Gdax;