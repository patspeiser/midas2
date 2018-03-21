this.allPrices = document.getElementById('allPrices');
this.adx = document.getElementById('adx');
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
	//Chart! couldn't use Chart because there is a lot of shit already named Chart
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

class A{
	constructor(data){
		this.name = '_' + Date.now();
		this.data = data;
	};
	getProductSetById(id){
		this.id  = id;
		return this.data[this.id];
	};
	getStrategySetById(id, set){
		this.id  = id;
		this.set = set; 
		if(this.set && this.set.data[this.id]){
			return this.set.data[this.id];
		}
	};
	getStrategyByName(name, set){
		this.name 		= name;
		this.set 		= set;
		if(this.set.strategies.indexOf(this.name) >= 0){
			this.index = this.set.strategies.indexOf(this.name);
			return this.getStrategySetById(this.index, this.set);
		};
	};
	run(){
		this.set 	= this.getProductSetById(2);
		this.adx 	= this.getStrategyByName('adx', this.set)[0];
		this.ultosc = this.getStrategyByName('ultosc', this.set)[0];
		this.cci    = this.getStrategyByName('cci', this.set);
		this.rsi    = this.getStrategyByName('cci', this.rsi);
		this.overbought = false;
		this.oversold   = false;
		if(this.ultosc[this.ultosc.length-1] >= 90){
			this.overbought = true;
		}
		if(this.ultosc[this.ultosc.length-1] <= 10){
			this.oversold   = true;
		}
		//if the recent adx > 75
		//if(this.adx[this.adx.length-1] > 90)
		//ultosc < 30 = oversold	
		//ultosc > 70 = overbought - sell
		//need cci
		//need rsi
	};
};

this.allPricesChart = new C(this.allPrices).chart;
socket.on('refreshChart', (payload)=>{
	this.strategies = payload.strategies;
	this._strat      = this.strategies[0];
	//datsets
	this.allPricesChart.data.datasets = [];
	
	//labels
	this.allPricesChart.data.labels   = [];
	
	//graph
	if(this.strategies && this._strat){
		this.A = new A(this.strategies).run();
		this.allPricesChart.data.datasets.push({
			label: 'all',
			data: this._strat.sets.allPrices
		});
		this.allPricesChart.data.labels = Object.keys(this._strat.sets.allPrices);
		this.allPricesChart.update({duration: 0});
	};
});



