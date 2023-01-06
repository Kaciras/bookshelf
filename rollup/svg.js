import { optimize } from "svgo";
import { AssetType } from "./asset.js";

/**
 * Replace some attributes with reactive value:
 * 1) set width & height to "1em".
 * 2) set fill and stroke to "currentColor" if it's not transparent。
 */
function reactivePlugin(options = {}) {
	const { color = true, size = true } = options;

	function enter({ name, attributes }) {
		if (name !== "svg") {
			return;
		}
		const { fill, stroke } = attributes;

		if (color) {
			if (stroke && stroke !== "none") {
				attributes.stroke = "currentColor";
			}
			if (fill !== "none") {
				attributes.fill = "currentColor";
			}
		}
		if (size) {
			attributes.width = attributes.height = "1em";
		}
	}

	return {
		name: "reactiveSVGAttrs",
		fn: () => ({ element: { enter } }),
	};
}

const builtInPlugins = {
	name: "preset-default",
	params: {
		overrides: {
			removeViewBox: false,
		},
	},
};

const inlinePlugins = [
	{
		name: "removeAttrs",
		params: {
			attrs: "class",
		},
	},
	builtInPlugins,
	reactivePlugin(),
];

const resourcePlugins = [
	builtInPlugins,
];

export default function (source, { type, path }) {
	if (!/\.svg$/.test(path)) {
		return;
	}
	const plugins = type === AssetType.Source
		? inlinePlugins : resourcePlugins;

	return optimize(source.string, { plugins, path })
		.data
		.replaceAll('"', "'"); // Avoid escapes
}
