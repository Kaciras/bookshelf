import WebsiteIcon from "@assets/Website.svg?url";
import { indexInParent, jump } from "@share";
import { loadConfig, saveConfig, syncAddonData } from "./storage";

/*
 * 网页图标不支持自己上传，只能从目标网址下载，这是由于浏览器存储有限制，
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
 * 拖拽排序的几个事件，把它们方法打包放在对象里排版上更紧凑。
 *
 * 无法支持从浏览器的书签拖动导入，因为浏览器会直接打开书签的页面。
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

	caches.open("favicon").then(c => c.put(iconUrl, favicon));
	const el = appendElement(request);
	el.isEditable = container.editable;

	shortcuts.push({ label, iconUrl, url });
	return persistDataModel();
}

function update(index, request) {
	const { iconResponse, ...newValue } = request;

	const el = container.children[index];
	URL.revokeObjectURL(el.favicon);
	Object.assign(el, newValue);
	shortcuts[index] = newValue;

	caches.open("favicon").then(c => c.put(newValue.iconUrl, iconResponse));

	return persistDataModel().then(cleanIconCache);
}

/**
 * 快捷方式右上角的编辑按钮被点击时调用。
 *
 * 【注意】
 * 这里用索引来记录当前编辑的对象，需要保证编辑时 shortcuts 里的顺序不变。
 *
 * @param event BookMark 元素的 edit 事件
 */
function handleEdit(event) {
	const el = event.target;
	editDialog.index = indexInParent(el);
	editDialog.show(el);
}

function handleRemove(event) {
	const i = indexInParent(event.target);
	event.target.remove();
	shortcuts.splice(i, 1);

	return persistDataModel().then(cleanIconCache);
}

editDialog.addEventListener("change", event => {
	const { target, detail } = event;
	const { index } = target;

	if (index === undefined) {
		return add(detail);
	} else {
		return update(index, detail);
	}
});

importDialog.addEventListener("add", event => add(event.detail));

export function startAddShortcut() {
	editDialog.show();
	editDialog.index = undefined;
}

export function startImportTopSites() {
	importDialog.show();
}

export function setShortcutEditable(value) {
	container.editable = value;
	for (const el of container.children) el.isEditable = value;
}

/**
 * 异步地从网站下载图标，完成后设置元素的图标属性。
 *
 * @param el 元素
 * @param iconUrl 图标的 URL
 */
async function populateIcon(el, iconUrl) {
	if (!iconUrl) {
		return el.favicon = WebsiteIcon;
	}

	const cache = await caches.open("favicon");
	let response = await cache.match(iconUrl);

	if (!response) {
		response = await fetch(iconUrl);
		if (!response.ok) {
			throw new Error("图标下载失败：" + iconUrl);
		}
		await cache.put(iconUrl, response.clone());
	}

	const blob = await response.blob();
	el.favicon = URL.createObjectURL(blob);
}

function initialize(saved) {
	shortcuts = saved.shortcuts ?? [];

	if (import.meta.dev) {
		console.debug("Shortcuts model:", shortcuts);
	}

	for (const shortcut of shortcuts) {
		const { iconUrl } = shortcut;
		const el = appendElement(shortcut);
		populateIcon(el, iconUrl).then();
	}

	requestIdleCallback(() => syncAddonData(cleanIconCache));
}

/**
 * 清理没有用到的图标缓存，该函数虽然开销较大，但调用并不频繁。
 *
 * 因为可能存在多个快捷方式使用同一图标的情况，
 * 所以不能仅靠被修改的对象来确定是否清理，只能全部扫描一遍。
 */
async function cleanIconCache() {
	const inUse = new Set(shortcuts.map(s => s.iconUrl));

	const cache = await caches.open("favicon");
	const tasks = (await cache.keys())
		.filter(r => !inUse.has(r.url))
		.map(request => cache.delete(request));

	await Promise.all(tasks);
	console.debug(`删除了 ${tasks.length} 个图标缓存。`);
}

document.body.append(importDialog, editDialog);
loadConfig("shortcuts").then(initialize);
