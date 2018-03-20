this.allPrices = document.getElementById('allPrices');
this.adx = document.getElementById('adx');
this.rsi = document.getElementById('rsi');
this.cci = document.getElementById('cci');
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

this.allPricesChart = new C(this.allPrices).chart;
this.adxIndicator   = new C(this.adx).chart;
this.rsiIndicator   = new C(this.rsi).chart;
this.cciIndictaor   = new C(this.cci).chart;
socket.on('refreshChart', (payload)=>{
	this.strategies = payload.strategies;
	console.dir(this.strategies);
	this._strat = this.strategies[0];
	//datsets
	this.allPricesChart.data.datasets = [];
	this.adxIndicator.data.datasets   = [];
	this.rsiIndicator.data.datasets   = [];
	//labels
	this.allPricesChart.data.labels   = [];
	this.adxIndicator.data.labels     = [];
	this.rsiIndicator.data.labels     = [];

	//graph
	if(this.strategies && this._strat){
		this.workingStrat = new Persia();
		console.log(this.strategies[0].sets.allPrices.length, this._strat.data[2][0].length )
		this.allPricesChart.data.datasets.push({
			label: 'all',
			data: this._strat.sets.allPrices
		});
		this.allPricesChart.data.labels = Object.keys(this._strat.sets.allPrices);
		this.allPricesChart.update({duration: 0});
	};
});



