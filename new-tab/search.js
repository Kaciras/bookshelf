import SearchIconURL from "@tabler/icons/outline/search.svg?url";
import { IconCache } from "./cache.js";
import { fetchChecked } from "../share/index.js";

export const searchIcons = new IconCache(SearchIconURL);

/**
 * I can't find a way to get suggestions via `browser.search`.
 *
 * https://github.com/dewitt/opensearch
 */
export class OpenSearchEngine {

	name;			// Display name of the search engine.
	iconKey;		// Cache key of favicon.
	favicon;		// 32x32 is the best size.
	searchAPI;		// Search term will append to the end.
	suggestAPI;		// Search term will append to the end, may not exist.

	async suggest(searchTerms, signal) {
		searchTerms = encodeURIComponent(searchTerms);
		const url = this.suggestAPI + searchTerms;

		const response = await fetchChecked(url, {
			signal,
			credentials: "omit", // Prevent tracking.
		});
		return (await response.json())[1];
	}

	getResultURL(searchTerms) {
		return this.searchAPI + encodeURIComponent(searchTerms);
	}
}
