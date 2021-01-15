/*globals console, db, d3*/

const dims = {height: 500, width: 1100};

const svg = d3.select('.canvas')
	.append('svg')
	.attr('width', dims.width + 100)
	.attr('height', dims.height + 100);

const graph = svg.append('g')
	.attr('transform', 'translate(0, 50)');

// data strat
const stratify = d3.stratify()
	.id(d => d.name)
	.parentId(d => d.parent);

const tree = d3.tree()
	.size([dims.width, dims.height])

// create ordinal scale
const departmentColour = d3.scaleOrdinal(d3['schemeTableau10']);

// update function
const update = (data) => {

	// remove current nodes
	graph.selectAll('.node').remove();
	graph.selectAll('.link').remove();

	// update ordinal scale domain
	departmentColour.domain(data.map(d => d.department));

	// get updated root node data
	const rootNode = stratify(data);

	const treeData = tree(rootNode);

	// get nodes selection & join data
	const nodes = graph.selectAll('.node')
		.data(treeData.descendants());
	
	// get link selection & join data
	const links = graph.selectAll('.link')
		.data(treeData.links());

	// enter new links
	links.enter()
		.append('path')
			.attr('class', 'link')
			.attr('fill', 'none')
			.attr('stroke', '#aaa')
			.attr('stroke-width', 2)
			.attr('d', d3.linkVertical()
				.x(d => d.x)
				.y(d => d.y));

	// create enter node groups
	const enterNodes = nodes.enter()
		.append('g')
			.attr('class', 'node')
			.attr('transform', d => `translate(${d.x}, ${d.y})`);

	// append rects to enter nodes
	enterNodes.append('rect')
		//apply ordinal scale
		.attr('fill', d => departmentColour(d.data.department))
		.attr('stroke', '#555')
		.attr('stroke-width', 2)
		.attr('height', 50)
		.attr('width', d => d.data.name.length * 20)
		.attr('transform', d => {
			return `translate(${d.data.name.length * -10} , -30)`;
		});

	// append name text
	enterNodes.append('text')
		.attr('text-anchor', 'middle')
		.attr('fill', 'white')
		.text(d => d.data.name);

};

// data & firestore hook-up
var data = [];

db.collection('employees').onSnapshot(res => {

	res.docChanges().forEach(change => {

		const doc = { ...change.doc.data(), id: change.doc.id };

		var index = -1;

		switch (change.type) {
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