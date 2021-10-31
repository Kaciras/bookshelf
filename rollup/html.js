import { cwd } from "node:process";
import { dirname, relative, resolve } from "path";
import { existsSync } from "fs";
import { minify } from "html-minifier-terser";
import HtmlParser from "node-html-parser";

/**
 * 构造一个 JS 模块，导入所有 ID 。
 * 没有用 reduce 因为参数是 Iterable，当然写成 [].reduce.call() 也行但不好看。
 *
 * @param ids 要导入的 ID 列表
 * @return {string} JS 代码
 */
export function dummyImportEntry(ids) {
	let code = "";
	for (const id of ids) {
		code += `import "${id}"\n`;
	}
	return code;
}

export const minifyOptions = {
	collapseBooleanAttributes: true,
	collapseWhitespace: true,
	collapseInlineTagWhitespace: true,
	removeComments: true,
	removeAttributeQuotes: true,
};

// 绝对路径和找不到文件的不处理
function check(importer, url) {
	if (url.charCodeAt(0) === 0x2F) {
		return false;
	}
	const file = resolve(dirname(importer), url);
	return existsSync(file);
}

/**
 * 支持 HTML 文件作为 Rollup 的 input，自动提取并处理其中的资源。
 * 所有的 <script> 会被打包为一个文件。
 * 同时还会压缩 HTML，这是必须的处理因为要删除空白内容。
 */
export default function htmlPlugin() {
	const documents = new Map();

	/*
	 * Rollup 的构建分为两个阶段：Build 和 Output Generation。
	 * Build 加载并独立地处理每个模块，该阶段完成后应用已经可用。
	 * Output Generation 打包模块、执行后期优化以及生成文件。
	 *
	 * 开发模式下可能仅执行 Build 过程以避免打包开销，比如 Vite 就是这么做的。
	 * 编写插件时要注意 URL 的处理，确保没有 Output Generation 应用也能运行。
	 */

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

				const el = `<script type="module" src="${chunk.fileName}"></script>`;
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
