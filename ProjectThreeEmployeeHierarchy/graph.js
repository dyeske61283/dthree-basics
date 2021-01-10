/*globals console, db, d3*/

const dims = {height: 500, width: 1100};

const svg = d3.select('.canvas')
	.append('svg')
	.attr('width', dims.width + 100)
	.attr('height', dims.height + 100);

const graph = svg.append('g')
	.attr('transform', 'translate(50, 50)');

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

});