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

module.exports = {time_to_second, content_template};
