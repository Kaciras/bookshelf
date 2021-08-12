const { readFile } = require("fs/promises");
const { basename } = require("path");
const { createFilter } = require("@rollup/pluginutils");
const mime = require("mime");

const AssetType = {
	Source: 0,		// 作为字符串导入。
	Url: 1,			// 作为 URL 导入，可能会内联为 DataUrl。
	Resource: 2,	// 作为外部 URL 导入。
};

const srcRE = /([?&])source(?:&|$)/;
const urlRE = /([?&])url(?:&|$)/;
const resRE = /([?&])resource(?:&|$)/;

function detectFromQuery(id) {
	if (srcRE.test(id)) return AssetType.Source;
	if (urlRE.test(id)) return AssetType.Url;
	if (resRE.test(id)) return AssetType.Resource;
}

// https://www.zhangxinxu.com/wordpress/2018/08/css-svg-background-image-base64-encode/
const encodeMap = {
	'"': "'",
	"%": "%25",
	"#": "%23",
	"{": "%7B",
	"}": "%7D",
	"<": "%3C",
	">": "%3E",
};

function encodeSVG(code) {
	return code.replaceAll(/["%#{}<>]/g, v => encodeMap[v]);
}

// https://github.com/rollup/plugins/blob/master/packages/url/src/index.js
function toDataUrl(source, mimetype) {
	const isSVG = mimetype === "image/svg+xml";
	const code = isSVG
		? encodeSVG(source.string)
		: source.buffer.toString("base64");
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
 * 本插件提供一个通用的规则，将资源分为三类，其它插件可以通过设置 URL 参数来让模块本本插件处理。
 */
module.exports = function createInlinePlugin(options) {
	const { source = {}, url = {}, resource = {}, limit = 4096, loaders = [] } = options;

	const isInline = createFilter(source.include, source.exclude);
	const isUrl = createFilter(url.include, url.exclude);
	const isResource = createFilter(resource.include, resource.exclude);

	function detectFromPath(id) {
		if (isInline(id)) return AssetType.Source;
		if (isUrl(id)) return AssetType.Url;
		if (isResource(id)) return AssetType.Resource;
	}

	const copies = new Map();

	return {
		name: "asset-module",

		/**
		 * 默认的 ID 解析器将 ID 视为相对路径，无法处理带 URL 参数的情况。
		 * 这里先调用默认链解析文件路径，然后再把参数加回结果。
		 *
		 * TODO: filename 不同也解析到同一ID？
		 *
		 * @param source 模块的 ID
		 * @param importer 引用此模块的模块
		 * @return {Promise<string|null>} 解析后的 ID
		 */
		async resolveId(source, importer) {
			if (!detectFromQuery(source)) {
				return null;
			}
			const [file, query] = source.split("?", 2);
			const { id } = await this.resolve(file, importer, { skipSelf: true });
			return id + "?" + query;
		},

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
				const rv = await loaderFn(source, id, type);
				if (typeof rv === "string") {
					source = new StringSource(rv);
				} else if (Buffer.isBuffer(rv)) {
					source = new BufferSource(rv);
				}
			}

			if (type === AssetType.Source) {
				return `export default ${JSON.stringify(source.string)};`;
			}
			if (type === AssetType.Url) {
				const { buffer } = source;
				if (buffer.length < limit) {

					// 避免再次获取时的转换开销。
					source.buffer = buffer;

					const mimetype = mime.getType(file);
					const url = toDataUrl(source, mimetype);
					return `export default "${url}"`;
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

module.exports.AssetType = AssetType;
