window.ega_curve = function(el, data, opts){

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

    var yMin, yMax;
    [yMin,yMax] = d3.extent(data, d => d[1]);

    var svg = d3.select(el);

    svg.attr('viewBox',
	     (-options.padding-options.yAxisWidth)+' '+(-options.padding-options.height)+' '+
	     (options.width+2*options.padding+options.yAxisWidth)+' '+ (options.height+2*options.padding+options.xAxisHeight))
    	.attr('preserveAspectRatio', 'xMidYMin meet'); // center

    // We assume the keys are int except the one last that can be '>...' (more than)
    // We assume the integer keys are sorted
    // If the last one is not a string, the code takes the last item as the max.
    var xMax = 1000;
    var xMin = 0;
    if(data && data.length > 0){
	xMax = data[data.length-1][0];
	xMin = data[0][0];
	if(
	    (typeof xMax === 'string' || xMax instanceof String)
	    && (data.length > 1)
	){ xMax = data[data.length-2][0] + 1; }
    }
    var domain = [xMin, xMax];

    // Scales
    var xScale = d3.scaleLinear().range([0, options.width]).domain(domain);

    //var yScale = d3.scaleLinear();
    var lowerDomainBound = (yMin == 0)?1e-6:yMin; // domain does not include 0
    var yScale = d3.scaleLog();
    yScale.range([0,-options.height]).domain([lowerDomainBound, yMax]);


    // Curve
    if( !(data == null || data == undefined )
	&& data.length > 0){
	var xValue = function(d){
	    var v = d[0];
	    if((typeof v === 'string' || v instanceof String) && v.startsWith('>')){
		v = xMax;
	    }
	    return xScale(v);
	}

	var line = d3.line()
    	    .x(xValue)
    	    .y(d => yScale(d[1]))
	    .curve(d3.curveBasis);
	//.curve(d3.curveNatural()); // smooth
	
	svg.append("path")
            .attr("class", "plot")
     	    .attr('d', line(data));

	svg.selectAll(".point")
    	    .data(data)
            .enter().append("circle")
	    .attr("class", "point")
	    .attr("cx", xValue)
    	    .attr("cy", d => yScale(d[1]))
            .attr("r", 3)
            .append("title").text(d => ega_number_format(d[1]));
    } else {
	// No data. Going to plain JS
	var p = svg.node().parentNode;
	p.className += " no-data";
    }


    // Axis
    var xAxis = d3.axisBottom(xScale);
    var yAxis = d3.axisLeft(yScale);

    xAxis.ticks(10);
    yAxis.ticks(10, d3.format('~s')); // Format as 100M...

    xAxis.tickFormat(v => (v == 1000 || v == '>1000')?'>1000':v);

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
    if( options.yAxis !== undefined ){
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
