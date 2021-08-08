import { indexOfParent } from "@share";

const storage = browser.storage.sync;

const container = document.getElementById("bookmarks");
const importDialog = document.createElement("top-site-dialog");
const editDialog = document.createElement("edit-dialog");

let model;			// 数据模型
let dragEl = null;	// 当前被拖动的元素

function persistModel() {
	return storage.set({ bookmarks: model });
}

async function handleEdit(event) {
	const el = event.target;
	const i = indexOfParent(el);

	Object.assign(editDialog, model[i]);
	const isAccept = await editDialog.show();
	if (!isAccept) {
		return;
	}
	const { label, favicon, url } = editDialog;
	const newValue = { label, favicon, url };

	Object.assign(el, newValue);
	model[i] = newValue;
	await persistModel();
}

async function handleRemove(event) {
	const i = indexOfParent(event.target);
	delete model[i];
	await persistModel();
}

function handleDragStart(event) {
	dragEl = event.currentTarget;
	dragEl.ondragenter = null;
}

function handleDragEnd() {
	dragEl.ondragenter = handleDragEnter;
	dragEl.isDragging = false;
	dragEl = null;
	return persistModel();
}

function handleDragEnter(event) {
	const { target } = event;
	dragEl.isDragging = true;

	const i = indexOfParent(dragEl);
	const j = indexOfParent(target);

	if (i > j) {
		target.before(dragEl);
	} else {
		target.after(dragEl);
	}

	const [shortcut] = model.splice(i, 1);
	model.splice(j, 0, shortcut);
}

function render(entries) {
	container.innerHTML = "";

	for (const shortcut of entries) {
		const el = document.createElement("book-mark");
		Object.assign(el, shortcut);
		el.draggable = true;
		container.append(el);

		el.ondragstart = handleDragStart;
		el.ondragend = handleDragEnd;
		el.ondragenter = handleDragEnter;

		el.addEventListener("edit", handleEdit);
		el.addEventListener("remove", handleRemove);
	}
}

export async function addShortcut() {
	editDialog.reset();
	const isAccept = await editDialog.show();
	if (!isAccept) {
		return;
	}
	const { label, favicon, url } = editDialog;

	model.push({ label, favicon, url });
	render(model);

	await persistModel();
}

export function importTopSites() {
	importDialog.show();
}

export function setShortcutEditable(value) {
	for (const el of container.children) el.isEditable = value;
}

importDialog.addEventListener("add", event => {
	model.push(event.detail);
	render(model);
	return persistModel();
});

document.body.append(importDialog);
document.body.append(editDialog);
storage.get("bookmarks").then(({ bookmarks = [] }) => render(model = bookmarks));
