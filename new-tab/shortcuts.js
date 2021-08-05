const storage = browser.storage.sync;

const container = document.getElementById("bookmarks");
const importDialog = document.createElement("top-site-dialog");
const editDialog = document.createElement("edit-dialog");

let model;

async function handleEdit(event) {
	const el = event.target;
	const i = [].indexOf.call(el.parentNode.children, el);

	Object.assign(editDialog, model[i]);
	const isAccept = await editDialog.show();
	if (!isAccept) {
		return;
	}
	const { label, favicon, url } = editDialog;
	const newValue = { label, favicon, url };

	Object.assign(el, newValue);
	model[i] = newValue;
	await storage.set({ bookmarks: model });
}

async function handleRemove(event) {
	const el = event.target;
	const i = [].indexOf.call(el.parentNode.children, el);

	delete model[i];
	await storage.set({ bookmarks: model });
}

function render(entries) {
	container.innerHTML = "";
	for (const shortcut of entries) {
		const el = document.createElement("book-mark");
		Object.assign(el, shortcut);
		container.append(el);
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

	await storage.set({ bookmarks: model });
}

export function importTopSites() {
	importDialog.show();
}

importDialog.addEventListener("add", event => {
	model.push(event.detail);
	render(model);
	return storage.set({ bookmarks: model });
});

document.body.append(importDialog);
document.body.append(editDialog);
storage.get("bookmarks").then(({ bookmarks = [] }) => render(model = bookmarks));
