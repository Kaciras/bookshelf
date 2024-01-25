import { env } from "node:process";
import { visualizer } from "rollup-plugin-visualizer";
import terser from "@rollup/plugin-terser";
import replace from "@rollup/plugin-replace";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import asset from "./rollup/asset.js";
import htmlEntry from "./rollup/html.js";
import manifest from "./rollup/manifest.js";
import copy from "./rollup/copy.js";
import postcss from "./rollup/postcss.js";
import svg from "./rollup/svg.js";
import template from "./rollup/template.js";
import { packBundle, packSources } from "./rollup/pack.js";

const isProduction = env.NODE_ENV === "production";
const addonZipName = `${env.npm_package_name}-${env.npm_package_version}.zip`;

function minifyJson(source, { path }) {
	if (/\.json$/.test(path)) {
		return JSON.stringify(JSON.parse(source.data));
	}
}

export default {
	// Avoid generate the "facade" entry chunk.
	preserveEntrySignatures: false,

	input: "manifest.json?webext",

	output: {
		generatedCode: "es2015",
		dir: "dist",
		chunkFileNames: "[name].js",
	},
	plugins: [
		replace({
			preventAssignment: true,
			"typeof window": "'object'",
			"import.meta.env.dev": `${!isProduction}`,
		}),
		asset({
			loaders: [
				postcss,
				svg,
				isProduction && minifyJson,
			],
			source: {
				include: ["components/**/*.css", "**/*.svg"],
			},
			url: {
				include: ["**/*.{ico,png,jpg}"],
			},
		}),

		nodeResolve(),
		copy({
			context: "locales",
			from: "**/*",
			to: "_locales",
			toDirectory: true,
		}),
		manifest(),
		htmlEntry(),
		template(),

		isProduction && terser(),
		isProduction && visualizer(),

		env.PACK && packBundle(addonZipName, true),
		env.PACK && packSources(
			`source-${env.npm_package_version}.zip`,
			["/chrome", "/doc"],
		),
	],
};
