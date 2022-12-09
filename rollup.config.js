import { env } from "node:process";
import alias from "@rollup/plugin-alias";
import { visualizer } from "rollup-plugin-visualizer";
import terser from "@rollup/plugin-terser";
import replace from "@rollup/plugin-replace";
import zip from "rollup-plugin-zip";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import webpackConfig from "./alias.idea.cjs";
import nodeBuiltins from "./rollup/builtin.js";
import asset from "./rollup/asset.js";
import htmlEntry from "./rollup/html.js";
import manifest from "./rollup/manifest.js";
import copy from "./rollup/copy.js";
import postcss from "./rollup/postcss.js";
import svg from "./rollup/svg.js";
import template from "./rollup/template.js";

const isProduction = env.NODE_ENV === "production";

function webpackAliasToRollup() {
	const { alias } = webpackConfig.resolve;
	return Object.entries(alias).map(e => ({ find: e[0], replacement: e[1] }));
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
		alias({ entries: webpackAliasToRollup() }),
		replace({
			preventAssignment: true,
			"typeof window": "'object'",
			"import.meta.env.dev": `${!isProduction}`,
		}),
		asset({
			loaders: [postcss, svg],
			source: { include: ["components/**/*.css", "**/*.svg"] },
			url: { include: ["**/*.{ico,png,jpg}"] },
		}),
		nodeBuiltins,
		nodeResolve(),
		copy([
			{
				from: "global.css",
				context: "new-tab",
			},
			{
				from: "**/*",
				context: "locales",
				to: "_locales",
				toDirectory: true,
			},
		]),
		manifest(),
		htmlEntry(),
		template(),

		isProduction && terser(),
		isProduction && zip(),
		isProduction && visualizer(),
	],
};
