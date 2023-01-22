import { dragSortContext } from "@kaciras/utilities/browser";
import { saveConfig } from "./storage.js";
import * as iconCache from "./cache.js";

const container = document.getElementById("shortcuts");
const lastEl = container.lastChild;

const dragSort = dragSortContext();

/**
 * Save data, called every time shortcuts are modified.
 */
function persist() {
	const children = container.querySelectorAll("book-mark");
	const shortcuts = new Array(children.length);

	for (let i = 0; i < children.length; i++) {
		const { label, iconUrl, url } = children[i];
		shortcuts[i] = { label, iconUrl, url };
	}
	return saveConfig({ shortcuts });
}

function appendElement(props) {
	const el = document.createElement("book-mark");

	el.url = props.url;
	el.favicon = props.favicon;
	el.label = props.label;
	el.iconUrl = props.iconUrl;

	dragSort(el);
	lastEl.before(el);
	el.addEventListener("dragend", persist);
	return el;
}

export async function add(props) {
	props.iconUrl = await iconCache.save(props.iconUrl);

	const el = appendElement(props);
	el.isEditable = container.editable;

	return persist();
}

export async function update(index, props) {
	const { iconUrl, ...newValue } = props;
	newValue.iconUrl = await iconCache.save(iconUrl);

	const el = container.children[index];
	URL.revokeObjectURL(el.favicon);
	Object.assign(el, newValue);

	return persist().then(iconCache.evict);
}

export function remove(event) {
	event.target.remove();
	return persist().then(iconCache.evict);
}

export function setShortcutEditable(value) {
	container.editable = value;
	for (const el of container.children)
		el.isEditable = value;
}

export function mountShortcuts(shortcuts) {
	if (import.meta.env.dev) {
		console.debug("Shortcuts model:", shortcuts);
	}

	for (const shortcut of shortcuts) {
		const { iconUrl } = shortcut;
		const el = appendElement(shortcut);
		iconCache.load(iconUrl).then(v => el.favicon = v);
	}
}
