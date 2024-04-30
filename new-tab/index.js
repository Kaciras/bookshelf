import SettingIcon from "@tabler/icons/outline/settings.svg";
import "../components/BookMark.js";
import "../components/EngineSelect.js";
import "../components/SearchBox.js";
import { i18n } from "../share/index.js";
import { loadingAppConfig } from "./storage.js";
import * as iconCache from "./cache.js";
import * as shortcuts from "./shortcuts.js";
import { OpenSearchEngine, searchIcons } from "./search.js";

/*
 * Features are currently not available:
 * 1) Autofocus on page load. Browsers are focus on address box when open a new-tab page,
 *    and ignore `focus()` calls.
 * 2) Display latest visited site as shortcuts. Web extension API does not provide a way
 *    to retrieve cache favicon of history items.
 */

const engineSelect = document.createElement("engine-select");
const searchBox = document.createElement("search-box");

document.title = i18n("NewTab");
document.getElementById("engine-select").replaceWith(engineSelect);
document.getElementById("search-box").replaceWith(searchBox);

engineSelect.oninput = e => {
	searchBox.focus();
	searchBox.engine = e.target.value;
};

engineSelect.ondblclick = () => {
	searchBox.search();
};

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

export async function setSearchEngines({ defaultEngine, engines }) {
	const tasks = new Array(engines.length);
	const list = new Array(engines.length);

	for (let i = 0; i < list.length; i++) {
		const value = list[i] = new OpenSearchEngine(engines[i]);
		tasks[i] = searchIcons.populate(value);
	}

	await Promise.all(tasks);
	engineSelect.list = list;
	engineSelect.index = defaultEngine;
	searchBox.engine = engineSelect.value;
}

const appConfig = await loadingAppConfig;
shortcuts.mount(appConfig.shortcuts);
setSearchEngines(appConfig);
Object.assign(searchBox, appConfig.searchBox);

requestIdleCallback(iconCache.removeUnused);
