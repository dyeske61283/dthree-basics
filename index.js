/*global d3, db, console */

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

// create scales
const y = d3.scaleLinear()
	.range([graphHeight, 0]);

const x = d3.scaleBand()
	.range([0, 500])
	.paddingInner(0.2)
	.paddingOuter(0.2);

// create the axes
const xAxis = d3.axisBottom(x);
const yAxis = d3.axisLeft(y)
	.ticks(3)
	.tickFormat(d => d + ' orders');

// update x axis text
xAxisGroup.selectAll('text')
	.attr('transform', 'rotate(-40)')
	.attr('text-anchor', 'end')
	.attr('fill', 'orange');

const transition = d3.transition().duration(1500);

const update = (data) => {
	
	// update scales (domains) if reliant on data
	y.domain([0, d3.max(data, d => d.orders)]);
	x.domain(data.map(item => item.name));

	// join updated data to elements
	const rects = graph.selectAll('rect').data(data);

	// remove unwanted (if any) shapes using the exit selection
	rects.exit().remove();

	// update current shapes in the dom
	rects
		.attr('width', x.bandwidth)
		.attr('fill', 'orange')
		.attr('x', d => x(d.name));

	// append the enter selection to the dom
	rects.enter()
		.append('rect')
		.attr('height', 0)
		.attr('fill', 'orange')
		.attr('x', d => x(d.name))
		.attr('y', graphHeight)
		.merge(rects)
		.transition(transition)
			.attrTween('width', widthTween)
			.attr('y', d => y(d.orders))
			.attr('height', d => graphHeight - y(d.orders));

	// call the axes
	xAxisGroup.call(xAxis);
	yAxisGroup.call(yAxis);
};

var data = [];

// get data from firestore
db.collection('dishes').onSnapshot(res => {
	res.docChanges().forEach(change => {
		const doc = {...change.doc.data(), id: change.doc.id};
		var index = -1;

		switch(change.type) {
			case 'added':
				data.push(doc);
				break;
			case 'modified':
				index = data.findIndex(item => item.id === doc.id);	
				data[index] = doc;
				break;
			case 'removed':
				data = data.filter(item => item.id !== doc.id);
				break;
			default:
				console.log("what is happening?! " + change.type);
				break;
		}
	});

	update(data);
})

// Tweens
const widthTween = (d) => {

	// define interpolation
	// d3.interpolate returns a function
	let i = d3.interpolate(0, x.bandwidth());

	// return a function which takes in a time ticker 't'
	return function(t) {
		// return the value from passing the ticker into the interpolation
		return i(t);
	}
}