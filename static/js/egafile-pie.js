// Make sure this function exists
window.ega_number_format || (window.ega_number_format = function(n, sep){ return String(n); });


window.ega_pie = function(el, data){
    // This uses the latest d3 (v5)

    var svg = d3.select(el);
    
    // Flag if no data
    if(data == undefined || data == null || data.length == 0){
	var p = svg.node().parentNode;
	p.className += " no-data";
    }

    svg
	.attr('viewBox', '-102 -82 204 164')
    	.attr('preserveAspectRatio', 'xMidYMin meet'); // center

    var pie = d3.pie()
        .sort(null)
        .padAngle(.03);

    var arc = d3.arc()
        .outerRadius(80)
        .innerRadius(65);

    var percent, number;
    [percent, number] = data;

    svg.append("text")
        .attr("class", "percent")
        .attr("dy", ".5em")
        .text(String(Math.round(percent * 1000) / 10) + ' %'); // Round to 1 decimal

    svg.append("text")
        .attr("class", "pie-data")
        .attr("y", '20')
        .attr("dy", ".5em")
        .text(ega_number_format(number, ' '));

    svg.selectAll('path')
        .data(pie([percent, 1-percent]))
        .enter()
        .append('path')
        .attr("d", arc)
	.attr("class", (d,i) => 'arc arc-'+i)
	.append("title")
	.text(d => Math.round(d.data * 1000) / 10  + ' %'); // Round to 1 decimal
}
