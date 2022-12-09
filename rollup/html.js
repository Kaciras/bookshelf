import { cwd } from "node:process";
import { dirname, relative, resolve } from "path";
import { existsSync } from "fs";
import { minify } from "html-minifier-terser";
import HtmlParser from "node-html-parser";

/**
 * Create a JavaScript code contains imports of IDs;
 *
 * @param ids {Iterable<string>} ID list to import.
 * @return {string} JavaScript code.
 */
export function jsImports(ids) {
	let code = "";
	for (const id of ids)
		code += `import "${id}"\n`;
	return code;
}

export const minifyOptions = {
	collapseBooleanAttributes: true,
	collapseWhitespace: true,
	collapseInlineTagWhitespace: true,
	removeComments: true,
	removeAttributeQuotes: true,
};

// Only process existing files with relative paths.
function check(importer, url) {
	return url.charCodeAt(0) !== 0x2F && existsSync(resolve(dirname(importer), url));
}

/**
 * 支持 HTML 文件作为 Rollup 的 input，自动提取并处理其中的资源。
 * 所有的 <script> 会被打包为一个文件。
 * 同时还会压缩 HTML，这是必须的处理因为要删除空白内容。
 */
export default function htmlPlugin() {
	const documents = new Map();

	return {
		name: "html-entry",

		transform(code, id) {
			if (!id.endsWith(".html")) {
				return;
			}
			const document = HtmlParser.parse(code);
			const imports = [];

			const scripts = document.querySelectorAll("script");
			for (const script of scripts) {
				const src = script.getAttribute("src");
				if (check(id, src)) {
					script.remove();
					imports.push(src);
				}
			}

			const links = document.querySelectorAll("link");
			for (const link of links) {
				const href = link.getAttribute("href");
				if (check(id, href)) {
					imports.push(href + "?resource");
				}
			}

			documents.set(id, document);
			return dummyImportEntry(imports);
		},

		async generateBundle(_, bundle) {
			for (const [id, document] of documents) {

				// chunk 可能不存在吗？
				const chunk = Object.values(bundle).find(
					(chunk) =>
						chunk.type === "chunk" &&
						chunk.isEntry &&
						chunk.facadeModuleId === id,
				);

				const el = `<script type='module' src='${chunk.fileName}'></script>`;
				const head = document.querySelector("head");
				head.insertAdjacentHTML("beforeend", el);

				const fileName = chunk.name
					? chunk.name + ".html"
					: relative(cwd(), id);

				this.emitFile({
					type: "asset",
					fileName,
					source: await minify(document.toString(), minifyOptions),
				});
			}
		},
	};
}
