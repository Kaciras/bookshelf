const { createFilter } = require("@rollup/pluginutils");

/**
 * 将模块的内容作为字符串导出的插件，相当于 webpack 的 type: "asset/source"
 */
module.exports = function inline(options) {
	const { include, exclude } = options;
	const filter = createFilter(include, exclude);

	return {
		name: "inline-source",
		transform(code, id) {
			if (!filter(id)) {
				return;
			}
			code = JSON.stringify(code);
			return `export default ${code};`;
		},
	};
};
