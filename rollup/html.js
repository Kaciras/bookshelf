const { resolve, dirname, basename } = require("path");
const { existsSync } = require("fs");
const { minify } = require("html-minifier-terser");
const { parse } = require("node-html-parser");

/**
 * 构造一个 JS 模块，导入所有 ID 。
 * 没有用 reduce 因为参数是 Iterable，当然写成 [].reduce.call() 也行但不好看。
 *
 * @param ids 要导入的 ID 列表
 * @return {string} JS 代码
 */
function chunkImport(ids) {
	let code = "";
	for (const id of ids) {
		code += `import "${id}"\n`;
	}
	return code;
}

const minifyOptions = {
	collapseBooleanAttributes: true,
	collapseWhitespace: true,
	collapseInlineTagWhitespace: true,
	removeComments: true,
	removeAttributeQuotes: true,
};

/**
 * 支持 HTML 文件作为 Rollup 的 input，自动提取并处理其中的资源。
 */
module.exports = function htmlPlugin() {
	const documents = new Map();

	return {
		name: "html-entry",
		transform(code, id) {
			if (!id.endsWith(".html")) {
				return;
			}
			const document = parse(code);
			const imports = [];

			// 绝对路径和找不到文件的不处理
			function check(url) {
				if (url.charCodeAt(0) === 0x2F) {
					return false;
				}
				const file = resolve(dirname(id), url);
				return existsSync(file);
			}

			const scripts = document.querySelectorAll("script");
			for (const script of scripts) {
				const src = script.getAttribute("src");
				if (check(src)) {
					script.remove();
					imports.push(src);
				}
			}

			const links = document.querySelectorAll("link");
			for (const link of links) {
				const href = link.getAttribute("href");
				if (check(href)) {
					imports.push(href);
				}
			}

			documents.set(id, document);
			return chunkImport(imports);
		},

		async generateBundle(_, bundle) {
			for (const [id, document] of documents) {
				const head = document.querySelector("head");

				const chunk = Object.values(bundle).find(
					(chunk) =>
						chunk.type === "chunk" &&
						chunk.isEntry &&
						chunk.facadeModuleId === id,
				);
				if (chunk) {
					const el = `<script type="module" src="${chunk.fileName}"></script>`;
					head.insertAdjacentHTML("beforeend", el);
				}

				let source = document.toString();
				source = minify(source, minifyOptions);
				this.emitFile({ type: "asset", fileName: basename(id), source });
			}
		},
	};
};

module.exports.chunkImport = chunkImport;
module.exports.minifyOptions = minifyOptions;
