import { readFile } from "fs/promises";
import { dummyImportEntry } from "./html.js";
import { getRefId } from "./asset.js";

export default function createManifestPlugin(filename) {
	let selfId;
	let manifest;
	const files = [];

	return {
		name: "browser-extension-manifest",

		async buildStart() {
			this.emitFile({ type: "chunk", id: filename });
			selfId = (await this.resolve(filename)).id;
		},

		async load(id) {
			if (id !== selfId) {
				return null;
			}
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
			delete bundle["manifest.js"];

			manifest.chrome_url_overrides.newtab = "new-tab.html";

			for (const { host, key, value } of files) {
				const { id } = await this.resolve(value, selfId);
				host[key] = this.getFileName(getRefId(id));
			}

			this.emitFile({
				type: "asset",
				fileName: "manifest.json",
				source: JSON.stringify(manifest),
			});
		},
	};
}
