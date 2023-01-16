import { env } from "node:process";
import postcss from "postcss";
import nested from "postcss-nested";
import csso from "postcss-csso";
import calc from "postcss-calc";
import vars from "postcss-simple-vars";
import varCompress from "postcss-variable-compress";

// Terser will try to eliminate escapes of strings, we don't need to care about it.

const plugins = [
	vars(),		// Support SCSS-style variables.
	nested(),	// Support nesting.
	calc(),		// Reduce calc() references.
];

if (env.NODE_ENV === "production") {
	plugins.push(csso());			// Compress output.
	plugins.push(varCompress());	// Minimum variable names.
}

const convertor = postcss(plugins);

export default function (source, { path }) {
	if (!/\.css$/.test(path)) {
		return;
	}
	return convertor.process(source.string, { from: path }).css;
}
