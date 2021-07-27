const { readFile } = require("fs/promises");
const { basename, resolve } = require("path");
const glob = require("fast-glob");

function isCopyChunk(id) {
	return id.endsWith("?copy");
}

/**
 * 该插件支持将复制的文件传递给其它插件处理，请注意插件的顺序。
 *
 * @param list 复制项列表
 */
module.exports = function copyPlugin(list) {
	const processedChunks = new Map();

	return {
		name: "copy",

		/**
		 * 在构建开始时将要复制的文件作为 Chunk 加入。
		 *
		 * Chunk 将作为源码被后续插件处理，而 asset 则不行。
		 */
		async buildStart() {
			for (const entry of list) {
				const files = await glob(entry.src);
				for (const file of files) {
					const fileName = basename(file);
					this.emitFile({
						type: "chunk",
						fileName,
						id: file + "?copy",
					});
				}
			}
		},

		/**
		 * 对于 ID 不等于文件名的模块，必须要有自定义的 resolveId，否则报错。
		 *
		 * @param source 模块的 ID
		 * @return {Promise<string|null>}
		 */
		async resolveId(source) {
			if (!isCopyChunk(source)) {
				return null;
			}
			source = source.slice(0, -"?copy".length);
			const resolution = await this.resolve(source, undefined, { skipSelf: true });
			if (!resolution) {
				return null;
			}
			return `${resolution.id}?copy`;
		},

		/**
		 * 根据模块解析后的 ID 加载其内容，这里就直接读取文件。
		 *
		 * @param id 模块的 ID
		 * @return {Promise<string|null>} 内容，如果不归本插件管就返回 null。
		 */
		load(id) {
			if (!isCopyChunk(id)) {
				return null;
			}
			const importee = id.slice(0, -"?copy".length);
			this.addWatchFile(importee);
			return readFile(importee, "utf8");
		},

		/**
		 * 在这里把模块的内容保存下来，以便后续取出，因为 rollup 只认 JS 代码，
		 * 所以不能把模块的内容返回。
		 *
		 * 注意 rollup-plugin-terser 使用的是 renderChunk 所以没法处理复制的文件。
		 *
		 * @param code 模块的内容
		 * @param id 模块的 ID
		 * @return {string} 返回空模块以免 rollup 不认识。
		 */
		transform(code, id) {
			if (!isCopyChunk(id)) {
				return code;
			}
			processedChunks.set(id, code);
			return "export default null";
		},

		/**
		 * 最后输出 Chunk，这里不使用 code 因为它是空模块，
		 * 而是从前面保存的模块里取出对应的内容。
		 *
		 * @param code 这个代码并不使用。
		 * @param chunk
		 * @return {null|any} 内容，如果不归本插件管就返回 null。
		 */
		renderChunk(code, chunk) {
			const [id] = Object.keys(chunk.modules);
			if (!isCopyChunk(id)) {
				return null;
			}
			return processedChunks.get(id);
		},
	};
};
