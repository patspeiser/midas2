const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const urlString = "postgres://postgres:postgres@localhost/midas2";
const db = new Sequelize(process.env.DATABASE_URL || urlString, {logging: false});

const Ticker = db.define('ticker', {
	type: 		{type: db.Sequelize.STRING},
	order_id: 	{type: db.Sequelize.STRING},
	order_type: {type: db.Sequelize.STRING},
	size: 		{type: db.Sequelize.FLOAT},
	price: 		{type: db.Sequelize.FLOAT},
	side: 		{type: db.Sequelize.STRING},
	client_oid: {type: db.Sequelize.STRING},
	product_id: {type: db.Sequelize.STRING},
	sequence:   {type: db.Sequelize.FLOAT},
	time: 		{type: db.Sequelize.STRING} 
});

const ValidPrice = db.define('valid_price', {
	product_id: {type: db.Sequelize.STRING}, 
	price: 		{type: db.Sequelize.FLOAT}, 
	time: 		{type: db.Sequelize.STRING}, 
});

const Account = db.define('account', {
	account_id:   	    {type: db.Sequelize.STRING},
	currency: 			{type: db.Sequelize.STRING},
	balance  : 			{type: db.Sequelize.STRING},
	available    : 		{type: db.Sequelize.STRING},
	hold: 				{type: db.Sequelize.JSON},
	profile_id: 		{type: db.Sequelize.STRING},
});

module.exports = {
	db: db,
	models: {
		Ticker:     Ticker,
		ValidPrice: ValidPrice,
		Account:    Account
	}
};