import { readFileSync } from "fs";
import { basename } from "path";
import { jsImports } from "./html.js";
import { getRefId } from "./asset.js";
import packageJson from "../package.json" assert { type: "json" };

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
	const resources = [];

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

		// Since we added a mark to the id, we need to load it by ourselves.
		load(id) {
			id = unwrapManifest(id);
			if (!id) {
				return null;
			}
			manifest = JSON.parse(readFileSync(id, "utf8"));
			this.addWatchFile(id);

			manifest.version = packageJson.version;

			const { icons = [] } = manifest;
			const ids = [];

			for (const size of Object.keys(icons)) {
				const value = icons[size] + "?resource";
				ids.push(value);
				resources.push({ host: icons, key: size, value });
			}

			const { newtab } = manifest.chrome_url_overrides;
			if (newtab) {
				this.emitFile({
					type: "chunk",
					id: newtab,
					fileName: "new-tab.js",
					importer: id,
				});
				manifest.chrome_url_overrides.newtab = "new-tab.html";
			}

			return {
				code: jsImports(ids),
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

			if (chunk) {
				for (const { host, key, value } of resources) {
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
