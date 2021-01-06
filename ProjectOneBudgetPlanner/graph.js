/* global console, d3, db */

const dims = { height: 300, width: 300, radius: 150 };
const center = { x: (dims.width / 2 + 5), y: (dims.height / 2 + 5) };

const svg = d3.select('.canvas')
	.append('svg')
	.attr('width', dims.width + 150)
	.attr('height', dims.height + 150);

const graph = svg.append('g')
	.attr('transform', `translate(${center.x}, ${center.y})`);

const pie = d3.pie()
	.sort(null)
	.value(d => d.cost);

const arcPath = d3.arc()
	.outerRadius(dims.radius)
	.innerRadius(dims.radius / 2);

// create ordinal scale
const colour = d3.scaleOrdinal(d3['schemeSet3']);

// legend setup
const legendGroup = svg.append('g')
	.attr('transform', `translate(${dims.width + 40}, 10)`)

const legend = d3.legendColor()
	.shape('circle')
	.shapePadding(10)
	.scale(colour);

const tip = d3.tip()
	.attr('class', 'tip card')
	.html(d => {
		let content = `<div class='name'>${d.data.name}</div>`;
		content += `<div class='cost'>${d.data.cost}</div>`;
		content += `<div class='delete'>Click slice to delete</div>`;
		return content;
	});

graph.call(tip);

// update function
const update = (data) => {
	
	// update colour scale domain
	colour.domain(data.map(d => d.name));

	// update and call legend
	legendGroup.call(legend);
	legendGroup.selectAll('text').attr('fill', 'white');
	// join enhanced (pie) data to path elements
	const paths = graph.selectAll('path')
		.data(pie(data));

		// handle exit selection
		paths.exit()
			.transition().duration(750)
			.attrTween('d', arcTweenExit)
			.remove();

		// handle existing elements in the DOM
		paths
			.transition().duration(750)
			.attrTween('d', arcTweenUpdate);

		paths.enter()
			.append('path')
			.attr('class', 'arc')
			.attr('stroke', '#fff')
			.attr('stroke-width', 3)
			.attr('fill', d => colour(d.data.name))
			.each(function(d) {this._current = d})
			.transition().duration(750)
				.attrTween('d', arcTweenEnter);
		
	// add events
	graph.selectAll('path')
		.on('mouseover', (e, d) => {
			tip.show(d, e.currentTarget);
			handleMouseOver(e);
		})
		.on('mouseout', (e, d) => {
			tip.hide();
			handleMouseOut(e, d);
		})
		.on('click', handleClick);
};

// data array and firestore
var data = [];

db.collection('expenses').onSnapshot(res => {
	res.docChanges().forEach(change => {
		const doc = { ...change.doc.data(), id: change.doc.id };

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
				console.log("Some unknown change type in the data: " + change.type);
				break;
		}
	});

	update(data);
});

const arcTweenEnter = (d) => {

	var i = d3.interpolate(d.endAngle, d.startAngle);

	return function(t) {
		d.startAngle = i(t);
		return arcPath(d);
	}
}

const arcTweenExit = (d) => {

	var i = d3.interpolate(d.startAngle, d.endAngle);

	return function(t) {
		d.startAngle = i(t);
		return arcPath(d);
	} 
}

// use function keyword to allow use of this
function arcTweenUpdate(d) {

	// interpolate between the two objects
	var i = d3.interpolate(this._current, d);

	// update current prop with new updated data
	this._current = d;

	return function(t) {
		return arcPath(i(t));
	}
}

// event listeners
const handleMouseOver = (e) => {
	d3.select(e.currentTarget)
		.transition('changeSliceFill').duration(300)
		.attr('fill', '#fff');
}

const handleMouseOut = (e, d) => {
	d3.select(e.currentTarget)
		.transition('changeSliceFill').duration(300)
		.attr('fill', colour(d.data.name))
}

const handleClick = (e, d) => {
	const id = d.data.id;
	db.collection('expenses').doc(id).delete();
}