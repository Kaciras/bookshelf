import { dragSortContext } from "@kaciras/utilities/browser";
import { saveConfig } from "./storage.js";
import * as iconCache from "./cache.js";
import defaultFavicon from "../assets/Website.svg?url";

const container = document.getElementById("shortcuts");
const lastEl = container.lastChild;

const dragSort = dragSortContext();

let editable = false;

/**
 * Save data, called every time shortcuts are modified.
 */
async function persist() {
	const children = container.querySelectorAll("book-mark");
	const shortcuts = new Array(children.length);

	for (let i = 0; i < children.length; i++) {
		const { label, favicon, url } = children[i];
		shortcuts[i] = {
			label,
			url,
			favicon: await iconCache.save(favicon, defaultFavicon),
		};
	}
	return saveConfig({ shortcuts });
}

function appendElement(props) {
	const el = document.createElement("book-mark");

	el.url = props.url;
	el.favicon = props.favicon;
	el.label = props.label;

	dragSort.register(el);
	lastEl.before(el);
	el.addEventListener("dragend", persist);
	return el;
}

export async function add(props) {
	appendElement(props).isEditable = editable;
	return persist();
}

export async function update(index, props) {
	const el = container.children[index];
	URL.revokeObjectURL(el.favicon);
	Object.assign(el, props);

	return persist().then(iconCache.evict);
}

export function remove(event) {
	event.target.remove();
	return persist().then(iconCache.evict);
}

export function setShortcutEditable(value) {
	editable = value;
	for (const el of container.children)
		el.isEditable = value;
}

export function mountShortcuts(shortcuts) {
	if (import.meta.env.dev) {
		console.debug("Shortcuts model:", shortcuts);
	}

	for (const shortcut of shortcuts) {
		const { favicon } = shortcut;
		const el = appendElement(shortcut);
		iconCache.load(favicon, defaultFavicon).then(v => el.favicon = v);
	}
}
