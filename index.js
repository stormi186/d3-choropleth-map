const education_url = 'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json';
const counties_url = 'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json';

var margin = { top: 100, right: 10, bottom: 10, left: 10 },
    width = 1000 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

var color = d3.scaleThreshold().range(d3.schemeGnBu[8]);

var path = d3.geoPath();

var education = [];

var svg = d3.select('body').append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .attr('class', 'graph-svg-component')
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');;

svg.append('text')
  .attr('id','title')
  .attr('x', (width / 2))             
  .attr('y', 0 - (margin.top / 2))
  .attr('text-anchor', 'middle')  
  .style('font-size', '30px') 
  .text('United States Educational Attainment');
  
svg.append('text')
  .attr('id','description')
  .attr('x', (width / 2))             
  .attr('y', 0 - (margin.top / 2) +25)
  .attr('text-anchor', 'middle')  
  .style('font-size', '20px') 
  .text('Percentage of adults age 25 and older with a bachelors degree or higher (2010-2014)');

d3.json(education_url)
  .then(function(data) {
    var min = d3.min(data, function(d) {
      return d.bachelorsOrHigher;
    });
    var max = d3.max(data, function(d) {
      return d.bachelorsOrHigher;
    });
    color.domain(d3.range(min, max, (max - min) / 8));
    education.push(data);
  });

d3.json(counties_url)
  .then(function(data) {
    var geojsonStates = topojson.mesh(data, data.objects.states, function(a,b) {
      return a !== b;
    });

    var geojsonCounties = topojson.feature(data, data.objects.counties)
      .features;

    for (var i = 0; i < education[0].length; i++) {
      var state = education[0][i].state;
      var bachelorsOrHigher = education[0][i].bachelorsOrHigher;
      var countyFips = education[0][i].fips;
      var county = education[0][i].area_name;

      for (var j = 0; j < geojsonCounties.length; j++) {
        var countyId = geojsonCounties[j].id;
        if (countyFips == countyId) {
          geojsonCounties[j].properties.value = {
            bachelorsOrHigher: bachelorsOrHigher,
            state: state,
            county: county
          };
        }
      }
    }
  
    svg.selectAll('path')
      .data(geojsonCounties)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('class', 'county')
      .attr('data-fips', function(d) {
        return d.id;
      })
      .attr('data-education', function(d) {
        return d.properties.value.bachelorsOrHigher;
      })
      .attr('fill', function(d) {
        var value = d.properties.value;
        if (value) {
          return color(value.bachelorsOrHigher);
        } else {
          return color(0);
        }
      })
      .on('mouseover', function(d) {
        d3.select('#tooltip')
          .style('opacity', 1)
          .style('left', d3.event.pageX + 10 + 'px')
          .style('top', d3.event.pageY - 28 + 'px')
          .style('display', 'block')
          .attr('data-education', d.properties.value.bachelorsOrHigher)
          .html( d.properties.value.state +
              " " +
              d.properties.value.county +
              " " +
              d.properties.value.bachelorsOrHigher +
              "%"
          );
      })
      .on('mouseout', function() {
        d3.select('#tooltip').style('display', 'none');
        });

    svg.append('path')
      .datum(
        topojson.mesh(data, data.objects.states, function(a, b) {
          return a !== b;
        })
      )
      .attr('d', path)
      .attr('margin', 1)
      .attr('stroke', 'white')
      .attr('stroke-linejoin', 'round')
      .attr('fill', 'none');

    var legend = svg.selectAll('rect')
      .data(d3.schemeGnBu[8])
      .enter()
      .append('g')
      .attr('id', 'legend')

    legend.append('rect')
      .attr('y', 55)
      .attr('x', function(d, i) {
        return 650 + i * 25;
      })
      .attr('width', 25)
      .attr('height', 10)
      .style('fill', function(d) {
        return d;
      });

    var min = d3.min(education[0], function(d) {
      return d.bachelorsOrHigher;
    });
    var max = d3.max(education[0], function(d) {
      return d.bachelorsOrHigher;
    });

    var axisValues = d3.range(
      Math.round(min),
      Math.round(max),
      (Math.round(max) - Math.round(min)) / 8
    );

    var legendScale = d3.scaleLinear()
      .domain([Math.round(min), Math.round(max)])
      .range([750, 950]);

    var legendAxis = d3.axisBottom()
      .scale(legendScale)
      .ticks(8)
      .tickValues(axisValues)
      .tickFormat(function(element) {
        return element + "%";
      })
      .tickSize(15)

    svg.append('g')
      .attr('class', 'axis')
      .attr('transform', 'translate(-100, 55)')
      .call(legendAxis);
  });