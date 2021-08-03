const { basename, join } = require("path");
const glob = require("fast-glob");
const { chunkImport } = require("./html");

const hostId = "COPY_IMPORTER";

/**
 * 复制资源的插件，该插件需要搭配 asset 插件使用。
 *
 * 与 rollup-plugin-copy 相比有些区别：
 * 1）将复制的文件加入监视。
 * 2）复制的文件将作为资源由 asset 插件处理。
 *
 * @param list 复制项列表，格式参考了 copy-webpack-plugin。
 */
module.exports = function copyPlugin(list) {
	const ids = new Set();

	return {
		name: "copy",

		/**
		 * 在构建开始时找到所有要复制的文件，将它们加入 ID 集合。
		 * 然后插入一个虚拟模块用于后续处理。
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
		 * @return {Promise<string|null>} 解析后的 ID
		 */
		async resolveId(source) {
			if (source === hostId) {
				return hostId;
			}
			return ids.has(source) ? source : null;
		},

		/**
		 * 将待复制的文件路径转换为虚拟模块里的 import 语句。
		 */
		load(id) {
			if (id !== hostId) {
				return null;
			}
			return chunkImport(ids);
		},

		/**
		 * 默认每个模块都生成一个文件，所以要从构建的输出中删除虚拟模块。
		 *
		 * @param _ 没用的参数
		 * @param bundle 输出的入口文件
		 */
		generateBundle: (_, bundle) => delete bundle[hostId],
	};
};
