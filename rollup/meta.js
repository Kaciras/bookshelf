/**
 * 定义环境变量的插件，跟 webpack 的 EnvironmentPlugin 相似。
 * 所有的变量通过 import.meta.* 对象访问。
 *
 * @param table 一个对象，包含环境变量的定义，值会自动转换无需 JSON 化。
 */
module.exports = function metaPlugin(table) {

	// 复制一份，保证不变性
	const map = new Map(Object.entries(table));

	return {
		name: "define-import-meta",

		resolveImportMeta(property) {
			if (!map.has(property)) {
				return null;
			}
			const value = map.get(property);
			return JSON.stringify(value);
		},
	};
};
