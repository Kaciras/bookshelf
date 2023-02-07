import { blobToBase64URL, saveFile, selectFile } from "@kaciras/utilities/browser";
import BaiduIcon from "../assets/Baidu.svg?resource";
import GoogleIcon from "../assets/google.svg?resource";
import DuckDuckGoIcon from "../assets/dax-logo.svg?resource";
import { i18n } from "../share/index.js";

const syncSettings = browser.storage.sync;

export const appConfig = {
	searchBox: {
		limit: 8,
		threshold: 500,
		waitIME: true,
	},

	shortcuts: [],

	/*
 	 * Default search engines, you can find more at:
 	 * https://github.com/chromium/chromium/blob/main/components/search_engines/prepopulated_engines.json
 	 */
	defaultEngine: 1,
	engines: [{
		name: i18n("DuckDuckGo"),
		favicon: DuckDuckGoIcon,
		searchAPI: "https://duckduckgo.com/?t=ffsb&ia=web&q=",
		suggestAPI: "https://ac.duckduckgo.com/ac/?type=list&q=",
	}, {
		name: "Google",
		favicon: GoogleIcon,
		searchAPI: "https://www.google.com/search?client=firefox-b-d&q=",
		suggestAPI: "https://www.google.com/complete/search?client=firefox&q=",
	}, {
		name: i18n("Baidu"),
		favicon: BaiduIcon,
		searchAPI: "https://www.baidu.com/baidu?ie=utf-8&wd=",
		suggestAPI: "https://www.baidu.com/su?ie=utf-8&action=opensearch&wd=",
	}],
};

export const loadingAppConfig = syncSettings.get().then(v => Object.assign(appConfig, v));

export function saveConfig(object) {
	Object.assign(appConfig, object);
	return syncSettings.set(object);
}

export async function clearAllData() {
	await syncSettings.clear();
	await caches.delete("icon");
}

export async function exportSettings() {
	const cache = await caches.open("icon");
	const icons = [];

	for (const { url } of await cache.keys()) {
		const res = await cache.match(url);
		const blob = await (res).blob();
		const body = await blobToBase64URL(blob);
		icons.push({ url, body });
	}

	const data = { icons, sync: appConfig };

	const json = JSON.stringify(data, null, "\t");
	saveFile(new File([json], "bookshelf-data.json"));
}

export async function importSettings() {
	const [blob] = await selectFile("application/json");
	const s = JSON.parse(await blob.text());

	await clearAllData();
	await syncSettings.set(s.sync);

	const cache = await caches.open("icon");
	for (const { url, body } of s.icons) {
		await cache.put(url, await fetch(body));
	}

	window.alert(i18n("AfterImportSuccess"));
}
