import { join } from "path";
import { readdirSync, readFileSync, statSync } from "fs";
import ignore from "ignore";
import AdmZip from "adm-zip";

/**
 * Rollup plugin to zip up emitted files, result is putted in output dir.
 *
 * @param output Name to the output zip file.
 * @param clean Remove zipped files from bundle, default false.
 */
export function packBundle(output, clean = false) {
	return {
		name: "pack-bundle",
		async generateBundle(_, bundle) {
			const zip = new AdmZip();
			for (const [k, v] of Object.entries(bundle)) {
				if (clean) {
					delete bundle[k];
				}
				const name = v.fileName.replaceAll("\\", "/");
				zip.addFile(name, v.code ?? v.source);
			}
			this.emitFile({
				type: "asset",
				fileName: output,
				source: await zip.toBufferPromise(),
			});
		},
	};
}

/**
 * Zip source files, browser addon store need it for publish public extension.
 * Source files are read from disk, rollup output and git related files are auto-ignored.
 *
 * @param output Name to the output zip file.
 * @param excludes Additional files to exclude, support gitignore pattern.
 */
export function packSources(output, excludes = []) {
	const ignored = ignore();
	ignored.add(".git");
	ignored.add(".gitignore");
	ignored.add(readFileSync(".gitignore", "utf8"));
	ignored.add(excludes);
	const filter = ignored.createFilter();

	return {
		name: "pack-local-files",
		writeBundle(options) {
			output = join(options.dir, output);
			ignored.add("/" + options.dir);

			const zip = new AdmZip();
			for (const file of readdirSync(".")) {
				const s = statSync(file);
				if (s.isFile() && filter(file)) {
					zip.addLocalFile(file);
				} else if (filter(file + "/")) {
					zip.addLocalFolder(file, file);
				}
			}
			return zip.writeZipPromise(output);
		},
	};
}
