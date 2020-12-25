/*global d3, db */

const svg = d3.select('.canvas').append('svg')
	.attr('width', 600)
	.attr('height', 600);

// create margins & dimensions
const margins = {top: 20, right: 20, bottom: 100, left: 100};
const graphWidth = 600 - margins.left - margins.right;
const graphHeight = 600 - margins.top - margins.bottom;

const graph = svg.append('g')
	.attr('width', graphWidth)
	.attr('height', graphHeight)
	.attr('transform', `translate(${margins.left}, ${margins.top})`);

const xAxisGroup = graph.append('g')
	.attr('transform', `translate(0, ${graphHeight})`);
const yAxisGroup = graph.append('g');

db.collection('dishes').get().then(res => {

	var data = [];
	res.docs.forEach(doc => {
		data.push(doc.data());
	});

	// create scale
	const y = d3.scaleLinear()
		.domain([0, d3.max(data, d => d.orders)])
		.range([graphHeight, 0]);

	// const min = d3.min(data, d => d.orders);
	// const max = d3.max(data, d => d.orders);
	// const extent = d3.extent(data, d => d.orders);

	const x = d3.scaleBand()
		.domain(data.map(item => item.name))
		.range([0, 500])
		.paddingInner(0.2)
		.paddingOuter(0.2);

	// join data to rect
	const rect = graph.selectAll('rect')
		.data(data);

	rect
		.attr('width', x.bandwidth)
		.attr('height', d => graphHeight - y(d.orders))
		.attr('fill', 'orange')
		.attr('x', d => x(d.name))
		.attr('y', d => y(d.orders));

	// append enter selection to DOM
	rect.enter()
		.append('rect')
		.attr('width', x.bandwidth)
		.attr('height', d => graphHeight - y(d.orders))
		.attr('fill', 'orange')
		.attr('x', d => x(d.name))
		.attr('y', d => y(d.orders));

	// create and call the axis
	const xAxis = d3.axisBottom(x);
	const yAxis = d3.axisLeft(y)
		.ticks(3)
		.tickFormat(d => d + ' orders');

	xAxisGroup.call(xAxis);
	yAxisGroup.call(yAxis);

	xAxisGroup.selectAll('text')
		.attr('transform', 'rotate(-40)')
		.attr('text-anchor', 'end')
		.attr('fill', 'orange');
})