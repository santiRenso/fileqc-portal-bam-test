window.ega_bars = function(el, data, opts){
    function isEmpty(obj) {
        for (const prop in obj) {
          if (Object.hasOwn(obj, prop)) {
            return false;
          }
        }
      
        return true;
      }
    function getOptions(){
        const options = {
            'width': 600,
            'height':150,
            'padding':20,
            'xAxisHeight':40,
            'yAxisWidth':40,
            'xAxis': undefined,
            'yAxis': undefined,
            'yScale':'linear'
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
        return options;
    }
    function make_x_grid(svg, xScale, height) {        
        svg.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0, ${-height})`)
            .call(d3.axisBottom(xScale)
                .ticks(10)
                .tickSize(height)
                .tickFormat("")); // Removes labels
    }
    function make_y_grid(svg, yScale, width) {        
        svg.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(yScale)
                .ticks(10)
                .tickSize(-width)
                .tickFormat("")); // Removes labels
    }
    function getBarWidth(data) {
        let barWidth = options.width / data.length;
        if(barWidth < 4){ barWidth = 4;}
        else if(barWidth > 20){ barWidth = 20;}
        return barWidth;
    }
    function buildChart(data, barWidth, xScale, yScale) {
        // Bars
        svg
          .selectAll(".bar")
          .data(data)
          .enter()
          .append("rect")
          .attr("class", "bar")
          .attr("x", (d) => xScale(d[key_name.x]) - barWidth / 2)
          .attr("width", barWidth)
          .attr("y", (d) => yScale(d[key_name.y]))
          .attr("height", (d) => -yScale(d[key_name.y]))
          .append("title")
          .text((d) => ega_number_format(d[key_name.y]));
    
        // Axes
        var xAxis = d3.axisBottom(xScale);
        var yAxis = d3.axisLeft(yScale);
    
        yAxis.ticks(10, d3.format("~s")); // Format as 100M, 10k, 10µ...
    
        svg.append("g").attr("class", "axis x-axis").call(xAxis);
        svg.append("g").attr("class", "axis y-axis").call(yAxis);
    
        //Grid
        make_x_grid(svg, xScale, options.height);
        make_y_grid(svg, yScale, options.width);
    }
    
    function zoom(svg) {
        const extent = [
          [barWidth / 2, 0],
          [options.width - barWidth / 2, -options.height],
        ];
        svg.call(
          d3
            .zoom()
            .scaleExtent([1, 8])
            .translateExtent(extent)
            .extent(extent)
            .on("zoom", zoomed)
            .on("end", zoomEnd)
        );
        function zoomed(event) {
           const transform = event.transform;
           if(transform.k === 1){
            // Reset zoom
            svg.selectAll("rect.bar").remove();
            svg.selectAll(".grid").remove();
            svg.selectAll(".axis.x-axis").remove();
            svg.selectAll(".axis.y-axis").remove();
            buildChart(data, barWidth,xScale,yScale);
            return;
           }
          if(event.sourceEvent.type === "mousemove")
            svg.classed("grab",true);
          // Compute new scales from the zoom transform
          const xScaleNew = transform.rescaleX(xScale);
          transform.x = Math.min(0, transform.x);
          const yScaleNew = transform.rescaleY(yScale);
    
          const y_cross = xScaleNew.invert(0); // x-value at y=0 after zoom
          const end_of_chart = xScaleNew.invert(options.width); // x-value at y=width after zoom

          const filteredData = data.filter(
            (d) => d[key_name.x] > y_cross && d[key_name.x] < end_of_chart
          );


          // Set new scale domains
          xScaleNew.domain([y_cross, end_of_chart]);
          yScaleNew.domain(d3.extent(filteredData, (d) => d[key_name.y])).nice();
    
          // Adjusting the bar size
          const newBarWidth = getBarWidth(filteredData);
    
          // Clear chart
          svg.selectAll("rect.bar").remove();
          svg.selectAll(".grid").remove();
          svg.selectAll(".axis.x-axis").remove();
          svg.selectAll(".axis.y-axis").remove();

          buildChart(filteredData, newBarWidth,xScaleNew,yScaleNew);
        }
        function zoomEnd(){
            svg.classed("grab",false);
            
        }
    }
    
    var options = getOptions();
   
    var svg = d3.select(el);

    
    // Flag if no data
    if(data == undefined || data == null || data.length == 0 || typeof(data) == "object" && isEmpty(data)){
	var p = svg.node().parentNode;
	p.className += " no-data";
    return false;
    }
    

    let barWidth = getBarWidth(data);
    svg.classed("zoom",true)
    svg.attr('viewBox',
	     (-options.padding-options.yAxisWidth)+' '+(-options.padding-options.height)+' '+
	     (options.width+2*options.padding+options.yAxisWidth)+' '+ (options.height+2*options.padding+options.xAxisHeight))
    	.attr('preserveAspectRatio', 'xMidYMin meet').call(zoom) // center


    const key_name = {};
    key_name.x = Object.keys(data[0])[0];
    key_name.y = Object.keys(data[0])[1];
    const xMax = d3.max(data, (d) => d[key_name.x]);
    const domain = [data[0][key_name.x],xMax];


    

    var xScale = d3.scaleLinear().range([barWidth / 2, options.width - barWidth / 2]).domain(domain).nice();
    var yScale = d3.scaleLinear().range([0,-options.height]).domain(d3.extent(data,d=>d[key_name.y])).nice();

    buildChart(data,barWidth,xScale,yScale);    

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
