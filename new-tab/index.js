import "../components/BookMark.js";
import "../components/EngineSelect.js";
import "../components/SearchBox.js";
import SettingIcon from "@tabler/icons/settings.svg";
import { i18n } from "../share/index.js";
import { loadConfig } from "./storage.js";
import { loadSearchEngines, OpenSearchEngine } from "./search.js";
import { setShortcutEditable } from "./shortcuts.js";

const engineSelect = document.createElement("engine-select");
const searchBox = document.createElement("search-box");

document.title = i18n("NewTab");
// searchBox.engine = Google;

document.getElementById("engine-select").replaceWith(engineSelect);
document.getElementById("search-box").replaceWith(searchBox);

// engineSelect.list = [DuckDuckGo, Google, Baidu];
// engineSelect.value = searchBox.engine;
engineSelect.addEventListener("input", e => {
	searchBox.focus();
	searchBox.engine = e.target.value;
});

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

export function setSearchEngines(config) {
	const { defaultIndex, engines } = config;
	engineSelect.list = engines.map(e => Object.assign(Object.create(OpenSearchEngine.prototype), e));
	engineSelect.index = defaultIndex;
	searchBox.engine = engineSelect.list[defaultIndex];
}

function switchToNormalMode() {
	const button = document.createElement("button");
	button.innerHTML = SettingIcon;
	button.title = i18n("SettingMode");
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
setSearchEngines(await loadSearchEngines());
