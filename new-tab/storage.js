const localSettings = browser.storage.local;
const syncSettings = browser.storage.sync;

export function loadConfig(keys) {
	return syncSettings.get(keys);
}

export async function saveConfig(items) {
	const uuid = Math.random();
	items.uuid = uuid;

	await localSettings.set({ uuid });
	await syncSettings.set(items);
}

export async function isRemoteSynced() {
	const [synced, local] = await Promise.all([
		syncSettings.get("uuid"),
		localSettings.get("uuid"),
	]);
	if (!local.uuid) {
		return; // 跳过第一次同步
	}
	return synced.uuid === local.uuid;
}

export async function setLocalSynced() {
	const { uuid } = await syncSettings.get("uuid");
	return localSettings.set({ uuid });
}
