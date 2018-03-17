this.chartElement = document.getElementById('chart');
this.chart = new Chart(this.chartElement);
var socket = io(); 
socket.on('refreshStrategies', (payload)=>{
	console.log('fresh');
	this.strategies = payload.strategies;
	if(this.strategies && this.strategies.length > 0){
		this.list = this.strategies[0].sets.allPrices;
		this.min = 0;
		this.max = 0;
		this.labels = [];
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
		this.config = {
			type: 'line',
			data: {
				labels: this.strategies[0].sets.allPrices,
				datasets: [{
					label: 'NEW SET',
					borderColor: 'rgb(255, 99, 132)',
					data: this.strategies[0].sets.allPrices,
					fill: false
				}]
			},
			responsive: true,
			title: {
				display: true,
				text:   'title here'
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
						min: this.min * .999,
						max: this.max * 1.001
					}
				}]
			}
		}
		this.chart.config = this.config;
		this.chart.update({duration: 0});	
		console.log(this.chart, this.config);
	}
})
