import "../components/dialog-base/index.js";
import "../components/book-mark/index.js";
import "../components/edit-dialog/index.js";
import "../components/search-box/index.js";
import "../components/top-site-dialog/index.js";
import "./shortcuts.js";
import settingIcon from "@assets/Setting.svg";
import checkIcon from "@assets/Check.svg";

document.getElementsByTagName("main")[0].insertBefore(
	document.createElement("search-box"),
	document.getElementById("bookmarks"),
);

const dialog = document.createElement("edit-dialog");
document.body.append(dialog);

const importDialog = document.createElement("top-site-dialog");
document.body.append(importDialog);

async function addShortcut() {
	const isAccept = await dialog.show();
	if (!isAccept) {
		return;
	}

}

function importTopSites() {
	importDialog.show();
	importDialog.addEventListener("add", event => {
		const el = document.createElement("book-mark");
		Object.assign(el, event.detail);
		document.getElementById("bookmarks").append(el);
	});
}

const settingEl = document.getElementById("setting");

function switchSettingMode() {
	settingEl.innerHTML = "";

	const acceptBtn = document.createElement("button");
	acceptBtn.innerHTML = checkIcon + "<span>确定</span>";
	acceptBtn.title = null;
	acceptBtn.classList.add("primary");
	acceptBtn.onclick = switchNormalMode;
	settingEl.append(acceptBtn);

	const addBtn = document.createElement("button");
	addBtn.innerHTML = "添加网站";
	addBtn.onclick = addShortcut;
	settingEl.append(addBtn);

	const importBtn = document.createElement("button");
	importBtn.innerHTML = "导入常用网站";
	importBtn.onclick = importTopSites;
	settingEl.append(importBtn);

	document.body.classList.add("editing");
}

function switchNormalMode() {
	settingEl.innerHTML = "";

	const button = document.createElement("button");
	button.innerHTML = settingIcon;
	button.title = "进入设置模式";
	button.className = "icon";
	button.onclick = switchSettingMode;
	settingEl.append(button);

	document.body.classList.remove("editing");
}

switchNormalMode();

