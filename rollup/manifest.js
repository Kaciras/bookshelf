import { readFile } from "fs/promises";
import { dummyImportEntry } from "./html.js";
import { getRefId } from "./asset.js";

export default function createManifestPlugin() {
	let selfId;
	let manifest;
	const files = [];

	return {
		name: "browser-extension-manifest",

		async load(id) {
			if (!id.endsWith("manifest.json")) {
				return null;
			}
			selfId = id;
			manifest = JSON.parse(await readFile(id, "utf8"));
			const ids = [];

			for (const size of Object.keys(manifest.icons)) {
				const aid = manifest.icons[size] + "?resource";
				ids.push(aid);
				files.push({
					host: manifest.icons,
					key: size,
					value: aid,
				});
			}

			const html = manifest.chrome_url_overrides.newtab;
			this.emitFile({
				type: "chunk",
				id: html,
				importer: id,
				name: "new-tab",
			});

			return {
				code: dummyImportEntry(ids),
				moduleSideEffects: "no-treeshake",
			};
		},

		async generateBundle(_, bundle) {
			const chunk = Object.values(bundle).find(
				(chunk) =>
					chunk.type === "chunk" &&
					chunk.isEntry &&
					chunk.facadeModuleId === selfId,
			);
			manifest.chrome_url_overrides.newtab = "new-tab.html";

			for (const e of files) {
				const { id } = await this.resolve(e.value, selfId);
				e.host[e.key] = this.getFileName(getRefId(id));
			}

			delete bundle["manifest.js"];
			this.emitFile({
				type: "asset",
				fileName: "manifest.json",
				source: JSON.stringify(manifest),
			});
		},
	};
}
