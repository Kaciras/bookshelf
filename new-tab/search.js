import SearchIconURL from "@tabler/icons/search.svg?url";
import { IconCache } from "./cache.js";

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

	constructor({ name, iconKey, searchAPI, suggestAPI }) {
		this.name = name;
		this.iconKey = iconKey;
		this.searchAPI = searchAPI;
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
