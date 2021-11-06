import { readFile } from "fs/promises";
import { dummyImportEntry } from "./html.js";
import { getRefId } from "./asset.js";

/**
 * 浏览器扩展的清单插件，将清单文件作为构建的入口点，处理其中的资源，并生成 manifest.json。
 *
 * @param filename 清单文件名
 * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json
 */
export default function createManifestPlugin(filename) {
	let selfId;
	let manifest;
	const files = [];

	return {
		name: "browser-extension-manifest",

		async buildStart() {
			const marked = filename + "?manifest";
			this.emitFile({
				type: "chunk",
				id: marked,
				fileName: "manifest.json",
			});
			selfId = (await this.resolve(marked)).id;
		},

		/**
		 * 因为清单的加载方式跟普通的 JSON 不同，所以要做个标记来区分。
		 *
		 * <h2>标记的格式</h2>
		 * 另一种方案是跟 Squoosh 一样写在前面，比如 manifest:../some/file.js?foo=bar
		 * 这种写法对 TS 很友好，并且更规整，但分隔符用冒号会跟 Windows 的盘符混淆。
		 */
		async resolveId(source) {
			if (!source.endsWith("?manifest")) {
				return null;
			}
			const file = source.slice(0, source.length - "?manifest".length);
			const resolved = this.resolve(file, undefined, { skipSelf: true });
			return (await resolved).id + "?manifest";
		},

		async load(id) {
			if (!id.endsWith("?manifest")) {
				return null;
			}
			id = id.slice(0, id.length - "?manifest".length);
			manifest = JSON.parse(await readFile(id, "utf8"));

			const { icons = [] } = manifest;
			const ids = [];

			for (const size of Object.keys(icons)) {
				const aid = icons[size] + "?resource";
				ids.push(aid);
				files.push({ host: icons, key: size, value: aid });
			}

			const { newtab } = manifest.chrome_url_overrides;
			if (newtab) {
				this.emitFile({
					type: "chunk",
					fileName: "new-tab.js",
					importer: id,
					id: newtab,
					name: "new-tab",
				});
			}

			return {
				code: dummyImportEntry(ids),
				moduleSideEffects: "no-treeshake",
			};
		},

		async generateBundle(_, bundle) {
			manifest.chrome_url_overrides.newtab = "new-tab.html";

			for (const { host, key, value } of files) {
				const { id } = await this.resolve(value, selfId);
				host[key] = this.getFileName(getRefId(id));
			}

			bundle["manifest.json"].code = JSON.stringify(manifest);
		},
	};
}
