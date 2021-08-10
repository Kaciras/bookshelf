module.exports = function importMetaPlugin(table) {

	// 复制一份，保证不变性
	const map = new Map(Object.entries(table));

	return {
		name: "define-import-meta",

		resolveImportMeta(property) {
			if (!map.has(property)) {
				return null;
			}
			const value = map.get(property);
			return JSON.stringify(value);
		},
	};
};
