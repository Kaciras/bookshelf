/*
 * 本项目同时使用了多个存储，包括在不同设备之间同步的 sync 和不同步的 local，
 * 为了保持数据一致性，必须提供能检测远程更改的方法。
 *
 * 一番搜索后没发现如何监视 browser.storage.sync 的同步，所以只能采用 UUID 来判断。
 * 每次修改同步存储时，会生成一个随机数作为 UUID，该值同时保存到 sync 和 local 存储区，
 * 当 sync 远程同步后该值将跟 local 里的不同。
 */
import defaultFavicon from "@assets/Website.svg?url";
import { i18n } from "@share";
import { blobToBase64URL, saveFile, selectFile, sha256 } from "@kaciras/utilities";

export { defaultFavicon };

const localSettings = browser.storage.local;
const syncSettings = browser.storage.sync;

/**
 * 因为 CacheStorage 的 key 必须是 HTTP URL，所以用它作为键的前缀。
 */
export const CACHE_ORIGIN = "https://internal-cache/";

export async function saveConfig(object, keys) {
	const uuid = Math.random();
	const items = { uuid };

	if (keys) {
		for (const key of keys) {
			items[key] = object[key];
		}
	} else {
		Object.assign(items, object);
	}

	await syncSettings.set(items);
	await localSettings.set({ uuid });
}

export function loadConfig(keys) {
	return syncSettings.get(keys);
}

/**
 * 清除所有保存的数据，因为使用了同步存储所以其它设备也会受到影响。
 * 其它设备的本地存储虽然不受影响，但在下次启动时也会由 syncAddonData 清理。
 */
export async function clearAllData() {
	await caches.delete("favicon");
	await syncSettings.clear();
	await localSettings.clear();
}

/**
 * 注册存储同步处理函数，用于解决本地跟远程数据一致性问题。
 * 如果有新的远程数据同步了过来，注册的函数将被调用，完成后自动设置同步状态为已同步。
 *
 * @param callback The function will be called if new data is synced.
 */
export async function checkSync(callback) {
	const [synced, local] = await Promise.all([
		syncSettings.get("uuid"),
		localSettings.get("uuid"),
	]);
	if (!local.uuid || synced.uuid === local.uuid) {
		return;
	}
	await callback();
	await localSettings.set({ uuid: synced.uuid });
	console.info("Local storage updated with synced data.");
}

export async function exportSettings() {
	const cache = await caches.open("favicon");
	const favicons = [];
	for (const { url } of await cache.keys()) {
		const res = await cache.match(url);
		const blob = await (res).blob();
		const body = await blobToBase64URL(blob);
		favicons.push({ url, body });
	}

	const data = {
		favicons,
		sync: await syncSettings.get(),
		local: await localSettings.get(),
	};

	const json = JSON.stringify(data, null, "\t");
	const blob = new Blob([json], {
		type: "application/json",
	});
	saveFile(blob, "newtab-data.json");
}

export async function importSettings() {
	const [blob] = await selectFile("application/json");
	const s = JSON.parse(await blob.text());

	await clearAllData();

	await localSettings.set(s.local);
	await syncSettings.set(s.sync);

	const cache = await caches.open("favicon");
	for (const { url, body } of s.favicons) {
		await cache.put(url, await fetch(body));
	}

	window.alert(i18n("AfterImportSuccess"));
}

export const iconCache = {

	async save(dataUrlOrResp) {
		if (dataUrlOrResp === defaultFavicon) {
			return null;
		}
		const cache = await caches.open("favicon");
		let url;
		let response;

		if (typeof dataUrlOrResp !== "string") {
			url = dataUrlOrResp.url;
			response = dataUrlOrResp;
		} else {
			response = await fetch(dataUrlOrResp);
			const data = await response.clone().arrayBuffer();
			const hash = (await sha256(data)).slice(0, 20);
			url = CACHE_ORIGIN + hash;
		}

		return cache.put(url, response).then(() => url);
	},

	async load(urlKey) {
		if (!urlKey) {
			return defaultFavicon;
		}
		const cache = await caches.open("favicon");

		let response = await cache.match(urlKey);
		if (!response) {
			// 手动设置的图标没法下载，只能回退到默认值。
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
	},

	async evict(used) {
		const cache = await caches.open("favicon");
		const tasks = (await cache.keys())
			.filter(r => !used.has(r.url))
			.map(request => cache.delete(request));

		await Promise.all(tasks);
		console.debug(`Deleted ${tasks.length} expired favicons。`);
	},
};
