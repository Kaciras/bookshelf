const { optimize, extendDefaultPlugins } = require("svgo");

const changeRootAttributePlugin = {
	name: "changeSVGAttribute",
	type: "perItem",
	active: true,
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
		name: "svg-inline-optimize",
		transform(code, id) {
			if (!/\.svg(\?|$)/.test(id)) {
				return;
			}
			const { data } = optimize(code, config);
			return data.replaceAll('"', "'");
		},
	};
};
