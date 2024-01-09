import { optimize } from "svgo";
import { responsiveSVGAttrs } from "vite-plugin-svg-sfc";
import { AssetType } from "./asset.js";

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
	responsiveSVGAttrs,
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
		.replaceAll('"', "'"); // Avoid escapes.
}
