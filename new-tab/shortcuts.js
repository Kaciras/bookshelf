import { dragSortContext } from "../share/index.js";
import { checkSync, saveConfig } from "./storage.js";
import * as iconCache from "./cache.js";

/*
 * 网页图标不支持自己上传，只能从目标网址下载，这是由于浏览器存储有限制，
 * 能同步的数据很少，图标等资源会超出限额所以只能存在本地，当数据同步到新的设备上后需必须新下载图标。
 * Firefox 自己的标签页也和书签也是这样的。
 *
 * 这个限制也导致了如果网站更换了图标，同时新设备同步来了该站点的快捷方式，则显示的图标会不一样。
 */

const container = document.getElementById("shortcuts");

/**
 * 保存数据模型，在每次修改 shortcuts 后都要调用。
 *
 * @return {Promise<void>} 等待保存完成
 */
function persistDataModel() {
	const { children } = container;
	const shortcuts = new Array(children.length);

	for (let i = 0; i < shortcuts.length; i++) {
		const { label, iconUrl, url } = children[i];
		shortcuts[i] = { label, iconUrl, url };
	}
	return saveConfig({ shortcuts });
}

const dragSort = dragSortContext();

function appendElement(props) {
	const el = document.createElement("book-mark");

	el.url = props.url;
	el.favicon = props.favicon;
	el.label = props.label;
	el.iconUrl = props.iconUrl;

	dragSort(el);
	container.append(el);
	el.addEventListener("dragend", persistDataModel);
	return el;
}

export async function add(props) {
	props.iconUrl = await iconCache.save(props.iconUrl);

	const el = appendElement(props);
	el.isEditable = container.editable;

	return persistDataModel();
}

export async function update(index, props) {
	const { iconUrl, ...newValue } = props;
	newValue.iconUrl = await iconCache.save(iconUrl);

	const el = container.children[index];
	URL.revokeObjectURL(el.favicon);
	Object.assign(el, newValue);

	return persistDataModel().then(iconCache.evict);
}

export function remove(event) {
	event.target.remove();
	return persistDataModel().then(iconCache.evict);
}

export function setShortcutEditable(value) {
	container.editable = value;
	for (const el of container.children) el.isEditable = value;
}

/**
 * 挂载快捷方式组件，同时也会在空闲时清理下过期的数据。
 *
 * <h2>caches.open() 的影响</h2>
 * 在该函数中调用 caches.open() 会阻塞很久，然后 cache.match() 则很快返回，
 * 导致可见的布局移动，推测打开缓存区需要执行 IO 操作。
 */
export function mountShortcuts(shortcuts) {
	if (import.meta.env.dev) {
		console.debug("Shortcuts model:", shortcuts);
	}

	for (const shortcut of shortcuts) {
		const { iconUrl } = shortcut;
		const el = appendElement(shortcut);

		iconCache.load(iconUrl)
			.then(v => el.favicon = v);
	}

	requestIdleCallback(() => checkSync(iconCache.evict));
}
