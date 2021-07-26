const postcss = require("postcss");
const csso = require("postcss-csso");

const convertor = postcss([csso()]);

module.exports = function postcssPlugin() {
	return {
		name: "postcss",
		async transform(code, id) {
			if (!id.endsWith(".css")) {
				return;
			}
			return convertor.process(code).css;
		},
	};
}
