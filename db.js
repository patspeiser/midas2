const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const urlString = "postgres://postgres:postgres@localhost/midas2";
const db = new Sequelize(process.env.DATABASE_URL || urlString, {
	logging: false,
	pool: {
		maxIdleTime: 60000,
		max: 30,
		acquire: 60000
	}
});

const Ticker = db.define('ticker', {
	type:  			{type: db.Sequelize.STRING},
	trade_id:  		{type: db.Sequelize.STRING},
	maker_order_id: {type: db.Sequelize.STRING},
	taker_order_id: {type: db.Sequelize.STRING},
	side: 			{type: db.Sequelize.STRING},
	size: 			{type: db.Sequelize.FLOAT},
	price: 			{type: db.Sequelize.FLOAT},
	product_id: 	{type: db.Sequelize.STRING},
	sequence: 		{type: db.Sequelize.STRING},
	time: 			{type: db.Sequelize.STRING},
});

const ValidPrice = db.define('valid_price', {
	product_id: {type: db.Sequelize.STRING}, 
	price: 		{type: db.Sequelize.FLOAT}, 
	time: 		{type: db.Sequelize.STRING}, 
});

const Account = db.define('account', {
	account_id:   	    {type: db.Sequelize.STRING},
	currency: 			{type: db.Sequelize.STRING},
	balance: 			{type: db.Sequelize.STRING},
	available:   		{type: db.Sequelize.STRING},
	hold: 				{type: db.Sequelize.JSON},
	profile_id: 		{type: db.Sequelize.STRING},
});
const Transaction = db.define('transaction', {
	transaction_id: {type: db.Sequelize.STRING},
	product_id:  	{type: db.Sequelize.STRING},
	price: 			{type: db.Sequelize.FLOAT},
	size:           {type: db.Sequelize.FLOAT},
	side:  			{type: db.Sequelize.STRING},
	reason:         {type: db.Sequelize.STRING},
 	time:           {type: db.Sequelize.STRING}, 
	amount:         {type: db.Sequelize.FLOAT}, 
});
const Rec = db.define('rec', {
	product_id: {type: db.Sequelize.STRING},
	price: 		{type: db.Sequelize.FLOAT},
	side: 		{type: db.Sequelize.STRING},
	time: 		{type: db.Sequelize.STRING}
});

module.exports = {
	db: db,
	Op: Op,
	models: {
		Ticker:     Ticker,
		ValidPrice: ValidPrice,
		Account:    Account,
		Transaction: Transaction,
		Rec: Rec
	}
};