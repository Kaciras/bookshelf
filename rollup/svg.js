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

const inlineConfig = {
	plugins: [
		{
			name: "removeAttrs",
			params: {
				attrs: "class",
			},
		},
		builtInPlugins,
		reactivePlugin(),
	],
};

const resourceConfig = {
	plugins: [builtInPlugins],
};

export default function (source, info) {
	if (!/\.svg(\?|$)/.test(info.id)) {
		return;
	}
	const config = info.type === AssetType.Source
		? inlineConfig : resourceConfig;

	return optimize(source.string, config).data
		.replaceAll('"', "'"); // Avoid escapes
}
