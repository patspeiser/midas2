this.chartElement = document.getElementById('chart');
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
	constructor(chart, ){
		this.chart = new Chart(chart);
	};
	init(){
		return new Promise( (resolve, reject)=>{
			this.setConfig();
			this.initialDataSet();
			resolve(this.chart);
			reject(false)
		});
	}
	initialDataSet(){
		this.set = new DataSet(
			[], 
			'', 
			{
				borderColor: 'rgb(255, 99, 132)',
				fill: true 
			}
			);
	};
	setConfig(){
		this.config = {
			type: 'line',
			data: {
				labels: [],
				datasets: []
			},
			responsive: true,
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
					ticks: {
						//min: this.min * .999,
						//max: this.max * 1.001
					},
				}],
			},
		};
		this.chart.config = this.config;
	};
}



this.main = new C(this.chartElement).init().then( (chart)=>{
	this.chart = chart;

	socket.on('refreshChart', (payload)=>{
		this.chart.data.datasets = [];
		this.chart.data.labels   = [];
		this.strategies = payload.strategies;
		if(this.strategies && this.strategies[0]){
			this.list = this.strategies[0].sets.allPrices;
			this.min = 0;
			this.max = 0;
			this.labels = [];
			/*
			for (let i = 0; i< this.list.length-1; i++){
				this.labels.push(i);
				if (this.list[i] > this.max){
					this.max = this.list[i];
				};
				if(this.min === 0){
					this.min = this.list[i];
				} else if (this.list[i] < this.min){
					this.min = this.list[i];
				};
			};
			*/
			console.log(this.strategies[0].data);
			this.strategies[0].data.forEach( set => {
				this.set = set;
				this.dataset = new DataSet(this.set);
				this.chart.data.datasets.push(this.dataset.data);
				this.chart.data.labels.push(this.dataset.data);
			});
			this.chart.update({duration: 0});
		}
	})
});