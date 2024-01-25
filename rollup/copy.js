import { join, relative } from "path";
import glob from "fast-glob";
import { jsImports } from "./html.js";

const VID = "COPY_IMPORTER";

/**
 * Copy files and folders, with glob support. This plugin needs to be used with
 * the asset plugin.
 *
 * Compare with rollup-plugin-copy.
 * 1）This plugin add imports for files, let the asset plugin process them.
 * 2）This plugin add files to watch.
 */
export default function copyPlugin(...patterns) {
	const ids = new Set();

	return {
		name: "copy",

		/**
		 * Find files to copy and add them to the ID set.
		 *
		 * The "resource" parameter will be added to the ID of all files
		 * so that they can be processed by the asset plugin。
		 */
		async buildStart() {
			const groups = await Promise.all(patterns.map(entry => {
				const { from, context } = entry;
				return glob(context ? `${context}/${from}` : from);
			}));

			for (let i = 0; i < patterns.length; i++) {
				const { to, context, toDirectory } = patterns[i];
				const files = groups[i];

				for (const file of files) {
					let fileName = relative(context, file);
					if (toDirectory) {
						fileName = join(to, fileName);
					} else if (to) {
						fileName = to;
					}
					fileName = encodeURIComponent(fileName);
					ids.add(file + "?resource&filename=" + fileName);
				}
			}

			this.emitFile({ type: "chunk", fileName: VID, id: VID });
		},

		/**
		 * Skip resolving of our virtual chunk, and resolve copied
		 * file without importer.
		 */
		resolveId(source, importer) {
			if (source === VID) {
				return VID;
			}
			if (importer !== VID) {
				return null;
			}
			return this.resolve(source, undefined);
		},

		/**
		 * The virtual chunk contains only imports of each file.
		 * Also disabling tree-shake to avoid empty chunk warning.
		 */
		load(id) {
			if (id !== VID) {
				return null;
			}
			return {
				code: jsImports(ids),
				moduleSideEffects: "no-treeshake",
			};
		},

		/**
		 * The virtual chunk should not be included in the output.
		 */
		generateBundle: (_, bundle) => delete bundle[VID],
	};
}
