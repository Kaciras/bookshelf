import { optimize } from "svgo";
import { modifySVGAttrs, responsiveSVGAttrs } from "vite-plugin-svg-sfc";
import { AssetType } from "./asset.js";

const inlinePlugins = [
	responsiveSVGAttrs,
	"preset-default",
	modifySVGAttrs(attrs => {
		delete attrs.class;
		delete attrs.xmlns;
		delete attrs.version;
		delete attrs["xml:space"];
	}),
];

const resourcePlugins = [
	"preset-default",
];

export default function (source, { type, path }) {
	if (!/\.svg$/.test(path)) {
		return;
	}
	const plugins = type === AssetType.Source
		? inlinePlugins : resourcePlugins;

	return optimize(source.string, { plugins, path })
		.data
		.replaceAll("\"", "'"); // Avoid escapes.
}
