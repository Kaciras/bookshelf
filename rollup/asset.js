import { readFile } from "fs/promises";
import { basename } from "path";
import { createFilter } from "@rollup/pluginutils";
import mime from "mime";
import { svgToUrl } from "@kaciras/utilities/node";

export const AssetType = {
	Source: 0,		// Imported as string.
	Url: 1,			// Converted into import, or inlined as base64 data URL.
	Resource: 2,	// Converted into import。
};

const srcRE = /[?&]source(?:&|$)/;
const urlRE = /[?&]url(?:&|$)/;
const resRE = /[?&]resource(?:&|$)/;

function detectFromQuery(id) {
	if (srcRE.test(id)) return AssetType.Source;
	if (urlRE.test(id)) return AssetType.Url;
	if (resRE.test(id)) return AssetType.Resource;
}

// https://github.com/rollup/plugins/blob/7b6255774053ef170d9302cbbd8f99d5a58485ed/packages/url/src/index.js#L60
function toDataUrl(source, mimetype) {
	const isSVG = mimetype === "image/svg+xml";
	const code = isSVG
		? svgToUrl(source.string)
		: source.buffer.toString("base64");
	const encoding = isSVG ? "" : ";base64";
	return `data:${mimetype}${encoding},${code}`;
}

/**
 * Wrap string and buffer into the same API to reduce the number of `if` statements.
 *
 * data   - The raw object, string or buffer.
 * string - The string value, or `data.toString()` if data is a Buffer.
 * buffer - The buffer value, or `Buffer.from(data)` if data is a string.
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
 * Like the createFilter in rollup/pluginutils,
 * but does not match if not provide an include pattern.
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
 * Get emitted asset file's `referenceId` by its module id.
 *
 * https://github.com/vitejs/vite/blob/f114acea76e5ae238a54b2dedb288cb0e819f86e/packages/vite/src/node/plugins/asset.ts#L249
 *
 * @param id The resolved module id.
 * @return {string} The referenceId, can be used with this.getFileName().
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
 * The transform hook in Rollup accepts only JS code. We need a mechanism
 * for binary data, like Webpack's loader.
 */
export default function staticAssetPlugin(options) {
	options = { ...defaultOptions, ...options };

	const { source, url, resource, limit } = options;
	const loaders = options.loaders.filter(Boolean);

	const isInline = createFilter2(source);
	const isUrl = createFilter2(url);
	const isResource = createFilter2(resource);

	function detectFromPath(id) {
		if (isInline(id)) return AssetType.Source;
		if (isUrl(id)) return AssetType.Url;
		if (isResource(id)) return AssetType.Resource;
	}

	return {
		name: "static-asset",

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
			const [path, query] = id.split("?", 2);
			const params = new URLSearchParams(query);
			this.addWatchFile(path);

			const info = { path, type, params };
			let source = new BufferSource(await readFile(path));

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

					// Avoid decoding when use it again.
					Object.defineProperty(source, "buffer", {
						value: buffer,
						configurable: false,
					});

					const mimetype = mime.getType(path);
					const url = toDataUrl(source, mimetype);
					return `export default "${url}"`;
				}
			}
			const fileName = params.get("filename") || basename(path);
			referenceMap.set(id, this.emitFile({
				type: "asset",
				fileName,
				source: source.data,
			}));
			return `export default "${fileName}"`;
		},
	};
}
