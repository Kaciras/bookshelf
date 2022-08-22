import GoogleIcon from "@assets/google.ico";
import BaiduIcon from "@assets/baidu.ico";
import DuckDuckGoIcon from "@assets/dax-logo.svg?url";
import { i18n } from "@share";

// 目前没找到怎么获取浏览器里的搜索引擎配置，只能自己再写一遍了。

class OpenSearchEngine {

	name;			// 搜索引擎的名字
	favicon;		// 搜索引擎的图标，最好是 32x32 大小。
	suggestAPI;		// 查询建议的 API，搜索内容将附加在末尾。
	searchAPI;		// 搜索页面的 URL，搜索内容将附加在末尾。

	constructor(name, favicon, suggestAPI, searchAPI) {
		this.name = name;
		this.favicon = favicon;
		this.suggestAPI = suggestAPI;
		this.searchAPI = searchAPI;
	}

	// 【关于转义】
	// 大多数地方会把空格改成 +，但实测空格也能显示正确的结果。

	async suggest(searchTerms, signal) {
		searchTerms = encodeURIComponent(searchTerms);
		const url = this.suggestAPI + searchTerms;

		// 禁止发送 Cookies 避免跟踪
		const response = await fetch(url, {
			signal,
			credentials: "omit",
		});

		const { status } = response;
		if (status !== 200) {
			throw new Error("Failed to fetch suggestion: " + status);
		}
		return (await response.json())[1];
	}

	getResultURL(searchTerms) {
		return this.searchAPI + encodeURIComponent(searchTerms);
	}
}

export const Google = new OpenSearchEngine(
	"Google",
	GoogleIcon,
	"https://www.google.com/complete/search?client=firefox&q=",
	"https://www.google.com/search?client=firefox-b-d&q=",
);

export const DuckDuckGo = new OpenSearchEngine(
	i18n("DuckDuckGo"),
	DuckDuckGoIcon,
	"https://ac.duckduckgo.com/ac/?type=list&q=",
	"https://duckduckgo.com/?t=ffsb&ia=web&q=",
);

export const Baidu = new OpenSearchEngine(
	i18n("Baidu"),
	BaiduIcon,
	"https://www.baidu.com/su?tn=monline_7_dg&ie=utf-8&action=opensearch&wd=",
	"https://www.baidu.com/baidu?tn=monline_7_dg&ie=utf-8&wd=",
);
