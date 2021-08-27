import "../components/DialogBase.js";
import "../components/CheckBox.js";
import "../components/BookMark.js";
import "../components/EditDialog.js";
import "../components/TopSiteDialog.js";
import "../components/SearchBox.js";
import SettingIcon from "@assets/Setting.svg";
import CheckIcon from "@assets/Check.svg";
import { setShortcutEditable, startAddShortcut, startImportTopSites } from "./shortcuts";
import { clearAllData, loadConfig, saveConfig } from "./storage";

const searchBox = document.createElement("search-box");

// module js 自带 defer 属性，所以没法在 html 里使用自定义元素
document.getElementsByTagName("main")[0].insertBefore(
	searchBox,
	document.getElementById("shortcuts"),
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
		<input name="threshold" type="number">
	</label>
	<check-box id="ime">启用输入法防抖</check-box>
`;

function switchToSettingMode() {
	const left = settingLeft.content.cloneNode(true);

	// template 中从 HTML 解析的自定义元素没有关联到实现，必须先挂载。
	settingEl2.replaceChildren(left);

	const input = settingEl2.querySelector("input[name='threshold']");
	input.value = searchBox.threshold;
	input.oninput = event => searchBox.threshold = event.target.valueAsNumber;

	const ime = settingEl2.querySelector("#ime");
	ime.checked = searchBox.waitIME;
	ime.addEventListener("change", event => searchBox.waitIME = event.detail.checked);

	const right = settingRight.content.cloneNode(true);
	right.children[0].onclick = exitSettingMode;
	right.children[1].onclick = startAddShortcut;
	right.children[2].onclick = startImportTopSites;
	right.children[3].onclick = requestClearData;

	settingEl.replaceChildren(right);

	setShortcutEditable(true);
	document.body.classList.add("editing");
}

function exitSettingMode() {
	switchToNormalMode();
	return saveConfig(searchBox, ["threshold", "waitIME"]);
}

function switchToNormalMode() {
	const button = document.createElement("button");
	button.innerHTML = SettingIcon;
	button.title = "进入设置模式";
	button.className = "icon";
	button.onclick = switchToSettingMode;

	settingEl.replaceChildren(button);
	settingEl2.replaceChildren();

	setShortcutEditable(false);
	document.body.classList.remove("editing");
}

switchToNormalMode();

loadConfig(["threshold", "waitIME"]).then(v => Object.assign(searchBox, v));
