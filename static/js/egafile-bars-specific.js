window.ega_bars_specific = function(el, data, opts){

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
    else if(barWidth > 20){ barWidth = 100;}

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


    // Scales
    //var xScale = d3.scaleLinear().range([barWidth / 2, options.width - barWidth / 2]).domain(domain);
    var xScale = d3.scaleBand()
        .range([0, options.width])
        .domain(data.map((s) => s.type))


    // Calculate yDomain

    var yDomain =[0, 0];
    var numbers = data.map((s)=> s.value);
    var Max= Math.max.apply(Math,numbers);
    
    // For log graph
    //var yScale = d3.scaleLog();
    //var yDomain = d3.extent([1,Max])

    // For linear graph
    var yScale = d3.scaleLinear();
    var yDomain = d3.extent([0,Max])    

    yScale.range([0, -options.height]).domain(yDomain);


    // Bars
    svg.selectAll(".bar")
    	.data(data)
        .enter().append("rect")
        .attr("class", "bar-spc")
        .attr("x", d => xScale(d.type) + xScale.bandwidth()/2 -50)
        .attr("width", barWidth)
    	.attr("y", d => yScale(d.value))
        .attr("height", d => -yScale(d.value))
        .append("title").text(d => ega_number_format(d.value));
    // Axis
    var xAxis = d3.axisBottom(xScale);

    var yAxis = d3.axisLeft(yScale);

    xAxis.ticks(10);
    yAxis.ticks(10, d3.format('~s')); // Format as 100M...


    svg.append("g")
        .attr("class", "axis x-axis")
        .call(xAxis);

    // x-axis name
    if(options.xAxis !== undefined){
	svg.append("text")
	    .attr("class", 'x-axis-name-specific')
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
