import { getFaviconUrl, imageUrlToLocal, indexInParent, jump } from "@share";
import { loadConfig, saveConfig, syncLocalStorage } from "./storage";

/*
 * 网页图标不支持自己上传，只能从目标网址下载，这是由于浏览器存储的限制，
 * 能同步的数据很少，图标等资源会超出限额所以只能存在本地，当数据同步到新的设备上后需必须新下载图标。
 * Firefox 自己的标签页也和书签也是这样的。
 *
 * 这个限制也导致了如果网站更换了图标，同时新设备同步来了该站点的快捷方式，则显示的图标会不一样。
 */

const container = document.getElementById("shortcuts");
const importDialog = document.createElement("top-site-dialog");
const editDialog = document.createElement("edit-dialog");

let shortcuts;		// 数据模型
let dragEl = null;	// 当前被拖动的元素

/**
 * 保存数据模型，在每次修改 shortcuts 后都要调用。
 *
 * @return {Promise<void>} 等待保存完成
 */
function persistDataModel() {
	return saveConfig({ shortcuts });
}

/**
 * 获取快捷方式对应的图标，使用域名作为键。
 *
 * @param shortcut 快捷方式
 * @return {string} 对应的图标 DataURL
 */
function iconKey(shortcut) {
	return "FI." + new URL(shortcut.url).host;
}

async function handleEdit(event) {
	const el = event.target;
	const i = indexInParent(el);

	const data = await editDialog.show(el);
	if (data) {
		const { favicon, ...newValue } = data;
		Object.assign(el, data);

		localStorage.setItem(iconKey(el), favicon);
		shortcuts[i] = newValue;
		cleanIconCache();
		await persistDataModel();
	}
}

async function handleRemove(event) {
	const i = indexInParent(event.target);
	event.target.remove();
	shortcuts.splice(i, 1);
	cleanIconCache();
	await persistDataModel();
}

/**
 * 拖拽排序的几个事件，把它们方法打包放在对象里排版上更紧凑。
 *
 * 无法支持从浏览器的书签拖到页面，因为浏览器会直接打开书签页面。
 */
const DragSortHandlers = {
	ondragstart(event) {
		dragEl = event.currentTarget;
		dragEl.ondragenter = null;
	},
	ondragend() {
		dragEl.ondragenter = DragSortHandlers.ondragenter;
		dragEl.isDragging = false;
		dragEl = null;
		return persistDataModel();
	},
	ondragenter(event) {
		const { target } = event;

		if (!dragEl) {
			return; // 拖拽元素不是快捷方式
		}
		dragEl.isDragging = true;

		const i = indexInParent(dragEl);
		const j = indexInParent(target);

		jump(shortcuts, i, j);

		if (i < j) {
			target.after(dragEl);
		} else {
			target.before(dragEl);
		}
	},
};

function appendElement(props) {
	const el = document.createElement("book-mark");
	Object.assign(el, DragSortHandlers);

	el.addEventListener("edit", handleEdit);
	el.addEventListener("remove", handleRemove);

	el.url = props.url;
	el.favicon = props.favicon;
	el.label = props.label;
	el.iconUrl = props.iconUrl;

	container.append(el);
	return el;
}

function add(request) {
	const { label, iconUrl, favicon, url } = request;

	localStorage.setItem(iconKey(request), favicon);
	appendElement(request);

	shortcuts.push({ label, iconUrl, url });
	return persistDataModel();
}

importDialog.addEventListener("add", event => add(event.detail));

export async function startAddShortcut() {
	const data = await editDialog.show();
	if (data) {
		return add(editDialog);
	}
}

export function startImportTopSites() {
	importDialog.show();
}

export function setShortcutEditable(value) {
	for (const el of container.children) el.isEditable = value;
}

/**
 * 异步地从网站下载图标，完成后设置元素的图标属性。
 *
 * @param el 元素
 * @param key 图标在存储中的键
 */
async function queueDownload(el, key) {
	let { url, iconUrl } = el;
	iconUrl = iconUrl ?? await getFaviconUrl(url);
	const favicon = await imageUrlToLocal(iconUrl);
	el.favicon = favicon;
	localStorage.setItem(key, favicon);
}

function initialize(saved) {
	shortcuts = saved.bookmarks ?? [];

	if (import.meta.dev) {
		console.debug("Shortcuts model:", shortcuts);
	}

	const hosts = new Set();

	for (const shortcut of shortcuts) {
		const key = iconKey(shortcut);
		const el = appendElement(shortcut);

		hosts.add(key);

		let favicon = localStorage.getItem(key);
		if (favicon !== null) {
			el.favicon = favicon;
		} else {
			queueDownload(el, key);
		}
	}

	requestIdleCallback(() => syncLocalStorage(cleanIconCache));
}

/**
 * 清理没有用到的图标缓存，该函数虽然开销较大，但调用并不频繁。
 *
 * 因为可能存在多个快捷方式使用同一图标的情况，
 * 所以不能仅靠被修改的对象来确定是否清理，只能全部扫描一遍。
 */
function cleanIconCache() {
	const inUse = new Set(shortcuts.map(iconKey));
	const toRemove = [];

	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key.startsWith("FI.") && !inUse.has(key)) {
			toRemove.push(key);
		}
	}
	toRemove.forEach(k => localStorage.removeItem(k));
	console.debug(`删除 ${toRemove.length} 个图标缓存`);
}

document.body.append(importDialog, editDialog);
loadConfig("shortcuts").then(initialize);
