import MagicString from "magic-string";
import { transformHTML } from "./html.js";

// Finding an innerHtml=`...` is so troublesome with ESTree.
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
 * Compress inlined HTML at `.innerHtml = "<HTML>"`。
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

			for (const node of ast.body) {
				const literal = getTemplateLiteral(node);
				if (!literal) {
					continue;
				}
				const start = literal.start + 1;
				const end = literal.end - 1;

				let html = code.slice(start, end);
				html = await transformHTML(html);
				s.overwrite(start, end, html);
			}

			return { code: s.toString(), map: s.generateMap() };
		},
	};
}
