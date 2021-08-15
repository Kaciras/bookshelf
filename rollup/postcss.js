const postcss = require("postcss");
const nested = require("postcss-nested");
const csso = require("postcss-csso");
const vars = require("postcss-simple-vars");

const cssLangRE = /\.(css|less|sass|scss|styl|pcss)($|\?)/;

const convertor = postcss([
	vars(),		// 局部变量还是预处理方便些
	csso(),		// 压缩结果
	nested(),	// 支持嵌套语法
]);

module.exports = function (source, info) {
	if (!cssLangRE.test(info.id)) {
		return;
	}
	return convertor.process(source.string).css;
};
