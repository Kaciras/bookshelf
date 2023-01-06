import { env } from "node:process";
import postcss from "postcss";
import nested from "postcss-nested";
import csso from "postcss-csso";
import vars from "postcss-simple-vars";
import varCompress from "postcss-variable-compress";

/*
 * 【关于 import 的处理】
 * CSS 里的导入与 JS 不同，它是相对于文档而不是当前脚本，
 * 要正确的处理必须在构建期获取打包期的路径，很麻烦。
 */

const plugins = [
	vars(),		// Support SCSS-style variables.
	csso(),		// Compress output.
	nested(),	// Support nesting.
];

if (env.NODE_ENV === "production") {
	plugins.push(varCompress()); // Minimum variable names.
}

const convertor = postcss(plugins);

export default function (source, { path }) {
	if (!/\.css$/.test(path)) {
		return;
	}
	return convertor.process(source.string, { from: path }).css;
}
