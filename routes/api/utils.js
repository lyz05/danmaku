const convert = require("xml-js");

const content_template = {
	timepoint: 0,
	content: "",
	ct: 1,
	size: 20,
	color: 16777215,
	unixtime: Math.floor(Date.now() / 1000),
	uid: 0,
};

function time_to_second(time) {
	const t = time.split(":");
	let s = 0;
	let m = 1;
	while (t.length > 0) {
		s += m * parseInt(t.pop(), 10);
		m *= 60;
	}
	return s;
}

function make_response(contents) {
	let xml = {
		_declaration: {
			_attributes: {
				version: "1.0",
				encoding: "utf-8"
			}
		},
		i: {
			d: []
		}
	};
	for (let content of contents) {
		xml.i.d.push({
			_attributes: {
				p: `${content.timepoint},${content.ct},${content.size},${content.color},${content.unixtime},${content.uid},26732601000067074`
			},
			_text: content.content
		});
	}


	const res = convert.js2xml(xml, {compact: true, spaces: 4});
	return res;
}

module.exports = {time_to_second, make_response, content_template};
