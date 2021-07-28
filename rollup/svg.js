const { optimize, extendDefaultPlugins } = require("svgo");

/**
 * 替换 SVG 的属性，比如宽高设为 1em 以便外层用 font-size 控制。
 */
const changeRootAttributePlugin = {
	name: "changeSVGAttribute",
	type: "perItem",
	params: {
		width: "1em",
		height: "1em",
	},
	fn(ast, params) {
		const { type, name, attributes } = ast;
		if (type === "element" && name === "svg") {
			Object.assign(attributes, params);
		}
	},
};

const config = {
	plugins: [
		...extendDefaultPlugins([
			{ name: "removeViewBox", active: false },
		]),
		changeRootAttributePlugin,
	],
};

module.exports = function svgoPlugin() {
	return {
		name: "optimize-svg",
		transform(code, id) {
			if (!/\.svg(\?|$)/.test(id)) {
				return;
			}
			const { data } = optimize(code, config);
			return data.replaceAll('"', "'");
		},
	};
};
