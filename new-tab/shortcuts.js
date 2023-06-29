import { dragSortContext } from "@kaciras/utilities/browser";
import { saveConfig } from "./storage.js";
import * as iconCache from "./cache.js";
import defaultFavicon from "../assets/Website.svg?url";

const siteIcons = new iconCache.IconCache(defaultFavicon);
const container = document.getElementById("shortcuts");
const lastEl = container.lastChild;

const dragSort = dragSortContext();

let editable = false;

/**
 * Save data, called every time shortcuts are modified.
 */
async function persist() {
	const els = container.querySelectorAll("book-mark");
	const shortcuts = new Array(els.length);

	for (let i = 0; i < els.length; i++) {
		const { label, iconKey, url } = els[i];
		shortcuts[i] = { label, url, iconKey };
	}
	return saveConfig({ shortcuts });
}

function appendElement(props) {
	const el = document.createElement("book-mark");

	el.url = props.url;
	el.iconKey = props.iconKey;
	el.label = props.label;
	siteIcons.populate(el);

	dragSort.register(el);
	lastEl.before(el);
	el.addEventListener("dragend", persist);
	return el;
}

export async function add(props) {
	await siteIcons.save(props);
	appendElement(props).isEditable = editable;
	return persist();
}

export async function update(index, props) {
	await siteIcons.save(props);
	const el = container.children[index];
	URL.revokeObjectURL(el.favicon);
	Object.assign(el, props);
	siteIcons.populate(el);

	return persist().then(iconCache.removeUnused);
}

export function remove({ target }) {
	target.remove();
	URL.revokeObjectURL(target.favicon);
	return persist().then(iconCache.removeUnused);
}

export function setShortcutEditable(value) {
	editable = value;
	for (const el of container.children)
		el.isEditable = value;
}

export function mountShortcuts(shortcuts) {
	for (const shortcut of shortcuts) {
		appendElement(shortcut);
	}
	if (import.meta.env.dev) {
		console.debug("Shortcuts model:", shortcuts);
	}
}
