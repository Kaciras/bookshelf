module.exports = {
	root: true,
	extends: ["@kaciras/core"],
	env: {
		browser: true,
		webextensions: true,
	},
	overrides: [{
		files: "rollup/**/*",
		env: {
			browser: false,
			node: true,
			webextensions: false,
		},
	}],
};
