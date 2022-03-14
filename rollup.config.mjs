import { env } from "node:process";
import alias from "@rollup/plugin-alias";
import { visualizer } from "rollup-plugin-visualizer";
import { terser } from "rollup-plugin-terser";
import replace from '@rollup/plugin-replace';
import { nodeResolve } from '@rollup/plugin-node-resolve';
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
	// 以 WebApp 为目标推荐设为 false，避免生成 facade 模块。
	preserveEntrySignatures: false,

	output: {
		format: "esm",
		dir: "dist",
		chunkFileNames: "[name].js",

		// 新选项能提升输出代码的性能，但我没怎么感觉到。
		generatedCode: "es2015",
	},
	plugins: [
		alias({ entries: webpackAliasToRollup() }),
		replace({
			"import.meta.env.dev": `${!isProduction}`,
			window: "1",
			preventAssignment: true,
		}),
		asset({
			loaders: [postcss, svg],
			source: { include: ["components/**/*.css", "**/*.svg"] },
			url: { include: ["**/*.ico"] },
		}),
		nodeBuiltins,
		nodeResolve(),
		copy([
			{ from: "new-tab/global.css" },
			{
				from: "browser-polyfill.min.js",
				to: "browser-polyfill.js",
				context: "node_modules/webextension-polyfill/dist",
			},
		]),
		manifest("manifest.json"),
		htmlEntry(),
		template(),
		isProduction && terser(),
		isProduction && visualizer(),
	],
};
