window.ega_bars = function(el, data, opts){

    var options = {
	'width': 600,
	'height':150,
	'padding':20,
	'xAxisHeight':40,
	'yAxisWidth':40,
	'xAxis': undefined,
	'yAxis': undefined
    }

    if( opts !== undefined && typeof opts === 'object'){
	for (var k in options){
	    if( opts.hasOwnProperty(k) ){
		if( !(opts[k] === undefined || opts[k] === null) ){ // don't allow reset to null
		    options[k] = opts[k];
		}
	    }
	}
    }

    // Adjusting the bar size
    var barWidth = options.width / data.length;
    if(barWidth < 4){ barWidth = 4;}
    else if(barWidth > 20){ barWidth = 20;}

    var svg = d3.select(el);

    // Flag if no data
    if(data == undefined || data == null || data.length == 0){
	var p = svg.node().parentNode;
	p.className += " no-data";
    }

    svg.attr('viewBox',
	     (-options.padding-options.yAxisWidth)+' '+(-options.padding-options.height)+' '+
	     (options.width+2*options.padding+options.yAxisWidth)+' '+ (options.height+2*options.padding+options.xAxisHeight))
    	.attr('preserveAspectRatio', 'xMidYMin meet'); // center

    // We assume the keys are int except the one last that can be '>...' (more than)
    // We assume the integer keys are sorted
    // If the last one is not a string, the code takes the last item as the max.
    var xMax = data[data.length-1][0];
    if(typeof xMax === 'string' || xMax instanceof String){ xMax = data[data.length-2][0] + 1; }
    var domain = [data[0][0], xMax];

    // Scales
    var xScale = d3.scaleLinear().range([barWidth / 2, options.width - barWidth / 2]).domain(domain);

    //var yScale = d3.scaleLinear();
    var yScale = d3.scaleLinear();
    var yDomain = d3.extent(data, d => d[1])
    yScale.range([0,-options.height]).domain(yDomain);

    var xValue = function(d){
	var v = d[0];
	if((typeof v === 'string' || v instanceof String) && v.startsWith('>')){
	    v = xMax;
	}
	return xScale(v);
    }

    // Bars
    svg.selectAll(".bar")
    	.data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d[0]) - barWidth/2)
        .attr("width", barWidth)
    	.attr("y", d => yScale(d[1]))
        .attr("height", d => -yScale(d[1]))
        .append("title").text(d => ega_number_format(d[1]));

    // Axis
    var xAxis = d3.axisBottom(xScale);
    var yAxis = d3.axisLeft(yScale);

    xAxis.ticks(10);

    //yAxis.ticks(10);
    // var find_y_ticks = function(n, d){
    // 	if(n >= 1){ return d; }
    // 	return find_y_ticks(n*10, d+1);
    // }
    //nbDigits = find_y_ticks( (yDomain[1] - yDomain[0])/10/options.width, 0);
    // nbDigits = Math.round(Math.log10( (yDomain[1] - yDomain[0])/10/options.width ));
    // console.log(yDomain);
    // console.log((yDomain[1] - yDomain[0])/10/options.width);    
    // console.log(nbDigits);

    if(data == undefined || data == null || data.length > 1){
	yAxis.ticks(10, d3.format('~s')); // Format as 100M, 10k, 10µ...
    } else {
	yAxis.ticks(10, d3.format('.0s')); // Format as 100M, 10k, 10µ...
    }

    svg.append("g")
        .attr("class", "axis x-axis")
        .call(xAxis);

    // x-axis name
    if(options.xAxis !== undefined){
	svg.append("text")
	    .attr("class", 'x-axis-name')
	    .attr("x", options.width/2)
	    .attr("y", 40)
	    .attr("text-anchor", "middle")
	    .text(options.xAxis);
    }

    // y-axis name
    if(options.yAxis !== undefined){
	svg.append("g")
            .attr("class", "axis y-axis")
            .call(yAxis);

	svg.append("text")
	    .attr("class", 'y-axis-name')
	    .attr("x", -options.yAxisWidth)
	    .attr("y", -options.height/2)
	    .attr("dy", "0.35em")
	    .attr("text-anchor", "middle")
	    .attr("transform", "rotate(-90 "+(-options.yAxisWidth)+" "+(-options.height/2)+")")
	    .text(options.yAxis);
    }
}
