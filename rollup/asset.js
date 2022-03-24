import { readFile } from "fs/promises";
import { basename } from "path";
import { createFilter } from "@rollup/pluginutils";
import mime from "mime";
import { svgToUrl } from "@kaciras/utilities";

export const AssetType = {
	Source: 0,		// 作为字符串导入。
	Url: 1,			// 作为 URL 导入，可能会内联为 DataUrl。
	Resource: 2,	// 作为外部 URL 导入。
};

const srcRE = /[?&]source(?:&|$)/;
const urlRE = /[?&]url(?:&|$)/;
const resRE = /[?&]resource(?:&|$)/;

function detectFromQuery(id) {
	if (srcRE.test(id)) return AssetType.Source;
	if (urlRE.test(id)) return AssetType.Url;
	if (resRE.test(id)) return AssetType.Resource;
}

// https://github.com/rollup/plugins/blob/master/packages/url/src/index.js
function toDataUrl(source, mimetype) {
	const isSVG = mimetype === "image/svg+xml";
	const code = isSVG
		? svgToUrl(source.string)
		: source.buffer.toString("base64");
	const encoding = isSVG ? "" : ";base64";
	return `data:${mimetype}${encoding},${code}`;
}

/**
 * 本模块的 loader 跟一样 Webpack 用 StringSource 和 BufferSource
 * 分别包装字符串和 Buffer 两种类型的结果，并避免转换开销。
 *
 * data   - 原始数据
 * string - 字符串表示
 * buffer - 字节表示
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
 * rollup/pluginutils 的 createFilter 在空参数时默认为全部通过，
 * 这跟常识不符，一般没有指定的话都是全部拦截的。
 *
 * @param options 包含 include 和 exclude 的对象
 */
function createFilter2(options) {
	const { include, exclude } = options;
	if (!include?.length) {
		return () => false;
	}
	return createFilter(include, exclude);
}

const referenceMap = new Map();

/**
 * 获取资源文件的名字，Vite 里就是这么做的。
 * https://github.com/vitejs/vite/blob/7977e92e0610cfcb814b45af8432bab1054863d2/packages/vite/src/node/plugins/asset.ts#L183
 *
 * @param id 资源 ID
 * @return {string} 输出的文件名
 */
export function getRefId(id) {
	return referenceMap.get(id);
}

const defaultOptions = {
	source: {},
	url: {},
	resource: {},
	limit: 4096,
	loaders: [],
};

/**
 * Rollup 似乎没有提供处理资源的规范，只能自己撸一个了。
 * 本插件提供一个通用的接口，将资源分为三类，其它插件可以通过设置 URL 参数来让模块本本插件处理。
 */
export default function createInlinePlugin(options) {
	const { source, url, resource, limit, loaders } = { ...defaultOptions, ...options };

	const isInline = createFilter2(source);
	const isUrl = createFilter2(url);
	const isResource = createFilter2(resource);

	function detectFromPath(id) {
		if (isInline(id)) return AssetType.Source;
		if (isUrl(id)) return AssetType.Url;
		if (isResource(id)) return AssetType.Resource;
	}

	return {
		name: "asset-module",

		/**
		 * 默认的 ID 解析器将 ID 视为相对路径，无法处理带 URL 参数的情况。
		 * 这里先调用默认链解析文件路径，然后再把参数加回结果。
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
			const resolved = await this.resolve(file, importer, { skipSelf: true });

			if (resolved) {
				return resolved.id + "?" + query;
			}
			throw new Error(`Couldn't resolve ${file} from ${importer}`);
		},

		async load(id) {
			const type = detectFromQuery(id) ?? detectFromPath(id);
			if (type === undefined) {
				return null;
			}
			const [file, query] = id.split("?", 2);
			const params = new URLSearchParams(query);
			this.addWatchFile(file);

			const info = { id, type, params };
			let source = new BufferSource(await readFile(file));

			for (const loaderFn of loaders) {
				const rv = await loaderFn.call(this, source, info);
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
					Object.defineProperty(source, "buffer", {
						value: buffer,
						configurable: false,
					});

					const mimetype = mime.getType(file);
					const url = toDataUrl(source, mimetype);
					return `export default "${url}"`;
				}
			}
			const fileName = params.get("filename") || basename(file);
			referenceMap.set(id, this.emitFile({
				type: "asset",
				fileName,
				source: source.data,
			}));
			return `export default "${fileName}"`; // 好像没必要用 JSON.stringify
		},
	};
}
