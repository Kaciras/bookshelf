import "../components/BookMark.js";
import "../components/EngineSelect.js";
import "../components/SearchBox.js";
import SettingIcon from "@assets/Setting.svg";
import { loadConfig } from "./storage.js";
import { Baidu, DuckDuckGo, Google } from "./search.js";
import { setShortcutEditable } from "./shortcuts.js";

const searchBox = document.createElement("search-box");
searchBox.engine = Google;

// module js 自带 defer 属性，没法在 html 解析前注册自定义元素，真脑残。
document.body.insertBefore(
	searchBox,
	document.getElementById("shortcuts"),
);

const engineSelect = document.createElement("engine-select");

// 主用 Google 放中间，次要的百度放后面，按一次 PageDown 即可切换到。
engineSelect.list = [DuckDuckGo, Google, Baidu];
engineSelect.value = searchBox.engine;
engineSelect.addEventListener("input", e => searchBox.engine = e.target.value);
document.body.append(engineSelect);

searchBox.onkeydown = e => {
	switch (e.key) {
		case "PageUp":
			engineSelect.index -= 1;
			break;
		case "PageDown":
			engineSelect.index += 1;
			break;
		default:
			return;
	}
	e.preventDefault();
	searchBox.engine = engineSelect.value;
};

function switchToNormalMode() {
	const button = document.createElement("button");
	button.innerHTML = SettingIcon;
	button.title = "进入设置模式";
	button.className = "icon";
	button.onclick = () => import("./settings.js")
		.then(module => module.switchToSettingMode())
		.then(switchToNormalMode);

	document.getElementById("setting-left").replaceChildren();
	document.getElementById("setting-right").replaceChildren(button);

	setShortcutEditable(false);
	document.body.classList.remove("editing");
}

switchToNormalMode();

Object.assign(searchBox, await loadConfig(["threshold", "waitIME", "limit"]));
