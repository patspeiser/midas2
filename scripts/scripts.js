this.allPrices = document.getElementById('allPrices');
this.adx = document.getElementById('adx');
this.rsi = document.getElementById('rsi');
var socket = io(); 

class DataSet {
	constructor(data, label, options){
		if(data)
			this.data = data;
		if(label)
			this.label = label;
		if(options){
			this.options = options;
			this.processOptions(this.options);
		};
	};
	processOptions(options){
		this.options = options; 
		Object.keys(this.options).forEach( option=>{
			this.option = option;
			this.option = this.options[option]
		});
	};
};

class C {
	constructor(chart){
		this.chart = chart;
		this.config = {
			type: 'line',
			data: {
				labels: [],
				datasets: []
			},
			responsive: false,
			title: {
				display: true,
				text:   'crypto'
			},
			hover: {
				mode: 'nearest',
				intersect: true
			},
			scales: {
				xAxes: [{
					display: true,
					scaleLabel: {
						display: true,
						labelString: 'something'
					}
				}],
				yAxes: [{
					display: true,
					scaleLabel: {
						display: true,
						labelString: 'something else'
					},
				}],
			},
		};
		this.chart = new Chart(this.chart, this.config);
	};
}

/*
this.allPrices = new C(this.allPrices).init().then( allPricesChart=>{
	this.allPricesChart = allPricesChart;
});
this.adx = new C(this.adx).init().then(adxIndicator=>{
	this.adxIndicator = adxIndicator;
});
*/
this.allPricesChart = new C(this.allPrices).chart;
this.adxIndicator   = new C(this.adx).chart;
this.rsiIndicator   = new C(this.rsi).chart;
socket.on('refreshChart', (payload)=>{
	//datsets
	this.strategies = payload.strategies;
	this.allPricesChart.data.datasets = [];
	this.adxIndicator.data.datasets   = [];
	this.rsiIndicator.data.datasets   = [];
	//labels
	this.allPricesChart.data.labels   = [];
	this.adxIndicator.data.labels     = [];
	this.rsiIndicator.data.labels     = [];

	//graph
	if(this.strategies && this.strategies[0]){
		this.allPricesChart.data.datasets.push({
			label: 'all',
			data: this.strategies[0].sets.allPrices
		});
		this.allPricesChart.data.labels = Object.keys(this.strategies[0].sets.allPrices);
		this.allPricesChart.update({duration: 0});
		
		this.adxIndicator.data.datasets.push({
			label: 'adx',
			data: this.strategies[0].data[0][0]
		});
		this.adxIndicator.data.labels = Object.keys(this.strategies[0].data[0][0]);
		this.adxIndicator.update({duration: 0});

		this.rsiIndicator.data.datasets.push({
			label: 'rsi',
			data: this.strategies[0].data[6][0]
		});
		console.log(this.strategies[0].data[6][0])
		this.rsiIndicator.data.labels = Object.keys(this.strategies[0].data[6][0]);
		this.rsiIndicator.update({duration: 0});
	};
});

