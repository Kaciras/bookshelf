import "../components/BookMark.js";
import "../components/EngineSelect.js";
import "../components/SearchBox.js";
import SettingIcon from "@tabler/icons/settings.svg";
import { i18n } from "../share/index.js";
import { checkSync, loading, settings } from "./storage.js";
import * as iconCache from "./cache.js";
import { OpenSearchEngine } from "./search.js";
import { mountShortcuts, setShortcutEditable } from "./shortcuts.js";

const engineSelect = document.createElement("engine-select");
const searchBox = document.createElement("search-box");

document.title = i18n("NewTab");
document.getElementById("engine-select").replaceWith(engineSelect);
document.getElementById("search-box").replaceWith(searchBox);

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

const settingsButton = document.querySelector(".settings");
settingsButton.innerHTML = SettingIcon;
settingsButton.title = i18n("SettingMode");
settingsButton.onclick = () => import("./settings.js")
	.then(module => module.switchToSettingMode());

export async function setSearchEngines({ defaultIndex, engines }) {
	const list = new Array(engines.length);
	for (let i = 0; i < list.length; i++) {
		const value = Object.create(OpenSearchEngine.prototype);
		list[i] = Object.assign(value, engines[i]);
		value.favicon = await iconCache.load(value.favicon);
	}
	engineSelect.list = list;
	engineSelect.index = defaultIndex;
	searchBox.engine = engineSelect.value;
}

export function switchToNormalMode() {
	setShortcutEditable(false);
}

switchToNormalMode();

await loading;

searchBox.threshold = settings.threshold;
searchBox.limit = settings.limit;
searchBox.waitIME = settings.waitIME;

mountShortcuts(settings.shortcuts);
await setSearchEngines(settings);
requestIdleCallback(() => checkSync(iconCache.evict));
