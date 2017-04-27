import { pipe, pluck, sum, toString, head, split, multiply } from 'ramda'

export default (target) => {

  var svg = d3.select(target)
    .append("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 600 400")
    .attr('height', '400px')
    .append("g")

  svg.append("g")
    .attr("class", "slices");
  svg.append("g")
    .attr("class", "nameName");
  svg.append("g")
    .attr("class", "nameValue");
  svg.append("g")
    .attr("class", "lines");

  var width = 600,
      height = 500,
    radius = Math.min(width, height) / 2.3;

  var pie = d3.layout.pie()
    .sort(null)
    .value(function(d) {
      return d.value;
    });

  var arc = d3.svg.arc()
    .outerRadius(radius * 0.8)
    .innerRadius(radius * 0.4);

  var outerArc = d3.svg.arc()
    .innerRadius(radius * 0.9)
    .outerRadius(radius * 0.9);

  var legendRectSize = (radius * 0.05);
  var legendSpacing = radius * 0.02;


  var div = d3.select("body").append("div").attr("class", "toolTip");

  svg.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  var colorRange = d3.scale.category20();
  var color = d3.scale.ordinal()
    .range(colorRange.range());


  const datasetTotal = [];    

  change(datasetTotal);


  function change(data) {
    const total = pipe(pluck('value'), sum)(data)

    /* ------- PIE SLICES -------*/
    var slice = svg.select(".slices").selectAll("path.slice")
          .data(pie(data), function(d){ return d.data.name });

      slice.enter()
          .insert("path")
          .style("fill", function(d) { return color(d.data.name); })
          .attr("class", "slice");

      slice
          .transition().duration(1000)
          .attrTween("d", function(d) {
              this._current = this._current || d;
              var interpolate = d3.interpolate(this._current, d);
              this._current = interpolate(0);
              return function(t) {
                  return arc(interpolate(t));
              };
          })
      slice
          .on("mousemove", function(d){
              div.style("left", d3.event.pageX+10+"px");
              div.style("top", d3.event.pageY-25+"px");
              div.style("display", "inline-block");
              div.html((d.data.name)+"<br>"+(d.data.value));
          });
      slice
          .on("mouseout", function(d){
              div.style("display", "none");
          });

      slice.exit()
          .remove();

      var legend = svg.selectAll('.legend')
          .data(color.domain())
          .enter()
          .append('g')
          .attr('class', 'legend')
          .attr('transform', function(d, i) {
              var height = legendRectSize + legendSpacing;
              var offset =  height * color.domain().length / 2;
              var horz = -3 * legendRectSize;
              var vert = i * height - offset;
              return 'translate(' + horz + ',' + vert + ')';
          });

      legend.append('rect')
          .attr('width', legendRectSize)
          .attr('height', legendRectSize)
          .style('fill', color)
          .style('stroke', color);

      legend.append('text')
          .attr('x', legendRectSize + legendSpacing)
          .attr('y', legendRectSize - legendSpacing)
          .text(function(d) { return d; });

      /* ------- TEXT nameS -------*/

      var text = svg.select(".nameName").selectAll("text")
          .data(pie(data), function(d){ return d.data.name });

      text.enter()
          .append("text")
          .attr("dy", ".35em")
          .text(function(d) {
              return (d.data.name+": "+d.value);
          });

      function midAngle(d){
          return d.startAngle + (d.endAngle - d.startAngle)/2;
      }

      text
          .transition().duration(1000)
          .attrTween("transform", function(d) {
              this._current = this._current || d;
              var interpolate = d3.interpolate(this._current, d);
              this._current = interpolate(0);
              return function(t) {
                  var d2 = interpolate(t);
                  var pos = outerArc.centroid(d2);
                  pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
                  return "translate("+ pos +")";
              };
          })
          .styleTween("text-anchor", function(d){
              this._current = this._current || d;
              var interpolate = d3.interpolate(this._current, d);
              this._current = interpolate(0);
              return function(t) {
                  var d2 = interpolate(t);
                  return midAngle(d2) < Math.PI ? "start":"end";
              };
          })
          .text(function(d) {
              return (d.data.name+": "+(d.value/total*100).toFixed(1)+'%');
          });


      text.exit().remove();

      /* ------- SLICE TO TEXT POLYLINES -------*/

      var polyline = svg.select(".lines").selectAll("polyline")
          .data(pie(data), function(d){ return d.data.name });

      polyline.enter()
          .append("polyline");

      polyline.transition().duration(1000)
          .attrTween("points", function(d){
              this._current = this._current || d;
              var interpolate = d3.interpolate(this._current, d);
              this._current = interpolate(0);
              return function(t) {
                  var d2 = interpolate(t);
                  var pos = outerArc.centroid(d2);
                  pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
                  return [arc.centroid(d2), outerArc.centroid(d2), pos];
              };
          });

      polyline.exit().remove();
    };

    return change
}

