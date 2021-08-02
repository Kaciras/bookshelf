const { readFile } = require("fs/promises");
const { basename } = require("path");
const { createFilter } = require("@rollup/pluginutils");
const mime = require("mime");

const srcRE = /([?&])source(?:&|$)/;
const urlRE = /([?&])url(?:&|$)/;
const resRE = /([?&])resource(?:&|$)/;

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

function toDataUrl(code, mimetype) {
	const isSVG = mimetype === "image/svg+xml";
	code = isSVG ? encodeSVG(code)
		: Buffer.from(code).toString("base64");
	const encoding = isSVG ? "" : ";base64";
	return `data:${mimetype}${encoding},${code}`;
}

class StringSource {

	constructor(string) {
		this.string = string;
	}

	get buffer() {
		return Buffer.from(this.string);
	}
}

class BufferSource {

	constructor(buffer) {
		this.buffer = buffer;
	}

	get string() {
		return this.buffer.toString();
	}
}

const ASSET_SOURCE = 0;
const ASSET_URL = 1;
const ASSET_RESOURCE = 2;

function detectFromQuery(id) {
	if (srcRE.test(id)) return ASSET_SOURCE;
	if (urlRE.test(id)) return ASSET_URL;
	if (resRE.test(id)) return ASSET_RESOURCE;
}

/**
 * 将模块的内容作为字符串导出的插件，相当于 webpack 的 type: "asset/source"
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
			if (!type) {
				return null;
			}
			const [file, query] = id.split("?", 2);
			const params = new URLSearchParams(query);

			let data = await readFile(file);
			let source = new BufferSource(data);

			for (const loaderFn of loaders) {
				const rv = await loaderFn(source, id);
				if (rv === undefined) {
					continue;
				}
				data = rv;
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
					const code = toDataUrl(code, mimetype);
					return `export default "${code}"`;
				}
			}
			const fileName = params.get("filename") || basename(file);
			copies.set(id, { type: "asset", fileName, source: data });
			return `export default "${fileName}"`;
		},

		generateBundle() {
			for (const file of copies.values()) this.emitFile(file);
		},
	};
};
