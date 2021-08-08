import "../components/dialog-base/index.js";
import "../components/book-mark/index.js";
import "../components/edit-dialog/index.js";
import "../components/search-box/index.js";
import "../components/top-site-dialog/index.js";
import settingIcon from "@assets/Setting.svg";
import checkIcon from "@assets/Check.svg";
import { addShortcut, importTopSites, setShortcutEditable } from "./shortcuts";

// module js 自带 defer 属性，所以没法在 html 里使用自定义元素
document.getElementsByTagName("main")[0].insertBefore(
	document.createElement("search-box"),
	document.getElementById("bookmarks"),
);

const settingEl = document.getElementById("setting");

function switchToSettingMode() {
	settingEl.innerHTML = "";

	const acceptBtn = document.createElement("button");
	acceptBtn.innerHTML = checkIcon + "<span>确定</span>";
	acceptBtn.title = null;
	acceptBtn.classList.add("primary");
	acceptBtn.onclick = switchToNormalMode;
	settingEl.append(acceptBtn);

	const addBtn = document.createElement("button");
	addBtn.innerHTML = "添加网站";
	addBtn.onclick = addShortcut;
	settingEl.append(addBtn);

	const importBtn = document.createElement("button");
	importBtn.innerHTML = "导入常用网站";
	importBtn.onclick = importTopSites;
	settingEl.append(importBtn);

	setShortcutEditable(true);
	document.body.classList.add("editing");
}

function switchToNormalMode() {
	settingEl.innerHTML = "";

	const button = document.createElement("button");
	button.innerHTML = settingIcon;
	button.title = "进入设置模式";
	button.className = "icon";
	button.onclick = switchToSettingMode;
	settingEl.append(button);

	setShortcutEditable(false);
	document.body.classList.remove("editing");
}

switchToNormalMode();
