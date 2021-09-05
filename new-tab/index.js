import "../components/DialogBase.js";
import "../components/CheckBox.js";
import "../components/BookMark.js";
import "../components/EditDialog.js";
import "../components/TopSiteDialog.js";
import "../components/SearchBox.js";
import SettingIcon from "@assets/Setting.svg";
import CheckIcon from "@assets/Check.svg";
import { bindInput } from "@share";
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

const left = document.getElementById("setting-left");
const right = document.getElementById("setting-right");

// 因为有内联 SVG 所以不方便写在 index.html 里。
const rightTemplate = document.createElement("template");
rightTemplate.innerHTML = `
	<button class="primary">${CheckIcon}确定</button>
	<button>添加网站</button>
	<button>导入常用网站</button>
	<button class="warning">清空存储</button>
`;

const leftTemplate = document.createElement("template");
leftTemplate.innerHTML = `
	<label>
		最大建议数量
		<input name="limit" type="number">
	</label>
	<label>
		搜索建议防抖（毫秒）
		<input name="threshold" type="number">
	</label>
	<check-box name="waitIME">输入法防抖</check-box>
`;

function switchToSettingMode() {
	// template 中从 HTML 解析的自定义元素没有关联到实现，必须先挂载。
	left.replaceChildren(leftTemplate.content.cloneNode(true));
	right.replaceChildren(rightTemplate.content.cloneNode(true));

	setShortcutEditable(true);
	document.body.classList.add("editing");

	bindInput(left.querySelector("input[name='threshold']"), searchBox);
	bindInput(left.querySelector("input[name='limit']"), searchBox);
	bindInput(left.querySelector("check-box[name='waitIME']"), searchBox);

	right.children[0].onclick = exitSettingMode;
	right.children[1].onclick = startAddShortcut;
	right.children[2].onclick = startImportTopSites;
	right.children[3].onclick = requestClearData;
}

function exitSettingMode() {
	switchToNormalMode();
	return saveConfig(searchBox, ["threshold", "waitIME", "limit"]);
}

function switchToNormalMode() {
	const button = document.createElement("button");
	button.innerHTML = SettingIcon;
	button.title = "进入设置模式";
	button.className = "icon";
	button.onclick = switchToSettingMode;

	left.replaceChildren();
	right.replaceChildren(button);

	setShortcutEditable(false);
	document.body.classList.remove("editing");
}

switchToNormalMode();

loadConfig(["threshold", "waitIME", "limit"]).then(v => Object.assign(searchBox, v));
