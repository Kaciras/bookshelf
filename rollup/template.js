import { minify } from "html-minifier-terser";
import MagicString from "magic-string";
import { minifyOptions } from "./html.js";

// 这 ESTree 匹配个 .innerHtml = `...` 真麻烦啊。
function getTemplateLiteral(node) {
	if (node.type !== "ExpressionStatement") return;

	const { expression } = node;
	if (expression.type !== "AssignmentExpression") return;

	const { left } = expression;
	const { property } = left;
	if (left.type !== "MemberExpression"
		|| property.name !== "innerHTML") return;

	const { type, value } = expression.right;
	switch (type) {
		case "TemplateLiteral":
			return expression.right;
		case "Literal":
			return value && expression.right;
	}
}

/**
 * 压缩 JS 文件内的 HTML 的插件，仅支持 `.innerHtml = "..."` 语句。
 *
 * 因为组件的 HTML 不如 CSS 那么多所以本项目里都是直接写的字符串。
 * 所以没法复用 html 插件来去掉空白，只能再写一个插件处理。
 */
export default function inlineTemplatePlugin() {
	return {
		name: "inline-html-template",

		async transform(code, id) {
			if (!id.endsWith(".js")) {
				return;
			}
			const s = new MagicString(code);
			const ast = this.parse(code);

			// Vite 用这个库我就跟着用了，能生成 SourceMap 也挺好。
			for (const node of ast.body) {
				const literal = getTemplateLiteral(node);
				if (!literal) {
					continue;
				}
				const start = literal.start + 1;
				const end = literal.end - 1;

				let html = code.slice(start, end);
				html = await minify(html, minifyOptions);
				s.overwrite(start, end, html);
			}

			return { code: s.toString(), map: s.generateMap() };
		},
	};
}
