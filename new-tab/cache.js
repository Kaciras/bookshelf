import { sha256 } from "@kaciras/utilities/browser";
import defaultFavicon from "../assets/Website.svg?url";
import { settings } from "./storage.js";

export { defaultFavicon };

export const CACHE_ORIGIN = "https://internal-cache/";

/**
 * Save a favicon to CacheStorage and download it is a remote file.
 * return a string key for retrieval.
 *
 * For data size limit, we can not save image sa data url
 * to sync storage.
 *
 * @param rawUrl {string|Response} URL or response of the image.
 * @returns {Promise<null|string>} Key used for load the cached image.
 */
export async function save(rawUrl) {
	if (!rawUrl || rawUrl === defaultFavicon) {
		return null;
	}
	const cache = await caches.open("favicon");
	let url;
	let response;

	// Internal resource is relative URL.
	try {
		new URL(rawUrl);
	} catch {
		return rawUrl;
	}

	if (typeof rawUrl !== "string") {	// Response object.
		url = rawUrl.url;
		response = rawUrl;
	} else { 							// Remote file.
		response = await fetch(rawUrl);
		const data = await response.clone().arrayBuffer();
		const hash = (await sha256(data)).slice(0, 20);
		url = CACHE_ORIGIN + hash;
	}

	return cache.put(url, response).then(() => url);
}

/**
 * Get saved favicon from CacheStorage, if it does not exist:
 * - For internal resource, fallback to default.
 * - For HTTP resource, download and put it to cache.
 *
 * The returned URL is created by `URL.createObjectURL`, you should
 * dispose it with `URL.revokeObjectURL` if no longer used.
 *
 * @param urlKey The return value of save()
 * @returns {Promise<string>} URL of the image.
 */
export async function load(urlKey) {
	if (!urlKey) {
		return defaultFavicon;
	}
	if (!/^https?:/.test(urlKey)) {
		return urlKey;
	}

	const cache = await caches.open("favicon");
	let response = await cache.match(urlKey);
	if (!response) {
		if (urlKey.startsWith(CACHE_ORIGIN)) {
			return defaultFavicon;
		}
		response = await fetch(urlKey, { mode: "no-cors" });
		if (!response.ok) {
			throw new Error("Download failed: " + urlKey);
		}
		await cache.put(urlKey, response.clone());
	}

	return URL.createObjectURL(await response.blob());
}

/**
 * Remove unused images from the cache.
 */
export async function evict() {
	const { shortcuts, engines } = settings;
	const used = new Set();

	shortcuts.forEach(i => used.add(i.iconUrl));
	engines.forEach(i => used.add(i.favicon));

	const cache = await caches.open("favicon");
	const tasks = (await cache.keys())
		.filter(r => !used.has(r.url))
		.map(request => cache.delete(request));

	await Promise.all(tasks);
	console.debug(`Deleted ${tasks.length} expired favicons.`);
}
