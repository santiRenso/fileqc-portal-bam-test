window.ega_base_changes = function(el, data, opts){

    var options = {
	'height': 150,
	'padding': 10,
	'xAxis': undefined,
 	'yAxisWidth': 40
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

    // names
    var domain = [0,null];
    for(var base in data){ var d = data[base]; for(var base2 in d){
	var change = d[base2];
	if( change < domain[0] ){ domain[0] = change; }
	else if ( domain[1] == null || change > domain[1] ){ domain[1] = change; }
    }}
    console.log(domain);

    var buildChanges = function(name, barWidth){

	barWidth = barWidth || 20; // default if undefined
	var w = 3 * barWidth;
	var h = 200;
	var s = svg.append('svg');
	var d = data[name];
	var y = d3.scaleLinear().range([0,200]).domain(domain);

	s.attr('viewBox', '-10 -210 '+ (w+20) +' 250')
	    .attr('preserveAspectRatio', 'xMinYMin meet');

	var slide=0;
	for(var base in d){
	    s.append("rect")
		.attr("class", 'basechanges basechanges-'+base)
		.attr("x", slide)
		.attr("y", -y(d[base]))
		.attr("height", y(d[base]))
		.attr("width", barWidth)
		.attr("stroke-location", "inside")
		.append("title").text(d[base]);
	    s.append("text")
		.attr("class", 'basechanges-label')
		.attr("x", slide + barWidth/2)
		.attr("y", 20)
		.attr("dy", "-0.35em")
		.attr("text-anchor", "middle")
		.text(base);
	    slide += barWidth;
	}

	// Main label
	s.append("text")
	    .attr("class", 'basechanges-label')
	    .attr("x", w / 2)
	    .attr("y", 40)
	    .attr("dy", "-0.35em")
	    .attr("text-anchor", "middle")
	    .text(name);

	// Line
	s.append("line")
	    .attr("class", 'basechanges-label-line')
	    .attr("x1", 0)
	    .attr("y1", 20)
	    .attr("x2", w)
	    .attr("y2", 20);
	s.append("line")
	    .attr("class", 'basechanges-label-line')
	    .attr("x1", 0)
	    .attr("y1", 15)
	    .attr("x2", 0)
	    .attr("y2", 25);
	s.append("line")
	    .attr("class", 'basechanges-label-line')
	    .attr("x1", w)
	    .attr("y1", 15)
	    .attr("x2", w)
	    .attr("y2", 25);
	
	//console.log(s);
	//console.log(d);
	return s;
    }

    var build_Y_axis = function(){
	var h = 200;
	var y = d3.scaleLinear().range([0,-h]).domain(domain);
	var s = svg.append('svg');
	s.attr('viewBox', '-50 -210  60 250')
	    .attr('preserveAspectRatio', 'xMinYMin meet')
            .append("g")
	    .attr("class", "axis y-axis")
	    .call(d3.axisLeft(y));
	return s;
    }

    // Per base
    var svg_A = buildChanges( "A" );
    var svg_C = buildChanges( "C" );
    var svg_G = buildChanges( "G" );
    var svg_T = buildChanges( "T" );

    svg_A.attr('x', 0  ).attr('y', -options.height).attr('height', options.height);
    svg_C.attr('x', 80 ).attr('y', -options.height).attr('height', options.height);
    svg_G.attr('x', 160).attr('y', -options.height).attr('height', options.height);
    svg_T.attr('x', 240).attr('y', -options.height).attr('height', options.height);

    // y-axis
    var svg_Y = build_Y_axis();
    svg_Y.attr('x', -options.yAxisWidth).attr('y', -options.height).attr('height', options.height);

    // Viewbox
    svg.attr('viewBox',
	     (-options.padding-options.yAxisWidth)+' '+     // X
	     (-options.padding-options.height)+' '+         // Y
	     (320+options.yAxisWidth)+' '+                  // width
	     (options.height+2*options.padding)             // height
	    ).attr('preserveAspectRatio', 'xMinYMin meet'); // center


}
