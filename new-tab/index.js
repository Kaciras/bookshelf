import "../components/DialogBase.js";
import "../components/CheckBox.js";
import "../components/BookMark.js";
import "../components/EditDialog.js";
import "../components/TopSiteDialog.js";
import "../components/EngineSelect.js";
import "../components/SearchBox.js";
import SettingIcon from "@assets/Setting.svg";
import CheckIcon from "@assets/Check.svg";
import { bindInput } from "@share";
import { setShortcutEditable, startAddShortcut, startImportTopSites } from "./shortcuts";
import { clearAllData, exportSettings, importSettings, loadConfig, saveConfig } from "./storage";
import { Baidu, DuckDuckGo, Google } from "./search.js";

const searchBox = document.createElement("search-box");
searchBox.engine = Google;

// module js 自带 defer 属性，没法在 html 解析前注册自定义元素，真脑残。
document.body.insertBefore(
	searchBox,
	document.getElementById("shortcuts"),
);

const engineSelect = document.createElement("engine-select");
engineSelect.list = [Google, Baidu, DuckDuckGo];
engineSelect.value = searchBox.engine;
engineSelect.addEventListener("change", e => searchBox.engine = e.target.engine);
document.body.append(engineSelect);

function requestClearData() {
	const message = "确定要清空本插件保存的所有数据？\n该过程不可撤销，并且会同步到所有设备";
	window.confirm(message) && clearAllData();
}

const left = document.getElementById("setting-left");
const right = document.getElementById("setting-right");

// 因为有内联 SVG 所以没法写在 index.html 里。
const rightTemplate = document.createElement("template");
rightTemplate.innerHTML = `
	<button class="primary">
		${CheckIcon}
		<span>确定</span>
	</button>
	<button>添加网站</button>
	<button>导入常用网站</button>
	<button>导入数据</button>
	<button>导出数据</button>
	<button class="warning">清空存储</button>
`;

const leftTemplate = document.createElement("template");
leftTemplate.innerHTML = `
	<label>
		最大建议数量
		<input name="limit" type="number" min="0">
	</label>
	<label>
		搜索建议防抖（毫秒）
		<input name="threshold" type="number" min="0">
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
	right.children[3].onclick = importSettings;
	right.children[4].onclick = exportSettings;
	right.children[5].onclick = requestClearData;
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

/**
 * 退出设置模式时除了切换到通常模式，还要把设置保存下来。
 */
function exitSettingMode() {
	switchToNormalMode();
	return saveConfig(searchBox, ["threshold", "waitIME", "limit"]);
}

loadConfig(["threshold", "waitIME", "limit"]).then(v => Object.assign(searchBox, v));
switchToNormalMode();
