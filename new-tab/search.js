import GoogleIcon from "../assets/google.ico";
import BaiduIcon from "../assets/baidu.svg?resource";
import DuckDuckGoIcon from "../assets/dax-logo.svg?resource";
import { i18n } from "../share/index.js";
import { loadConfig, saveConfig } from "./storage.js";

/**
 * I can't find a way to get suggestions via `browser.search`.
 *
 * https://github.com/dewitt/opensearch
 */
export class OpenSearchEngine {

	name;			// Display name of the search engine.
	favicon;		// 32x32 is the best size.
	searchAPI;		// Search term will append to the end.
	suggestAPI;		// Search term will append to the end, may not exist.

	constructor(name, favicon, searchAPI, suggestAPI) {
		this.name = name;
		this.searchAPI = searchAPI;
		this.favicon = favicon;
		this.suggestAPI = suggestAPI;
	}

	async suggest(searchTerms, signal) {
		searchTerms = encodeURIComponent(searchTerms);
		const url = this.suggestAPI + searchTerms;

		const response = await fetch(url, {
			signal,
			credentials: "omit", // Prevent tracking.
		});

		const { status } = response;
		if (status !== 200) {
			throw new Error("Failed to fetch suggestions: " + status);
		}
		return (await response.json())[1];
	}

	getResultURL(searchTerms) {
		return this.searchAPI + encodeURIComponent(searchTerms);
	}
}

export async function loadSearchEngines() {
	let search = await loadConfig(["defaultIndex", "engines"]);

	/*
 	 * Default search engines, you can find more at:
 	 * https://github.com/chromium/chromium/blob/main/components/search_engines/prepopulated_engines.json
 	 */
	if (!search.engines) {
		search = {
			defaultIndex: 1,
			engines: [
				{
					name: i18n("DuckDuckGo"),
					favicon: DuckDuckGoIcon,
					searchAPI: "https://duckduckgo.com/?t=ffsb&ia=web&q=",
					suggestAPI: "https://ac.duckduckgo.com/ac/?type=list&q=",
				},
				{
					name: "Google",
					favicon: GoogleIcon,
					searchAPI: "https://www.google.com/search?client=firefox-b-d&q=",
					suggestAPI: "https://www.google.com/complete/search?client=firefox&q=",
				},
				{
					name: i18n("Baidu"),
					favicon: BaiduIcon,
					searchAPI: "https://www.baidu.com/baidu?ie=utf-8&wd=",
					suggestAPI: "https://www.baidu.com/su?ie=utf-8&action=opensearch&wd=",
				},
			],
		};
		await saveConfig(search);
	}

	return search;
}
