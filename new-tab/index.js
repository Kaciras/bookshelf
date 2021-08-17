import "../components/dialog-base/index.js";
import "../components/book-mark/index.js";
import "../components/edit-dialog/index.js";
import "../components/search-box/index.js";
import "../components/top-site-dialog/index.js";
import SettingIcon from "@assets/Setting.svg";
import CheckIcon from "@assets/Check.svg";
import { setShortcutEditable, startAddShortcut, startImportTopSites } from "./shortcuts";
import { clearAllData, loadConfig, saveConfig } from "./storage";

const searchBox = document.createElement("search-box");

// module js 自带 defer 属性，所以没法在 html 里使用自定义元素
document.getElementsByTagName("main")[0].insertBefore(
	searchBox,
	document.getElementById("bookmarks"),
);

function requestClearData() {
	const message = "确定要清空本插件保存的所有数据？\n 该过程不可恢复，并且会同步到所有设备";
	window.confirm(message) && clearAllData();
}

const settingEl2 = document.getElementById("setting-left");
const settingEl = document.getElementById("setting-right");

// 因为有内联 SVG 所以不方便写在 HTML 里。
const settingRight = document.createElement("template");
settingRight.innerHTML = `
	<button class="primary">${CheckIcon}确定</button>
	<button>添加网站</button>
	<button>导入常用网站</button>
	<button class="warning">清空存储</button>
`;

const settingLeft = document.createElement("template");
settingLeft.innerHTML = `
	<label>
		搜索建议防抖（毫秒）
		<input name="debounce" type="number">
	</label>
`;

function switchToSettingMode() {
	settingEl.innerHTML = "";
	settingEl2.innerHTML = "";

	const left = settingLeft.content.cloneNode(true);
	const input = left.querySelector("input[name='debounce']");
	input.value = searchBox.threshold;
	input.oninput = event => searchBox.threshold = event.target.valueAsNumber;

	const right = settingRight.content.cloneNode(true);
	right.children[0].onclick = exitSettingMode;
	right.children[1].onclick = startAddShortcut;
	right.children[2].onclick = startImportTopSites;
	right.children[3].onclick = requestClearData;

	settingEl2.append(left);
	settingEl.append(right);

	setShortcutEditable(true);
	document.body.classList.add("editing");
}

function exitSettingMode() {
	switchToNormalMode();
	saveConfig({ debounce: searchBox.threshold });
}

function switchToNormalMode() {
	settingEl.innerHTML = "";
	settingEl2.innerHTML = "";

	const button = document.createElement("button");
	button.innerHTML = SettingIcon;
	button.title = "进入设置模式";
	button.className = "icon";
	button.onclick = switchToSettingMode;
	settingEl.append(button);

	setShortcutEditable(false);
	document.body.classList.remove("editing");
}

switchToNormalMode();

loadConfig("debounce").then(v => {
	if(v.debounce) searchBox.threshold = v.debounce;
});
