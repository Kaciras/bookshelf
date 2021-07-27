const postcss = require("postcss");
const csso = require("postcss-csso");

const cssLangRE = /\.(css|less|sass|scss|styl|stylus|pcss|postcss)($|\?)/;

const convertor = postcss([csso()]);

module.exports = function postcssPlugin() {
	return {
		name: "postcss",
		async transform(code, id) {
			if (!cssLangRE.test(id)) {
				return;
			}
			return convertor.process(code).css;
		},
	};
};
