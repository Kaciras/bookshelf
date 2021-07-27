const { createFilter } = require("@rollup/pluginutils");

module.exports = function inlinePlugin(options) {
	const { include, exclude } = options;
	const filter = createFilter(include, exclude);

	return {
		name: "inline-source",
		transform(code, id) {
			if (!filter(id)) {
				return;
			}
			code = JSON.stringify(code);
			return `export default ${code};`;
		},
	};
};
