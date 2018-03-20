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
	//algo
	constructor(data){
		this.name = '_' + Date.now();
		this.data = data;
	};
	getSetById(id){
		if(this.data[id])
			return this.data[id];
	};
	run(){
		this.set = this.getSetById(0);
		this.set1 = this.getSetById(1);
		this.set2 = this.getSetById(2);
		this.set3 = this.getSetById(3);
		console.log(this.set, this.set1, this.set2, this.set3);
		//get 
	}

}

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



