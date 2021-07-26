const { readFileSync } = require("fs");
const htmlPlugin = require("@rollup/plugin-html");
const urlPlugin = require("@rollup/plugin-url");
const postcss = require("postcss");
const csso = require("postcss-csso");
const { minify } = require("html-minifier-terser");
const { optimize, extendDefaultPlugins } = require("svgo");
const copyPlugin = require("rollup-plugin-copy");
const { createFilter } = require("@rollup/pluginutils");
const { terser: terserPlugin } = require("rollup-plugin-terser");

const PostCSS = postcss([csso()]);

const filter = createFilter("components/**/*.css");

const CSSPlugin = {
	name: "css",
	async transform(code, id) {
		if (!filter(id)) {
			return;
		}
		this.addWatchFile(id);
		const { css } = await PostCSS.process(code);
		return `export default ${JSON.stringify(css)};`;
	},
};

const SvgoPlugins = extendDefaultPlugins([
	{ name: "removeViewBox", active: false },
]);

const SVGPlugin = {
	name: "svg-inline-optimize",
	transform(code, id) {
		if (!id.endsWith(".svg")) {
			return;
		}
		code = optimize(code, SvgoPlugins).data;
		code = code.replaceAll('"', "'");
		code = JSON.stringify(code);
		return `export default ${code};`;
	},
};

function generateHtml({ attributes, files, meta, publicPath }) {
	const { js = [], css = [] } = files;

	const replacements = {
		scripts: js.map(file => {
			const attrs = htmlPlugin.makeHtmlAttributes(attributes.script);
			return `<script src="${publicPath}${file.fileName}" ${attrs}></script>`;
		}),
		links: css.map(file => {
			const attrs = htmlPlugin.makeHtmlAttributes(attributes.link);
			return `<link href="${publicPath}${file.fileName}" rel="stylesheet" ${attrs}>`;
		}),
		metas: meta.map(input => `<meta${htmlPlugin.makeHtmlAttributes(input)}>`),
	};

	let content = readFileSync("new-tab/index.html", "utf8");
	content = content.replaceAll(/\${([a-z]+)}/g, (_, v) => replacements[v]);

	return minify(content, {
		removeComments: true,
		collapseWhitespace: true,
		collapseBooleanAttributes: true,
		removeAttributeQuotes: true,
	});
}

module.exports = {
	input: "new-tab/index.js",
	output: {
		file: "dist/index.js",
		format: "esm",
	},
	plugins: [
		terserPlugin(),
		SVGPlugin,
		CSSPlugin,
		urlPlugin({
			include: ["**/*.ico"],
			limit: 4096,
		}),
		htmlPlugin({
			attributes: { script: { defer: "defer" } },
			template: generateHtml,
		}),
		copyPlugin({
			targets: [
				{ src: "new-tab/index.css", dest: "dist" },
				{ src: "manifest.json", dest: "dist" },
				{ src: "node_modules/webextension-polyfill/dist/browser-polyfill.min.js", dest: "dist" },
			],
		}),
	],
};
