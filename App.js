const chalk = require('chalk');
const express = require('express');
const path    = require('path');

class App {
	constructor(){
		this.app = express();
	};
	setRoutes(){
		this.app.use(express.static('node_modules'));
		this.app.use(express.static('scripts'));
		this.app.get('/', (err, res, next)=>{
			if(err){
				//console.error(err);
			}
			res.sendFile('index.html', {root: './'});
		});
	};
};

module.exports = App;

