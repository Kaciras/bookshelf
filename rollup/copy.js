const { basename, join } = require("path");
const glob = require("fast-glob");
const { chunkImport } = require("./html");

const hostId = "COPY_IMPORTER";

/**
 * 复制资源的插件，与 rollup-plugin-copy 相比增加了功能：
 * 1）将复制的文件加入监视。
 * 2）复制的文件能够被其它插件处理，请注意插件的顺序。
 *
 * @param list 复制项列表，格式参考了 copy-webpack-plugin。
 */
module.exports = function copyPlugin(list) {
	const ids = new Set();

	return {
		name: "copy",

		/**
		 * 在构建开始时将要复制的文件作为 Chunk 加入。
		 *
		 * Chunk 将作为源码被后续插件处理，而 asset 则不行。
		 */
		async buildStart() {
			const groups = await Promise.all(list.map(entry => {
				const { from, context } = entry;
				return glob(context ? `${context}/${from}` : from);
			}));
			for (let i = 0; i < list.length; i++) {
				const { to, toDirectory } = list[i];
				const files = groups[i];

				for (const file of files) {
					let fileName = basename(file);
					if (toDirectory) {
						fileName = join(to, fileName);
					} else if (to) {
						fileName = to;
					}
					ids.add(file + "?resource&filename=" + fileName);
				}
			}
			this.emitFile({ type: "chunk", fileName: hostId, id: hostId });
		},

		/**
		 * 对于 ID 不等于文件名的模块，必须要有自定义的 resolveId，否则报错。
		 *
		 * @param source 模块的 ID
		 * @return {Promise<string|null>}
		 */
		async resolveId(source) {
			if (source === hostId) {
				return hostId;
			}
			return ids.has(source) ? source : null;
		},

		load(id) {
			if (id !== hostId) {
				return null;
			}
			return chunkImport(ids);
		},

		/**
		 *
		 * @param _ 没用的参数
		 * @param bundle 输出的入口文件
		 */
		generateBundle: (_, bundle) => delete bundle[hostId],
	};
};
