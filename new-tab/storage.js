/*
 * 本项目同时使用了多个存储，包括在不同设备之间同步的 sync 和不同步的 local，
 * 为了保持数据一致性，必须提供能检测远程更改的方法。
 *
 * 一番搜索后没发现如何监视 browser.storage.sync 的同步，所以只能采用 UUID 来判断。
 * 每次修改同步存储时，会生成一个随机数作为 UUID，该值同时保存到 sync 和 local 存储区，
 * 当 sync 远程同步后该值将跟 local 里的不同。
 */
import { saveFile, selectFile } from "@share";

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
 * 其它设备的本地存储虽然不受影响，但在下次启动时也会由 syncLocalStorage 清理。
 */
export async function clearAllData() {
	localStorage.clear();
	await syncSettings.clear();
	await localSettings.clear();
}

/**
 * 注册存储同步处理函数，用于解决本地跟远程数据一致性问题。
 * 如果有新的远程数据同步了过来，注册的函数将被调用，完成后自动设置同步状态为已同步。
 *
 * @param callback 处理函数
 * @return {Promise<void>} 是否完成整个流程
 */
export async function syncLocalStorage(callback) {
	const [synced, local] = await Promise.all([
		syncSettings.get("uuid"),
		localSettings.get("uuid"),
	]);
	if (!local.uuid) {
		return; // 跳过第一次同步
	}
	if (synced.uuid === local.uuid) {
		return;
	}
	await callback();
	await localSettings.set({ uuid: synced.uuid });
	console.info("已更新本地存储，与同步的数据一致");
}

export async function exportSettings() {
	const page = {};
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		page[key] = localStorage.getItem(key);
	}

	const json = JSON.stringify({
		page,
		sync: await syncSettings.get(),
		local: await localSettings.get(),
	});
	const blob = new Blob([json], {
		type: "application/json",
	});

	saveFile(blob, "settings.json");
}

export async function importSettings() {
	const [blob] = await selectFile("application/json");
	const s = JSON.parse(await blob.text());

	await clearAllData();

	await localSettings.set(s.local);
	await syncSettings.set(s.sync);

	for (const [key, value] of Object.entries(s.page)) {
		localStorage.setItem(key, value);
	}
}
