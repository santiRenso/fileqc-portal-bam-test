window.ega_stacked_bars = function(el, data, opts){

    var options = {
	'width': 600,
	'height':150,
	'padding':10,
	'yAxisWidth':40,
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

    var svg = d3.select(el);

    // Flag if no data
    if(data == undefined || data == null){
	var p = svg.node().parentNode;
	p.className += " no-data";
    } else { // Check if one of them is not '-1'
	var found = false;
	data.forEach(function(d){ found = found || (d[1] > -1); } );
	if(!found){
	    var p = svg.node().parentNode;
	    p.className += " no-data";
	}
    }

    svg.attr('viewBox',
	     (-options.padding-options.yAxisWidth)+' '+(-options.padding-options.height)+' '+
	     (options.width+2*options.padding+options.yAxisWidth)+' '+(options.height+2*options.padding+30)) // + 30 for legend
    	.attr('preserveAspectRatio', 'xMinYMin meet'); // center

    // names
    var names = data.map(d => d[0]);

    // Scales
    var xScale = d3.scaleBand()
	.rangeRound([0, options.width])
	.domain(names).padding(0.2);

    var yScale = d3.scaleLinear()
	.range([0,-options.height])
	.domain([0,1]).nice();

    // Mapped Bars
    svg.append("g")
        .attr("class", 'stack stack-mapped')
	.selectAll("rect")
        .data(data)
        .enter().append("rect")
        .attr("x", d => xScale(d[0]))
        .attr("y", d => yScale( (d[1] && d[1] > -1)?d[1]:null ))
        .attr("height", d => -yScale((d[1] && d[1] > -1)?d[1]:null))
        .attr("width", xScale.bandwidth())
        .append("title").text(d => (d[1] && d[1] > -1)?(Math.round(10000 * d[1])/100 + '%'):null);

    // Unmapped Bars
    svg.append("g")
        .attr("class", 'stack stack-unmapped')
	.selectAll("rect")
        .data(data)
        .enter().append("rect")
        .attr("x", d => xScale(d[0]))
        .attr("y", d => -options.height)
        .attr("height", d => -yScale((d[1] && d[1] > -1)?1-d[1]:null)) // because of None/null python/js conversion, we used -1
        .attr("width", xScale.bandwidth())
        .append("title").text(d => (d[1] && d[1] > -1)?(Math.round(10000 - 10000 * d[1])/100 + '%'):null);
 
    // Axis
    var xAxis = d3.axisBottom(xScale);
    var yAxis = d3.axisLeft(yScale);
    yAxis.ticks(10);
    
    xAxis.tickValues(names);
    yAxis.tickFormat(d => (100*d)+'%');

    svg.append("g")
        .attr("class", "axis x-axis")
        .call(xAxis);

    svg.append("g")
        .attr("class", "axis y-axis")
        .call(yAxis);

    // Legend
    var legend = [
	[ "mapped"  , options.width - 100, 30],
	[ "unmapped", options.width - 210, 30]
    ];

    legend.forEach(function(d,i){
	var g = svg.append("g")
            .attr("class", "legend legend-"+d[0])
	    .attr("transform", "translate("+ d[1] +"," + d[2] + ")");

	g.append("rect")
	    .attr("x", -10)
	    .attr("y", -5)
	    .attr("width", 10)
	    .attr("height", 10);
    
	g.append("text")
	    .attr("x", 5)
	    .attr("y", 0)
	    .attr("dy", "0.35em")
	    .attr("text-anchor", "right")
	    .text(d[0]);
    });
}
