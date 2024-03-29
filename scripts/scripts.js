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
			options: {
				elements: {
					line: {
						tension: 0
					}
				}
			},
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

var _allPricesElement 	= document.getElementById('allPrices');
var _allPricesChart 	= new C(_allPricesElement).chart;
var _voscElement 		= document.getElementById('vosc');
var _voscChart 			= new C(_voscElement).chart;
var _adxElement 		= document.getElementById('adx');
var _adxChart 			= new C(_adxElement).chart;
var _ultOscElement 		= document.getElementById('ultOsc');
var _ultOscChart 		= new C(_ultOscElement).chart; 
var _rsiElement 		= document.getElementById('rsi');
var _rsiChart 			= new C(_rsiElement).chart;
var _cciElement 		= document.getElementById('cci');
var _cciChart 			= new C(_cciElement).chart;
var _macdElement 		= document.getElementById('macd');
var _macdChart 			= new C(_macdElement).chart;
var _volumeElement 		= document.getElementById('volume');
var _volumeChart 			= new C(_volumeElement).chart;

class A{
	constructor(data){
		this.name = '#>' + Date.now();
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
		if(this.set && Object.keys(this.set.strategies).indexOf(this.name) >= 0){
			this.index = Object.keys(this.set.strategies).indexOf(this.name);
			return this.getStrategySetById(this.index, this.set);
		};
	};
	run(){
		this.set = this.getProductSetById(2);
		if(this.set){
			this.adx 	= this.getStrategyByName('adx', this.set)[0];
			this.ultOsc = this.getStrategyByName('ultOsc', this.set)[0];
			this.cci    = this.getStrategyByName('cci', this.set)[0];
			this.rsi    = this.getStrategyByName('rsi', this.set)[0];
			this.macd   = this.getStrategyByName('macd', this.set);
			this.vosc   = this.getStrategyByName('vosc', this.set)[0];
			this.vema   = this.getStrategyByName('vema', this.set)[0];
			_volumeChart.data.datasets.push({
				label: 'vema',
				data: this.vema,
				borderColor: 'rgba(0, 0, 100, 0.1)',
				backgroundColor: 'rgba(0, 0, 100, 0.1)'
			});		
			//adx
			_adxChart.data.labels   = Object.keys(this.adx);
			_adxChart.data.datasets = [{
				label: 'adx',
				data : this.adx
			}];
			_adxChart.update({duration: 0});
		
			//ultosc
			_ultOscChart.data.labels = Object.keys(this.ultOsc);
			_ultOscChart.data.datasets = [{
				label: 'ultOsc',
				data : this.ultOsc
			}];
			_ultOscChart.update({duration: 0});
			
			//cci
			_cciChart.data.labels = Object.keys(this.cci);
			_cciChart.data.datasets = [{
				label: 'cci',
				data : this.cci
			}];
			_cciChart.update({duration: 0});
			
			//rsi 
			_rsiChart.data.labels = Object.keys(this.rsi);
			_rsiChart.data.datasets = [{
				label: 'rsi',
				data : this.rsi
			}];
			_rsiChart.update({duration: 0});
			
			//macd
			_macdChart.data.labels = Object.keys(this.macd[0]);
			_macdChart.data.datasets = [{
				label: 'macd',
				data : this.macd[0],
				borderColor: 'rgba(0, 0, 0, 0.1)'
			},{
				label: 'macd signal',
				data : this.macd[1],
				borderColor: 'rgba(0, 100, 0, 0.1)'
			}];
			/*{
				label: 'macd histo',
				data : this.macd[2],
				borderColor: 'rgba(0, 0, 100, 0.1)'
			}];
			*/
			/*
			this.macdMin = 0
			this.macdMax = 0
			for (let i = 0; i< this.macd.length-1; i++){
				if (this.macd[i] > this.macdMax){
					this.macdMax = this.macd[i];
				};
				if(this.min === 0){
					this.macdMin = this.macd[i];
				} else if (this.macd[i] < this.macdMin){
					this.macdMin = this.macd[i];
				};
			};
			_macdChart.options.scales.yAxes[0].ticks.min = this.macdMin;
			_macdChart.options.scales.yAxes[0].ticks.max = this.macdMax;
			*/
			_macdChart.update({duration: 0});

			//vosc
			_voscChart.data.labels = Object.keys(this.vosc);
			_voscChart.data.datasets = [{
				label: 'vosc',
				data : this.vosc
			}];
			_voscChart.update({duration: 0});
		};	
		//if the recent adx > 75
		//if(this.adx[this.adx.length-1] > 90)
		//ultosc < 30 = oversold	
		//ultosc > 70 = overbought - sell
		//need cci
		//need rsi
	};
};


socket.on('refreshChart', (payload)=>{
	this.strategies = payload.strategies;
	this._strat      = this.strategies[0];
	//load any non-strategy data into charts here
	//strategy charts are called from run() for now.
	//refactor later.	
	//datsets
	_allPricesChart.data.datasets = [];
	_volumeChart.data.datasets = [];	
	
	//labels
	_allPricesChart.data.labels   = [];
	_volumeChart.data.labels   = [];	
	//graph
	if(this.strategies && this._strat){
		this.A = new A(this.strategies).run();
		_allPricesChart.data.datasets.push({
			label: 'all',
			data: this._strat.sets.allPrices
		});
		_allPricesChart.data.labels = Object.keys(this._strat.sets.allPrices);
		_allPricesChart.update({duration: 0});

		_volumeChart.data.datasets.push({
			label: 'volume',
			data: this._strat.sets.volume
		});
		_volumeChart.data.labels = Object.keys(this._strat.sets.volume);
		_volumeChart.update({duration: 0});
	};
});



