import { sha256 } from "@kaciras/utilities/browser";
import { appConfig } from "./storage.js";
import { fetchChecked } from "../share/index.js";

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
 * Cache for remote resources.
 *
 * 4 kind of urls:
 * 1) `null` to indicate default value.
 * 2) Internal resource, is a path.
 * 3) Remote file.
 * 4) Temporary (DataURL, ObjectURL).
 */
export class IconCache {

	constructor(defaultValue) {
		this.defaultValue = defaultValue;
	}

	/**
	 * Save the icon to CacheStorage, download it if it is a remote file.
	 * Cache key is set to property `model.iconKey`.
	 */
	async save(model, rawUrl = model.favicon) {
		if (rawUrl === this.defaultValue) {
			return model.iconKey = null;
		}

		// Internal resource is relative URL.
		try {
			new URL(rawUrl);
		} catch {
			return model.iconKey = rawUrl;
		}

		const cache = await caches.open("icon");
		let iconKey;
		let response;

		if (/^https?:/.test(rawUrl)) {		// Remote file.
			iconKey = rawUrl;
			response = await fetchChecked(rawUrl);
		} else { 							// Temporary
			response = await fetch(rawUrl);
			const data = await response.clone().arrayBuffer();
			const hash = await sha256(data);
			iconKey = CACHE_ORIGIN + hash.slice(0, 20);
		}

		model.iconKey = iconKey;
		return cache.put(iconKey, response);
	}

	/**
	 * Get saved icon from CacheStorage, if it does not exist:
	 * - For internal resource, fallback to default.
	 * - For HTTP resource, download and put it to cache.
	 *
	 * The favicon URL may be created by `URL.createObjectURL`, you
	 * should dispose it with `URL.revokeObjectURL` if no longer used.
	 */
	async populate(model, iconKey = model.iconKey) {
		if (!iconKey) {
			return model.favicon = this.defaultValue;
		}
		if (!/^https?:/.test(iconKey)) {
			return model.favicon = iconKey;
		}

		const cache = await caches.open("icon");
		let response = await cache.match(iconKey);
		if (!response) {
			// Uploaded file cannot be downloaded, fallback to the default.
			if (iconKey.startsWith(CACHE_ORIGIN)) {
				return model.favicon = this.defaultValue;
			}
			response = await fetchChecked(iconKey);
			await cache.put(iconKey, response.clone());
		}

		model.favicon = URL.createObjectURL(await response.blob());
	}
}

/**
 * Remove unused entries from the cache storage.
 *
 * An icon may be referenced by multiple entities, so we should
 * check all references when removing any cached item.
 */
export async function removeUnused() {
	const { shortcuts, engines } = appConfig;
	const used = new Set();

	shortcuts.forEach(i => used.add(i.iconKey));
	engines.forEach(i => used.add(i.iconKey));

	const cache = await caches.open("icon");
	const tasks = (await cache.keys())
		.filter(r => !used.has(r.url))
		.map(request => cache.delete(request));

	await Promise.all(tasks);
	console.debug(`Remove ${tasks.length} unused icons.`);
}
