import { basename } from "path";
import { readFile } from "fs/promises";
import { dummyImportEntry } from "./html.js";
import { getRefId } from "./asset.js";

const mark = "?webext";

function unwrapManifest(id) {
	return id.endsWith(mark) ? id.slice(0, -mark.length) : null;
}

/**
 * Add a web extension manifest to build, and resolves chunks from.
 *
 * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json
 */
export default function createManifestPlugin() {
	let selfId;
	let manifest;
	const files = [];

	return {
		name: "webext-manifest",

		/**
		 * Manifest are handled differently from normal SON,
		 * so we append "?manifest" to it's ID to distinguish them.
		 *
		 * <h2>Other format</h2>
		 * One solution is prefix，for example "manifest:../some/file.json"
		 * It friendly with TS, but confused with the absolute path on Windows.
		 */
		async resolveId(source) {
			const file = unwrapManifest(source);
			if (!file) {
				return null;
			}
			const resolved = this.resolve(file, undefined, { skipSelf: true });
			return selfId = (await resolved).id + mark;
		},

		async load(id) {
			id = unwrapManifest(id);
			if (!id) {
				return null;
			}
			manifest = JSON.parse(await readFile(id, "utf8"));
			this.addWatchFile(id);

			const { icons = [] } = manifest;
			const ids = [];

			for (const size of Object.keys(icons)) {
				const value = icons[size] + "?resource";
				ids.push(value);
				files.push({ host: icons, key: size, value });
			}

			const { newtab } = manifest.chrome_url_overrides;
			if (newtab) {
				this.emitFile({
					type: "chunk",
					id: newtab,
					fileName: "new-tab.js",
					importer: id,
				});
			}

			return {
				code: dummyImportEntry(ids),
				moduleSideEffects: "no-treeshake",
			};
		},

		async generateBundle(_, bundle) {
			const chunk = Object.values(bundle).find(chunk =>
				chunk.type === "chunk" &&
				chunk.isEntry &&
				chunk.facadeModuleId === selfId,
			);

			if (chunk) {
				manifest.chrome_url_overrides.newtab = "new-tab.html";

				for (const { host, key, value } of files) {
					const { id } = await this.resolve(value, selfId);
					host[key] = this.getFileName(getRefId(id));
				}

				delete bundle[chunk.fileName];
				this.emitFile({
					type: "asset",
					source: JSON.stringify(manifest),
					fileName: basename(selfId.slice(0, -mark.length)),
				});
			}
		},
	};
}
