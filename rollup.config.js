import html from "@rollup/plugin-html";
import url from "@rollup/plugin-url";

export default {
	input: "addon/new-tab/index.js",
	output: {
		file: "dist/new-tab.js",
		format: "esm",
	},
	plugins: [
		url({
			include: ["**/*.ico"],
			limit: 4096,
		}),
		{
			name: "svg-inline-optimize",
			transform(code, id) {
				if (!id.endsWith(".svg")) {
					return;
				}
				code = code.replaceAll('"', "'");
				code = JSON.stringify(code);
				return `export default ${code};`;
			},
		},
		html({
			attributes: { script: { defer: "defer" } },
			template: () => "addon/new-tab/index.html",
		}),
	],
};
