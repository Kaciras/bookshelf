import { join } from "path";
import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import ignore from "ignore";
import AdmZip from "adm-zip";
import { dataSizeIEC } from "@kaciras/utilities/node";

/**
 * Rollup plugin to zip up emitted files, result is putted in output dir.
 *
 * @param fileName Name to the output zip file.
 * @param clean Remove zipped files from bundle, default false.
 */
export function packBundle(fileName, clean = false) {
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

			const source = await zip.toBufferPromise();
			this.emitFile({ type: "asset", fileName, source });

			const size = dataSizeIEC.formatDiv(source.length);
			this.info(`Pack the bundle into ${fileName} (${size})`);
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
		async writeBundle(options) {
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

			const buffer = await zip.toBufferPromise();
			writeFileSync(join(options.dir, output), buffer);

			const size = dataSizeIEC.formatDiv(buffer.length);
			this.info(`Pack source into ${output} (${size})`);
		},
	};
}
