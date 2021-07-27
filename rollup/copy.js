const { readFileSync } = require("fs");

module.exports = function copyPlugin(list) {
	const processedChunks = new Map();

	return {
		name: "copy",
		buildStart(context) {
			this.emitFile({
				type: "chunk",
				fileName: "test.css",
				id: "new-tab/index.css?copy",
			});
		},
		async resolveId(source, importer) {
			if (source.endsWith("?copy")) {
				source = source.slice(0, -"?copy".length);
				const resolution = await this.resolve(source, undefined, { skipSelf: true });
				if (!resolution) return null;
				return `${resolution.id}?copy`;
			}
			return null;
		},
		load(id) {
			if (id.endsWith("?copy")) {
				const importee = id.slice(0, -"?copy".length);
				return readFileSync(importee, "utf8");
			}
			return null;
		},
		transform(code, id) {
			if (id.endsWith("?copy")) {
				processedChunks.set(id, code);
				return "export default undefined";
			}
			return code;
		},
		async renderChunk(code, chunk, opts) {
			const ids = Object.keys(chunk.modules);
			for (const id of ids) {
				if (id.endsWith("?copy")) {
					return processedChunks.get(id);
				}
			}
			return null;
		},
	};
};
