const axios = require("axios");

const BASE_URL = "https://gd.lyz05.workers.dev";

function group(array, subGroupLength) {
	let index = 0;
	const newArray = [];

	while (index < array.length) {
		newArray.push(array.slice(index, index += subGroupLength));
	}

	return newArray;
}

async function id2path(id) {
	const url = `${BASE_URL}/0:id2path`;
	const ret = await axios.post(url, { id });
	return `${BASE_URL}/0:${ret.data}`;
}

async function query(q) {
	const url = `${BASE_URL}/0:search`;
	let files = [];
	let page_token = null;
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const data = {
			q,
			page_index: 1,
			page_token,
		};
		const ret = await axios.post(url, data);
		files = files.concat(ret.data.data.files);
		// console.log(ret.data.data.files)
		page_token = ret.data.nextPageToken;
		if (page_token === null) {
			break;
		}
	}
	// console.log('files:',files);
	return files;
}

// async function queryData(path = "") {
// 	const url = `${BASE_URL}/0:/Inbox/seer/%E5%86%99%E7%9C%9F/Miho%20Kaneko%20Complete%20Photo%20Collection/${path}`;
// 	const data = {
// 		q: "",
// 		page_index: 0,
// 		page_token: null,
// 		password: null,
// 	};
// 	const response = await axios.post(url, data);
// 	return response.data;
// }

// async function dfs(path) {
// 	let l = [];
// 	const res = await queryData(path);
// 	for (const item of res.data.files) {
// 		if (item.mimeType === "application/vnd.google-apps.folder") {
// 			l = l.concat(await dfs(`${path + item.name}/`));
// 		} else {
// 			l.push(item.name);
// 		}
// 	}
// 	return l;
// }

// async function main(num) {
// 	// const res = await dfs('');
// 	// console.log(res);
// 	const files = await query();
// 	const link = files[num].thumbnailLink;
// 	console.log(link);
// }

module.exports = {
	query,
	id2path,
	group,
};
// main(12);

// console.log(response.data.data.files)
