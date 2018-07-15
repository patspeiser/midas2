var environment = process.env.SITE_ENVIRONMENT;

if (!process.env.SITE_ENVIRONMENT){
	environment = 'dev';
}

const config = {
	dev:{  
		gdax: {
			baseUrl: 'https://api-public.sandbox.gdax.com',
			websocketUrl: 'wss://ws-feed-public.sandbox.gdax.com',
			auth: {
				passphrase: 'o1driq739wh',
				apiKey: '299dce4ab5f4c50a6191f41c0901f188',
				apiSecret: 'dExRr2g7yJ/Of9/EERRiHxTvMq3XCFD5H6uyF7asD/Y609RbyeWhInHsuSlejYffQzm3qr4/vj7xKTdIs/cWHw=='
			}
		}
	},
	prod: {
		gdax: {
			baseUrl: 'https://api.gdax.com',
			websocketUrl: 'wss://ws-feed.gdax.com',
			auth: {
				passphrase: 'bqgsfy3rv4f',
				apiKey: '84e867fceb4cbc8a9a600d669728d5d8',
				apiSecret: 's+mVAzjUmHNbKlfEk3fowsfjjqEniXQZQlfXmbB74h3owVH1RJ1Dj5AsJgTw2j9pi2QLG3ppuPykv+lyj4lLSg=='
			}
		}
	}
}

module.exports = {
	config: config[environment]
}