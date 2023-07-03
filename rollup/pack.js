import { env } from "process";
import { readdirSync, readFileSync, statSync } from "fs";
import ignore from "ignore";
import AdmZip from "adm-zip";

export function packBundle(clean = false) {
	return {
		name: "pack-bundle",
		async generateBundle(_, bundle) {
			const zip = new AdmZip();
			for (const [k, v] of Object.entries(bundle)) {
				if (clean) {
					delete bundle[k];
				}
				zip.addFile(k, v.code ?? v.source);
			}
			this.emitFile({
				type: "asset",
				fileName: env.npm_package_name ?? "dist.zip",
				source: await zip.toBufferPromise(),
			});
		},
	};
}

export function packSources(output, files) {
	const excludes = ignore();
	excludes.add(".git");
	excludes.add(readFileSync(".gitignore", "utf8"));
	excludes.add(files);
	const filter = excludes.createFilter();

	return {
		name: "pack-local-files",
		closeBundle() {
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
