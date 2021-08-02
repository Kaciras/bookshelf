const postcss = require("postcss");
const vars = require("postcss-simple-vars");
const csso = require("postcss-csso");

const variables = {
	"panel-radius": "8px",
};

const cssLangRE = /\.(css|less|sass|scss|styl|pcss)($|\?)/;

const convertor = postcss([csso(), vars({ variables })]);

module.exports = function (source, id) {
	if (!cssLangRE.test(id)) {
		return;
	}
	return convertor.process(source.string).css;
};
