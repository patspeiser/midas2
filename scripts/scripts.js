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

var _allPricesElement 	= document.getElementById('allPrices');
var _allPricesChart 	= new C(_allPricesElement).chart;
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
		if(this.set && this.set.strategies.indexOf(this.name) >= 0){
			this.index = this.set.strategies.indexOf(this.name);
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
			this.macd   = this.getStrategyByName('macd', this.set)[0];
			_adxChart.data.labels   = Object.keys(this.adx);
			_adxChart.data.datasets = [{
				label: 'adx',
				data : this.adx
			}];
			_adxChart.update({duration: 0});
			this.adxResult = false;
			if(this.adx[this.adx.length-1] >= 90){
				this.adxResult = true;
			};
			if(this.adx[this.adx.length-1] <= 10){
				this.adxResult   = true;
			};

			_ultOscChart.data.labels = Object.keys(this.ultOsc);
			_ultOscChart.data.datasets = [{
				label: 'ultOsc',
				data : this.ultOsc
			}];
			_ultOscChart.update({duration: 0});
			this.ultOscResult = false;
			if(this.ultOsc[this.ultOsc.length-1] >= 90){
				this.UltOscResult = true;
			};
			if(this.ultOsc[this.ultOsc.length-1] <= 10){
				this.ultOscResult   = true;
			};

			_cciChart.data.labels = Object.keys(this.cci);
			_cciChart.data.datasets = [{
				label: 'cci',
				data : this.cci
			}];
			_cciChart.update({duration: 0});
			this.cciResult = false;
			if(this.cci[this.cci.length-1] >= 90){
				this.adxResult = true;
			};
			if(this.cci[this.cci.length-1] <= 10){
				this.cciResult   = true;
			};

			_rsiChart.data.labels = Object.keys(this.rsi);
			_rsiChart.data.datasets = [{
				label: 'rsi',
				data : this.rsi
			}];
			_rsiChart.update({duration: 0});
			this.rsiResult = false; 
			if(this.rsi[this.rsi.length-1] >= 90){
				this.rsiResult = true;
			};
			if(this.rsi[this.rsi.length-1] <= 10){
				this.rsiResult   = true;
			};

			//macd
			_macdChart.data.labels = Object.keys(this.macd);
			_macdChart.data.datasets = [{
				label: 'macd',
				data : this.macd
			}];
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
				_macdChart.options.scales.yAxes[0].ticks.min = this.macdMin;
				_macdChart.options.scales.yAxes[0].ticks.max = this.macdMax;
				_macdChart.update({duration: 0});
			};
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
	//datsets
	_allPricesChart.data.datasets = [];
	
	//labels
	_allPricesChart.data.labels   = [];
	
	//graph
	if(this.strategies && this._strat){
		this.A = new A(this.strategies).run();
		_allPricesChart.data.datasets.push({
			label: 'all',
			data: this._strat.sets.allPrices
		});
		_allPricesChart.data.labels = Object.keys(this._strat.sets.allPrices);
		_allPricesChart.update({duration: 0});
	};
});



