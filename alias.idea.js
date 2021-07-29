/**
 * WebStorm 不支持解析 Rollup，只能用 Webpack 的配置来记录别名。
 * 在 File -> Settings -> Languages & Frameworks -> JavaScript -> Webpack 选择该文件。
 *
 * Rollup 的配置文件也会从这里读取别名信息。
 */
const { resolve } = require("path");

module.exports = {
	resolve: {
		alias: {
			"@assets": resolve(__dirname, "assets"),
			"@common": resolve(__dirname, "common/index.js"),
		},
	},
};
