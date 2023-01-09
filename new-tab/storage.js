/*
 * 本项目同时使用了多个存储，包括在不同设备之间同步的 sync 和不同步的 local，
 * 为了保持数据一致性，必须提供能检测远程更改的方法。
 *
 * 一番搜索后没发现如何监视 browser.storage.sync 的同步，所以只能采用 UUID 来判断。
 * 每次修改同步存储时，会生成一个随机数作为 UUID，该值同时保存到 sync 和 local 存储区，
 * 当 sync 远程同步后该值将跟 local 里的不同。
 */
import { i18n } from "../share/index.js";
import { blobToBase64URL, saveFile, selectFile } from "@kaciras/utilities/browser";

const localSettings = browser.storage.local;
const syncSettings = browser.storage.sync;

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
