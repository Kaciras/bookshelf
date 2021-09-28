import postcss from "postcss";
import nested from "postcss-nested";
import csso from "postcss-csso";
import vars from "postcss-simple-vars";

/*
 * 【关于 import 的处理】
 * CSS 里的导入与 JS 不同，它是相对于文档而不是当前脚本，
 * 要正确的处理必须在构建期获取打包期的路径，很麻烦。
 */

const cssLangRE = /\.(css|pcss)($|\?)/;

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
