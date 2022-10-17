import { indexInParent, jump } from "@share";
import { checkSync, iconCache, loadConfig, saveConfig } from "./storage.js";

/*
 * 网页图标不支持自己上传，只能从目标网址下载，这是由于浏览器存储有限制，
 * 能同步的数据很少，图标等资源会超出限额所以只能存在本地，当数据同步到新的设备上后需必须新下载图标。
 * Firefox 自己的标签页也和书签也是这样的。
 *
 * 这个限制也导致了如果网站更换了图标，同时新设备同步来了该站点的快捷方式，则显示的图标会不一样。
 */

const container = document.getElementById("shortcuts");

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
const dragSortHandlers = {
	ondragstart(event) {
		dragEl = event.currentTarget;
		dragEl.ondragenter = null;
	},
	ondragend() {
		dragEl.ondragenter = dragSortHandlers.ondragenter;
		dragEl.isDragging = false;
		dragEl = null;
		return persistDataModel();
	},
	ondragenter(event) {
		const { currentTarget } = event;

		if (!dragEl) {
			return; // 拖拽元素不是快捷方式
		}
		dragEl.isDragging = true;

		const i = indexInParent(dragEl);
		const j = indexInParent(currentTarget);
		if (i < j) {
			currentTarget.after(dragEl);
		} else {
			currentTarget.before(dragEl);
		}
	},
};

function appendElement(props) {
	const el = document.createElement("book-mark");

	el.url = props.url;
	el.favicon = props.favicon;
	el.label = props.label;
	el.iconUrl = props.iconUrl;

	container.append(el);
	return Object.assign(el, dragSortHandlers);
}

export async function add(request) {
	const { label, icon, url, favicon } = request;

	const iconUrl = await iconCache.save(icon);

	const model = { label, iconUrl, url };
	shortcuts.push(model);

	model.favicon = favicon;
	const el = appendElement(model);
	el.isEditable = container.editable;

	return persistDataModel();
}

export async function update(index, request) {
	const { icon, ...newValue } = request;

	const iconUrl = await iconCache.save(icon);
	newValue.iconUrl = iconUrl;

	const el = container.children[index];
	URL.revokeObjectURL(el.favicon);
	Object.assign(el, newValue);

	const { label, url } = newValue;
	shortcuts[index] = { label, iconUrl, url };

	return persistDataModel().then(evictCache);
}

export function remove(event) {
	const i = indexInParent(event.target);
	event.target.remove();
	shortcuts.splice(i, 1);

	return persistDataModel().then(evictCache);
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
 *
 * @param saved 保存的数据
 */
function mountShortcuts(saved) {
	// 注意！shortcuts 是外层变量，不要在参数上用解构！
	shortcuts = saved.shortcuts ?? [];

	if (import.meta.env.dev) {
		console.debug("Shortcuts model:", shortcuts);
	}

	for (const shortcut of shortcuts) {
		const { iconUrl } = shortcut;
		const el = appendElement(shortcut);

		iconCache.load(iconUrl)
			.then(v => el.favicon = v);
	}

	requestIdleCallback(() => checkSync(evictCache));
}

/**
 * 清理没有用到的图标缓存，该函数虽然开销较大，但调用并不频繁。
 *
 * 因为可能存在多个快捷方式使用同一图标的情况，
 * 所以不能仅靠被修改的对象来确定是否清理，只能全部扫描一遍。
 */
function evictCache() {
	return iconCache.evict(new Set(shortcuts.map(s => s.iconUrl)));
}

loadConfig("shortcuts").then(mountShortcuts);
