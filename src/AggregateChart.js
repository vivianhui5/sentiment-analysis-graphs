import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { getMissingData } from './HarvardOnlyChart';

const Graph2 = ({ type, category }) => {
  const d3Container = useRef(null);
  const customColors = {
    'Full Dataset': '#A82931',     // Crimson Red
    'elite': '#A82931',       // Orange
    'non-elite': '#004E6A',      // Blue 1
    'midwest': '#A82931',     // Crimson Red
    'northeast': '#004E6A',   // Blue 1
    'south': '#F99D1C',       // Orange
    'west': '#218446',        // Green
    'private': '#A82931',     // Crimson Red
    'public': '#004E6A'       // Blue 1
  };


  useEffect(() => {
    // Function to determine data path based on selected type
    const getDataPath = () => {
      const publicUrl = process.env.PUBLIC_URL;
      // const publicUrl = 'https://raw.githubusercontent.com/theharvardcrimson/sentiment-analysis-graphs/main/public'

      switch (type) {
        case 'elite_status':
          return `${publicUrl}/aggregates_elite_status - aggregates_elite_status.csv`;
        case 'region':
          return `${publicUrl}/aggregates_regions - aggregates_regions.csv`;
        case 'university_type':
          return `${publicUrl}/aggregates_university_type - aggregates_university_type.csv`;
        case 'Full Dataset':
          return `${publicUrl}/aggregates_full - aggregates_full.csv`;
        default:
          return `${publicUrl}/aggregates_full - aggregates_full.csv`;
      }
    };

    const dataPath = getDataPath();
    // Load data from CSV file and parse it
    d3.csv(dataPath, d => ({
      year: new Date(d.year + '-01-01'),
      typeValue: d[type],
      categoryValue: +d[category]
    })).then(data => {
      // Check if data is available and container reference exists before drawing chart
      if (data.length > 0 && d3Container.current) {
        drawChart(data);
      }
    }).catch(error => {
      console.error("Error loading data:", error);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, category]);

  const drawChart = (data) => {
    // Remove any existing SVG elements
    d3.select(d3Container.current).selectAll("svg").remove();

    const margin = { top: 60, right: 30, bottom: 50, left: 60 }, // Increase left margin to accommodate legend
      width = 800 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

    const svg = d3.select(d3Container.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Append x-axis title
    svg.append("text")
      .attr("class", "axis-title")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .text("Year");

    // Append y-axis title
    svg.append("text")
      .attr("class", "axis-title")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(${-margin.left / 2 - 10}, ${height / 2}) rotate(-90)`)
      .text("Sentiment");

    const x = d3.scaleTime()
      // .domain(d3.extent(data, d => d.year))
      .domain([new Date(2000, 0), new Date(2024, 0)])
      .range([0, width]);

    // fixed range for y scale
    const yDomain = [0.12, 0.37];
    const y = d3.scaleLinear()
      .domain(yDomain)
      .range([height, 0]);

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .attr('font-family', 'Georgia, serif');

    svg.append("g")
      .call(d3.axisLeft(y))
      .attr('font-family', 'Georgia, serif');

    const line = d3.line()
      .defined(d => d.categoryValue)
      .x(d => x(d.year))
      .y(d => y(d.categoryValue))
      .curve(d3.curveMonotoneX);

    const typeGroups = {
      'Full Dataset': ['Full Dataset'],
      'elite_status': ['elite', 'non-elite'],
      'region': ['midwest', 'northeast', 'south', 'west'],
      'university_type': ['private', 'public']
    };

    const colorKeyGroup = svg.append("g").attr("transform", `translate(0, -30)`);

    if (!(type in typeGroups)) throw new Error(`Invalid type: ${type}`);

    typeGroups[type].forEach((typeName, index) => {
      const filteredData = type === 'Full Dataset' ? data : data.filter(d => d.typeValue === typeName);

      const missingData = getMissingData(filteredData);

      svg.append("path")
        .datum(filteredData)
        .attr("fill", "none")
        .attr("stroke", customColors[typeName]) // Use custom color
        .attr("stroke-width", 2)
        .attr("d", line);

      // missing data line
      svg.append("path")
        .datum(missingData)
        .attr("fill", "none")
        .attr("stroke", customColors[typeName]) // Use custom color
        .attr("stroke-width", 2)
        .attr('stroke-dasharray', '5,5')
        .attr("d", line);

      colorKeyGroup.append("rect")
        .attr("x", index * 150)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", customColors[typeName]); // Use custom color for legend

      colorKeyGroup.append("text")
        .attr("x", index * 150 + 22)
        .attr("y", 10)
        .text(typeName.charAt(0).toUpperCase() + typeName.slice(1))
        .style("font-size", "14px")
        .attr("fill", customColors[typeName]); // Use custom color for text
    });
  };

  return <div ref={d3Container} />;
};

export default Graph2;
