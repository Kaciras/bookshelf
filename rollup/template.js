const { minify } = require("html-minifier-terser");

// 这 ESTree 匹配个 template.innerHtml = `...` 真麻烦啊。
function getTemplateLiteral(node) {
	if (node.type !== "ExpressionStatement") return;
	const { expression } = node;
	if (expression.type !== "AssignmentExpression") return;
	const { type, object, property } = expression.left;
	if (type !== "MemberExpression"
		|| object.name !== "template"
		|| property.name !== "innerHTML") return;
	return expression.right;
}

function findTemplateHtml(ast) {
	for (const node of ast.body) {
		const literal = getTemplateLiteral(node);
		if (literal) return literal;
	}
}

/**
 * 因为组件的 HTML 不如 CSS 那么多所以本项目里都是直接写的字符串。
 * 所以没法复用 html 插件来去掉空白，只能再写一个插件处理。
 */
module.exports = function templatePlugin() {

	return {
		name: "template-html",
		transform(code, id) {
			if (!id.endsWith(".js")) {
				return;
			}
			const ast = this.parse(code);
			const literal = findTemplateHtml(ast);
			if (!literal) {
				return;
			}
			const start = literal.start + 1;
			const end = literal.end - 1;

			const before = code.slice(0, start);
			const after = code.slice(end);
			let html = code.slice(start, end);

			html = minify(html, {
				collapseWhitespace: true,
				collapseBooleanAttributes: true,
				removeComments: true,
				removeAttributeQuotes: true,
			});
			return before + html + after;
		},
	};
};
