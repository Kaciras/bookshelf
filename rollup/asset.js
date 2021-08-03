const { readFile } = require("fs/promises");
const { basename } = require("path");
const { createFilter } = require("@rollup/pluginutils");
const mime = require("mime");

const ASSET_SOURCE = 0;
const ASSET_URL = 1;
const ASSET_RESOURCE = 2;

const srcRE = /([?&])source(?:&|$)/;
const urlRE = /([?&])url(?:&|$)/;
const resRE = /([?&])resource(?:&|$)/;

function detectFromQuery(id) {
	if (srcRE.test(id)) return ASSET_SOURCE;
	if (urlRE.test(id)) return ASSET_URL;
	if (resRE.test(id)) return ASSET_RESOURCE;
}

// https://github.com/rollup/plugins/blob/master/packages/url/src/index.js
function encodeSVG(code) {
	code = code
		.replace(/[\n\r]/gim, "")
		.replace(/\t/gim, " ")
		.replace(/<!--(.*(?=-->))-->/gim, "")
		.replace(/'/gim, "\\i");

	code = encodeURIComponent(code);

	return code
		.replace(/\(/g, "%28")
		.replace(/\)/g, "%29");
}

function toDataUrl(buffer, mimetype) {
	const isSVG = mimetype === "image/svg+xml";
	const code = isSVG
		? encodeSVG(buffer.toString())
		: buffer.toString("base64");
	const encoding = isSVG ? "" : ";base64";
	return `data:${mimetype}${encoding},${code}`;
}

/**
 * 本模块的 loader 跟一样 Webpack 用 StringSource 和 BufferSource
 * 分别包装字符串和 Buffer 两种类型的结果，提供一致的接口：
 */
class StringSource {

	constructor(data) {
		this.data = data;
	}

	get string() {
		return this.data;
	}

	get buffer() {
		return Buffer.from(this.string);
	}
}

class BufferSource {

	constructor(buffer) {
		this.data = buffer;
	}

	get buffer() {
		return this.data;
	}

	get string() {
		return this.data.toString();
	}
}

/**
 * Rollup 似乎没有提供处理资源的接口，只能自己撸一个了。
 */
module.exports = function createInlinePlugin(options) {
	const { source = {}, url = {}, resource = {}, limit = 4096, loaders = [] } = options;

	const isInline = createFilter(source.include, source.exclude);
	const isUrl = createFilter(url.include, url.exclude);
	const isResource = createFilter(resource.include, resource.exclude);

	function detectFromPath(id) {
		if (isInline(id)) return ASSET_SOURCE;
		if (isUrl(id)) return ASSET_URL;
		if (isResource(id)) return ASSET_RESOURCE;
	}

	const copies = new Map();

	return {
		name: "asset-module",

		async load(id) {
			const type = detectFromQuery(id) ?? detectFromPath(id);
			if (type === undefined) {
				return null;
			}
			const [file, query] = id.split("?", 2);
			const params = new URLSearchParams(query);
			this.addWatchFile(file);

			let source = new BufferSource(await readFile(file));

			for (const loaderFn of loaders) {
				const rv = await loaderFn(source, id);
				if (typeof rv === "string") {
					source = new StringSource(rv);
				} else if (Buffer.isBuffer(rv)) {
					source = new BufferSource(rv);
				}
			}

			if (type === ASSET_SOURCE) {
				return `export default ${JSON.stringify(source.string)};`;
			}
			if (type === ASSET_URL) {
				const { buffer } = source;
				if (buffer.length < limit) {
					const mimetype = mime.getType(file);
					const code = toDataUrl(buffer, mimetype);
					return `export default "${code}"`;
				}
			}
			const fileName = params.get("filename") || basename(file);
			copies.set(id, { type: "asset", fileName, source: source.data });
			return `export default "${fileName}"`;
		},

		generateBundle() {
			for (const file of copies.values()) this.emitFile(file);
		},
	};
};
