const { existsSync } = require("fs");
const { minify } = require("html-minifier-terser");
const { parse } = require("node-html-parser");

/**
 * 构造一个 JS 模块，导入所有 ID 。
 * 该模块还会导出一个 null 用于避免空模块警告。
 *
 * @param ids 要导入的 ID 列表
 * @return {string} JS 代码
 */
function chunkImport(ids) {
	let code = "";
	for (const id of ids) {
		code += `import "${id}"\n`;
	}
	return code + "export default null";
}

const htmlMinifyOptions = {
	collapseWhitespace: true,
	collapseBooleanAttributes: true,
	removeComments: true,
	removeAttributeQuotes: true,
};

module.exports = function htmlPlugin(options) {
	const { isMinify } = options;
	const processedHtml = new Map();

	return {
		name: "html",
		transform(code, id) {
			if (!id.endsWith(".html")) {
				return;
			}
			const document = parse(code);
			const imports = [];

			const scripts = document.querySelectorAll("script");
			for (const script of scripts) {
				const src = script.getAttribute("src");
				if (src.charCodeAt(0) === 0x2F) {
					continue;
				}
				if (existsSync(src)) {
					script.remove();
					imports.push(src);
				}
			}

			const links = document.querySelectorAll("link");
			for (const link of links) {
				const src = link.getAttribute("href");
				if (src.charCodeAt(0) === 0x2F) {
					continue;
				}
				if (existsSync(src)) {
					link.remove();
					imports.push(src);
				}
			}

			processedHtml.set(id, code);
			return chunkImport(imports);
		},

		async generateBundle(_, bundle) {
			for (const [id, html] of processedHtml) {
				const chunk = Object.values(bundle).find(
					(chunk) =>
						chunk.type === "chunk" &&
						chunk.isEntry &&
						chunk.facadeModuleId === id,
				);

				if (chunk) {
					// TODO
				}

				let source = html;
				if (isMinify) {
					source = minify(html, htmlMinifyOptions);
				}
				this.emitFile({ type: "asset", fileName: id, source });
			}
		},
	};
};

module.exports.chunkImport = chunkImport;
