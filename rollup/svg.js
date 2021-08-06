const { optimize, extendDefaultPlugins } = require("svgo");

/**
 * 调整 SVG 的属性，使其能够用容器元素的 CSS 控制：
 * 1）宽高设为 1em 以便外层用 font-size 控制。
 * 2）将 fill 和 stroke 改为 currentColor 以便用 color 控制。
 */
const reactiveRootAttributePlugin = {
	name: "reactiveSVGAttribute",
	type: "perItem",
	fn(ast, params) {
		const { type, name, attributes } = ast;
		const { fill, stroke } = attributes;

		if (type === "element" && name === "svg") {
			if (stroke && stroke !== "none") {
				attributes.stroke = "currentColor";
			}
			if (fill && fill !== "none") {
				attributes.fill = "currentColor";
			}
			attributes.width = attributes.height = "1em";

			Object.assign(attributes, params);
		}
	},
};

const config = {
	plugins: [
		...extendDefaultPlugins([
			{ name: "removeViewBox", active: false },
		]),
		reactiveRootAttributePlugin,
	],
};

module.exports = function (source, id) {
	if (!/\.svg(\?|$)/.test(id)) {
		return;
	}
	const { data } = optimize(source.string, config);
	return data.replaceAll('"', "'");
};
