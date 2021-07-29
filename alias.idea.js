/**
 * 本文件对构建无任何影响，仅作为 WebStorm 识别别名用。
 * 在 File -> Settings -> Languages & Frameworks -> JavaScript -> Webpack 选择该文件即可。
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
