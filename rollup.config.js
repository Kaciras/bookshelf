const { readFileSync } = require("fs");
const html = require("@rollup/plugin-html");
const alias = require("@rollup/plugin-alias");
const { minify } = require("html-minifier-terser");
const { terser } = require("rollup-plugin-terser");
const webpackConfig = require("./alias.idea");
const copy = require("./rollup/copy");
const postcss = require("./rollup/postcss");
const svg = require("./rollup/svg");
const asset = require("./rollup/asset");
const template = require("./rollup/template");

const isProduction = process.env.NODE_ENV === "production";

function generateHtml({ attributes, files, meta, publicPath }) {
	const { js = [], css = [] } = files;

	const replacements = {
		scripts: js.map(file => {
			const attrs = html.makeHtmlAttributes(attributes.script);
			return `<script src="${publicPath}${file.fileName}" ${attrs}></script>`;
		}),
		links: css.map(file => {
			const attrs = html.makeHtmlAttributes(attributes.link);
			return `<link href="${publicPath}${file.fileName}" rel="stylesheet" ${attrs}>`;
		}),
		metas: meta.map(input => `<meta${html.makeHtmlAttributes(input)}>`),
	};

	let content = readFileSync("new-tab/index.html", "utf8");
	content = content.replaceAll(/\${([a-z]+)}/g, (_, v) => replacements[v]);

	return !isProduction ? content : minify(content, {
		removeComments: true,
		collapseWhitespace: true,
		collapseBooleanAttributes: true,
		removeAttributeQuotes: true,
	});
}

module.exports = {
	input: "new-tab/index.js",
	output: {
		format: "esm",
		dir: "dist",
	},
	plugins: [
		alias({
			entries: Object.entries(webpackConfig.resolve.alias)
				.map(e => ({ find: e[0], replacement: e[1] })),
		}),
		asset({
			loaders: [
				postcss, svg,
			],
			source: { include: ["**/*.css", "**/*.svg"] },
			url: { include: ["**/*.ico"] },
			resource: { include: "_$" },
		}),
		html({
			attributes: { script: { defer: "defer" } },
			template: generateHtml,
		}),
		copy([
			{ from: "new-tab/*.css" },
			{ from: "manifest.json" },
			{
				from: "browser-polyfill.min.js",
				to: "browser-polyfill.js",
				context: "node_modules/webextension-polyfill/dist",
			},
		]),
		template(),
		isProduction && terser(),
	],
};
