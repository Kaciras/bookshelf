import { dragSortContext } from "@kaciras/utilities/browser";
import { saveAppConfig } from "./storage.js";
import * as iconCache from "./cache.js";
import defaultFavicon from "../assets/Website.svg?url";

const siteIcons = new iconCache.IconCache(defaultFavicon);

const dragSort = dragSortContext();
const container = document.getElementById("shortcuts");
const newShortcutButton = container.lastChild;

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
	return saveAppConfig({ shortcuts });
}

function appendElement(props) {
	const el = document.createElement("book-mark");
	el.url = props.url;
	el.iconKey = props.iconKey;
	el.label = props.label;

	// noinspection JSIgnoredPromiseFromCall
	siteIcons.populate(el);

	el.isEditable = editable;
	dragSort.register(el);
	newShortcutButton.before(el);
	el.addEventListener("dragend", persist);
}

export async function add(props) {
	await siteIcons.save(props);
	appendElement(props);
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

export function setEditable(value) {
	editable = value;
	for (const el of container.children)
		el.isEditable = value;
}

export function mount(shortcuts) {
	for (const props of shortcuts) {
		appendElement(props);
	}
	if (import.meta.env.dev) {
		console.debug("Shortcuts model:", shortcuts);
	}
}
