const { minify } = require("html-minifier-terser");
const { createFilter } = require("@rollup/pluginutils");
const { minifyOptions } = require("./html");

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

const isComponentJS = createFilter("components/*/*.js");

/**
 * 因为组件的 HTML 不如 CSS 那么多所以本项目里都是直接写的字符串。
 * 所以没法复用 html 插件来去掉空白，只能再写一个插件处理。
 */
module.exports = function templatePlugin() {
	return {
		name: "template-html",
		transform(code, id) {
			if (!isComponentJS(id)) {
				return;
			}
			const ast = this.parse(code);
			const literal = ast.body.map(getTemplateLiteral).find(Boolean);
			if (!literal) {
				return;
			}
			const start = literal.start + 1;
			const end = literal.end - 1;

			const before = code.slice(0, start);
			const html = code.slice(start, end);
			const after = code.slice(end);

			return before + minify(html, minifyOptions) + after;
		},
	};
};
