import { sha256 } from "@kaciras/utilities/browser";
import { appConfig } from "./storage.js";

/*
 * Due to browser data size limit, we can not save images to synchronized storage.
 *
 * Firefox's new tab page also has this problem.
 *
 * If the website changed its favicon, and the shortcut to the site is
 * synchronized to the new device, the displayed icon will be different.
 *
 * Also, search engine will lose its custom icon when syncing.
 */

export const CACHE_ORIGIN = "https://cache/";

/**
 * Save the icon to CacheStorage and download it if it is a remote file.
 * return a string key for retrieval.
 *
 * For data size limit, we can not save image sa data url
 * to sync storage.
 *
 * 4 kind of urls:
 * 1) null to indicate default value.
 * 2) Internal resource, is a path.
 * 3) Remote file.
 * 4) Temporary (DataURL, ObjectURL).
 *
 * @param rawUrl {string} URL or response of the image.
 * @returns {Promise<null|string>} Key used for load the cached image.
 */
export async function save(rawUrl, fallback) {
	if (rawUrl === fallback) {
		return null;
	}

	// Internal resource is relative URL.
	try {
		new URL(rawUrl);
	} catch {
		return rawUrl;
	}

	const cache = await caches.open("icon");
	let url;
	let response;

	if (/^https?:/.test(rawUrl)) {		// Remote file.
		url = rawUrl;
		response = await fetch(rawUrl, { mode: "no-cors" });
	} else { 							// Temporary
		response = await fetch(rawUrl);
		const data = await response.clone().arrayBuffer();
		const hash = (await sha256(data)).slice(0, 20);
		url = CACHE_ORIGIN + hash;
	}

	return cache.put(url, response).then(() => url);
}

/**
 * Get saved icon from CacheStorage, if it does not exist:
 * - For internal resource, fallback to default.
 * - For HTTP resource, download and put it to cache.
 *
 * The returned URL is created by `URL.createObjectURL`, you should
 * dispose it with `URL.revokeObjectURL` if no longer used.
 *
 * @param urlKey The return value of save()
 * @returns {Promise<string>} URL of the image.
 */
export async function load(urlKey, fallback) {
	if (!urlKey) {
		return fallback;
	}
	if (!/^https?:/.test(urlKey)) {
		return urlKey;
	}

	const cache = await caches.open("icon");
	let response = await cache.match(urlKey);
	if (!response) {
		if (urlKey.startsWith(CACHE_ORIGIN)) {
			return fallback;
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
 * Remove unused entries from the cache storage.
 *
 * An icon may be referenced by multiple entities, so we should
 * check all references when removing any cached item.
 */
export async function evict() {
	const { shortcuts, engines } = appConfig;
	const used = new Set();

	shortcuts.forEach(i => used.add(i.iconKey));
	engines.forEach(i => used.add(i.iconKey));

	const cache = await caches.open("icon");
	const tasks = (await cache.keys())
		.filter(r => !used.has(r.url))
		.map(request => cache.delete(request));

	await Promise.all(tasks);
	console.debug(`Evict ${tasks.length} icons.`);
}
