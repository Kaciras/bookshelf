import { blobToBase64URL, saveFile, selectFile } from "@kaciras/utilities/browser";
import BaiduIcon from "../assets/Baidu.svg";
import GoogleIcon from "../assets/google.svg";
import DuckDuckGoIcon from "../assets/dax-logo.svg";
import { i18n } from "../share/index.js";

/*
 * 本项目同时使用了多个存储，包括在不同设备之间同步的 sync 和不同步的 local，
 * 为了保持数据一致性，必须提供能检测远程更改的方法。
 *
 * 一番搜索后没发现如何监视 browser.storage.sync 的同步，所以只能采用 UUID 来判断。
 * 每次修改同步存储时，会生成一个随机数作为 UUID，该值同时保存到 sync 和 local 存储区，
 * 当 sync 远程同步后该值将跟 local 里的不同。
 */
const localSettings = browser.storage.local;
const syncSettings = browser.storage.sync;

export const settings = {
	limit: 8,
	threshold: 500,
	waitIME: true,
	
	shortcuts: [],

	/*
 	 * Default search engines, you can find more at:
 	 * https://github.com/chromium/chromium/blob/main/components/search_engines/prepopulated_engines.json
 	 */
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

export const loading = syncSettings.get().then(v => Object.assign(settings, v));

export async function saveConfig(object, keys) {
	const uuid = Math.random();
	const items = { uuid };

	if (keys) {
		for (const key of keys) {
			items[key] = object[key];
		}
	} else {
		Object.assign(items, object);
		Object.assign(settings, object);
	}

	await syncSettings.set(items);
	await localSettings.set({ uuid });
}

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
		sync: settings,
		local: await localSettings.get(),
	};

	const json = JSON.stringify(data, null, "\t");
	saveFile(new File([json], "bookshelf-data.json"));
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
