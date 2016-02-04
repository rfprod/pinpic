function getRandomColor(){
	function c(){return Math.floor(Math.random()*256).toString(16);}
	var colorHEX = "#"+c()+c()+c();
	if (colorHEX.length < 7) colorHEX += "c";
	//console.log("colorHEX: "+colorHEX);
	return colorHEX;
}
String.prototype.replaceAt = function(index, character){
    return this.substr(0, index) + character + this.substr(index+character.length);
};
function drawDoughbutChart(id, size, values, labels){
	var canvasId = "#"+id;
	var doughnutContext = $(canvasId).get(0).getContext("2d");
	doughnutContext.canvas.height = 175;
	var palette = [];
	var highlights = [];
	var data = [];
	for (var i=0;i<size;i++){
		(function getUniquePalette(){
			var randomColor = getRandomColor();
			if (palette.indexOf(randomColor) === -1 && highlights.indexOf(randomColor) === -1) palette.push(randomColor);
			else getUniquePalette();
		})();
		(function getUniqueHighlights(){
			var randomColor = getRandomColor();
			if (palette.indexOf(randomColor) === -1 && highlights.indexOf(randomColor) === -1) highlights.push(randomColor);
			else getUniqueHighlights();
		})();
		data.push({
			value: parseInt(values[i],10),
			color: palette[i],
			highlight: highlights[i],
			label: labels[i]
		});
	}
	console.log("palette: "+palette+" | "+"highlights: "+highlights);
	var options = {
		segmentShowStroke : true,
		segmentStrokeColor : "rgba(0,0,0,0.2)",
		segmentStrokeWidth : 2,
		percentageInnerCutout : 50,
		animationSteps : 100,
		animationEasing : "easeOutBounce",
		animateRotate : true,
		animateScale : true,
		legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<segments.length; i++){%><li><span style=\"background-color:<%=segments[i].fillColor%>\"></span><%if(segments[i].label){%><%=segments[i].label%><%}%></li><%}%></ul>",
		tooltipTemplate: "<%= label %>: <%= value %>",
		tooltipFontSize: 16,
		tooltipFontStyle: "bold",
		tooltipFontColor: "#fff",
		tooltipTitleFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
	};
	var doughnutChart = new Chart(doughnutContext).Doughnut(data, options);
	window.onresize = function(event) {
		doughnutChart.destroy();
		doughnutChart = new Chart(doughnutContext).Doughnut(data, options);
	};
}