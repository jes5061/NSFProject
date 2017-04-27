// blocks.org 
// where i got barchart 3, donutchart (updatable donut chart)
// where was the starter kit that I got


import { djb2, hashStringToColor } from '../util'

export default (target) => {
  let data = []


  // Mike Bostock "margin conventions"
  const margin = {top: 40, right: 0, bottom: 0, left: 40};
  let width = 500 + margin.left + margin.right;
  let height = 450 + margin.top + margin.bottom;

  // D3 scales = just math
  // x is a function that transforms from "domain" (data) into "range" (usual pixels)
  // domain gets set after the data loads
  const x = d3.scale.ordinal()
      .rangeRoundBands([0, width], .1);

  const y = d3.scale.linear()
      .range([height, 0]);

  // D3 Axis - renders a d3 scale in SVG
  const xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  const yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")

  var div = d3.select("body").append("div").attr("class", "toolTip");

  // create an SVG element (appended to body)
  // set size
  // add a "g" element (think "group")
  // annoying d3 gotcha - the 'svg' variable here is a 'g' element
  // the final line sets the transform on <g>, not on <svg>
  const svg = d3.select(target).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", "0 0 600 400")
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + (height + 1000) + ")")

  svg.append("g")
      .attr("class", "y axis")
    .append("text") // just for the title (ticks are automatic)
      .attr("transform", "rotate(-90)") // rotate the text!
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("value");

  // d3.tsv is a wrapper around XMLHTTPRequest, returns array of arrays (?) for a TSV file
  // type function transforms strings to numbers, dates, etc.
  // d3.tsv("data.tsv", type, function(error, data) {
    replay(data);
  // });

  function type(d) {
    // + coerces to a Number from a String (or anything)
    d.value = +d.value;
    return d;
  }

  function replay(data) {
    var slices = [];
    for (var i = 0; i < data.length; i++) {
      slices.push(data.slice(0, i+1));
    }
    slices.forEach(function(slice, index){
      setTimeout(function(){
        draw(slice);
      }, index * 300);
    });
  }

  return function draw(data = {}) {
    // measure the domain (for x, unique names) (for y [0,maxvalue])
    // now the scales are finished and usable
    x.domain(data.map(function(d) { return d.name; }));
    y.domain([0, d3.max(data, function(d) { return d.value; })]);

    // another g element, this time to move the origin to the bottom of the svg element
    // someSelection.call(thing) is roughly equivalent to thing(someSelection[i])
    //   for everything in the selection\
    // the end result is g populated with text and lines!
    svg.select('.x.axis').transition().duration(300).call(xAxis);

    // same for yAxis but with more transform and a title
    svg.select(".y.axis").transition().duration(300).call(yAxis)

    // THIS IS THE ACTUAL WORK!
    const bars = svg.selectAll(".bar").data(data, function(d) { return d.name; }) // (data) is an array/iterable thing, second argument is an ID generator function
    
    bars.on("mousemove", function(d){
      div.style("left", d3.event.pageX+10+"px");
      div.style("top", d3.event.pageY-25+"px");
      div.style("display", "inline-block");
      div.html((d.name)+"<br>"+(d.value));
    });
    bars.on("mouseout", function(d){
      div.style("display", "none");
    });

    bars.exit()
      .transition()
        .duration(300)
      .attr("y", y(0))
      .attr("height", height - y(0))
      .style('fill-opacity', 1e-6)
      .remove();

    // data that needs DOM = enter() (a set/selection, not an event!)
    bars.enter().append("rect")
      .attr("class", "bar")
      .attr("y", y(0))
      .style("fill", d => hashStringToColor(d.name))
      .attr("height", height - y(0));

    // the "UPDATE" set:
    bars.transition().duration(300)
      .attr("x", function(d) { return x(d.name); }) // (d) is one item from the data array, x is the scale object from above
      .attr("width", x.rangeBand()) // constant, so no callback function(d) here
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); }); // flip the height, because y's domain is bottom up, but SVG renders top down
  }
}