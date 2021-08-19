import postcss from "postcss";
import nested from "postcss-nested";
import csso from "postcss-csso";
import vars from "postcss-simple-vars";

const cssLangRE = /\.(css|less|sass|scss|styl|pcss)($|\?)/;

const convertor = postcss([
	vars(),		// 局部变量还是预处理方便些
	csso(),		// 压缩结果
	nested(),	// 支持嵌套语法
]);

export default function (source, info) {
	if (!cssLangRE.test(info.id)) {
		return;
	}
	return convertor.process(source.string).css;
}
