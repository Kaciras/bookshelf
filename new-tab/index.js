import "../components/DialogBase.js";
import "../components/CheckBox.js";
import "../components/BookMark.js";
import "../components/EditDialog.js";
import "../components/TopSiteDialog.js";
import "../components/EngineSelect.js";
import "../components/SearchBox.js";
import { loadConfig } from "./storage.js";
import { Baidu, DuckDuckGo, Google } from "./search.js";
import { switchToNormalMode } from "./settings.js";

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

loadConfig(["threshold", "waitIME", "limit"]).then(v => Object.assign(searchBox, v));
switchToNormalMode();
