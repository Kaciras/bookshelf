import { getFaviconUrl, imageUrlToLocal, indexInParent, jump } from "@share";
import { loadConfig, saveConfig, syncLocalStorage } from "./storage";

const container = document.getElementById("bookmarks");
const importDialog = document.createElement("top-site-dialog");
const editDialog = document.createElement("edit-dialog");

let model;			// 数据模型
let dragEl = null;	// 当前被拖动的元素

function persistDataModel() {
	return saveConfig({ bookmarks: model });
}

function iconKey(shortcut) {
	return "FI." + new URL(shortcut.url).host;
}

async function handleEdit(event) {
	const el = event.target;
	const i = indexInParent(el);

	Object.assign(editDialog, model[i]);
	const isAccept = await editDialog.show();
	if (!isAccept) {
		return;
	}
	const { label, favicon, url } = editDialog;
	const newValue = { label, favicon, url };

	Object.assign(el, newValue);
	model[i] = newValue;
	await persistDataModel();
}

async function handleRemove(event) {
	const i = indexInParent(event.target);
	event.target.remove();
	model.splice(i, 1);
	clean(); // 可能较慢，但删除操作不频繁。
	await persistDataModel();
}

// 把这仨方法打包放在对象里，排版上更紧凑。
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
		dragEl.isDragging = true;

		const i = indexInParent(dragEl);
		const j = indexInParent(target);

		jump(model, i, j);

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

	model.push({ label, iconUrl, url });
	return persistDataModel();
}

importDialog.addEventListener("add", event => add(event.detail));

export async function startAddShortcut() {
	editDialog.reset();
	const isAccept = await editDialog.show();
	if (!isAccept) {
		return;
	}
	return add(editDialog);
}

export function startImportTopSites() {
	importDialog.show();
}

export function setShortcutEditable(value) {
	for (const el of container.children) el.isEditable = value;
}

/*
 * 网页图标不支持自己上传，只能从目标网址下载，这是由于浏览器存储的限制，
 * 能同步的数据很少，图标等资源会超出限额所以只能存在本地，当数据同步到新的设备上后需必须新下载图标。
 * Firefox 自己的标签页也和书签也是这样的。
 *
 * 这个限制也导致了如果网站更换了图标，同时新设备同步来了该站点的快捷方式，则显示的图标会不一样
 */

async function queueDownload(el, key) {
	let { url, iconUrl } = el;
	iconUrl = iconUrl ?? await getFaviconUrl(url);
	const favicon = await imageUrlToLocal(iconUrl);
	el.favicon = favicon;
	localStorage.setItem(key, favicon);
}

function buildModel({ bookmarks = [] }) {
	model = bookmarks;
	const hosts = new Set();

	if (import.meta.dev) {
		console.debug("Shortcuts model:", bookmarks);
	}

	for (const shortcut of bookmarks) {
		const key = iconKey(shortcut);
		const el = appendElement(shortcut);

		hosts.add(key);

		let favicon = localStorage.getItem(key);
		if (favicon !== null) {
			el.favicon = favicon;
		} else {
			queueDownload(el, key).then(/* 忽略警告 */);
		}
	}

	requestIdleCallback(() => syncLocalStorage(clean));
}

function clean() {
	const inUse = new Set(model.map(iconKey));
	const toRemove = [];

	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage[i];
		if (key.startsWith("FI.") && !inUse.has(key)) {
			toRemove.push(key);
		}
	}
	toRemove.forEach(k => localStorage.removeItem(k));
}

document.body.append(importDialog, editDialog);
loadConfig("bookmarks").then(buildModel);
