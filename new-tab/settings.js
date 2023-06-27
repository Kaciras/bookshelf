import CheckIcon from "@tabler/icons/check.svg";
import StarIcon from "@tabler/icons/star.svg";
import DevicesIcon from "@material-design-icons/svg/outlined/important_devices.svg";
import DownloadIcon from "@tabler/icons/download.svg";
import UploadIcon from "@tabler/icons/upload.svg";
import TrashIcon from "@tabler/icons/trash.svg";
import SearchIcon from "@tabler/icons/search.svg";
import AddIcon from "@tabler/icons/plus.svg";
import { isPointerInside, nthInChildren } from "@kaciras/utilities/browser";
import "../components/DialogBase.js";
import "../components/CheckBox.js";
import "../components/EditDialog.js";
import "../components/TopSiteDialog.js";
import "../components/SearchEngineDialog.js";
import { bindInput, i18n } from "../share/index.js";
import { appConfig, clearAllData, exportSettings, importSettings, saveConfig } from "./storage.js";
import * as iconCache from "./cache.js";
import { add, remove, setShortcutEditable, update } from "./shortcuts.js";
import { setSearchEngines } from "./index.js";
import { searchIcons } from "./search.js";

// @formatter:off
const engineSelect	= document.querySelector("engine-select");
const settingButton	= document.querySelector(".settings");
const menu			= document.getElementById("menu");
const shortcuts		= document.getElementById("shortcuts");
const topSiteDialog	= document.createElement("top-site-dialog");
const editDialog	= document.createElement("edit-dialog");
const enginesDialog	= document.createElement("search-engine-dialog");
// @formatter:on

document.body.append(topSiteDialog, editDialog, enginesDialog);

// Click outside to close the menu.
menu.onclick = e => {
	if (!isPointerInside(e)) menu.close();
};

shortcuts.addEventListener("edit", event => {
	const el = event.target;
	editDialog.index = nthInChildren(el);
	editDialog.show(el);
});

shortcuts.addEventListener("remove", remove);

editDialog.addEventListener("change", event => {
	const { target, detail } = event;
	const { index } = target;

	if (index === undefined) {
		return add(detail);
	} else {
		return update(index, detail);
	}
});

topSiteDialog.addEventListener("add", event => add(event.detail));

enginesDialog.addEventListener("change", async ({ detail }) => {
	const { engines } = detail;
	for (const engine of engines) {
		engine.iconKey = await searchIcons.save(engine.favicon);
		delete engine.favicon;
	}
	setSearchEngines(detail);
	saveConfig(detail).then(iconCache.evict);
});

const doneButton = document.createElement("button");
doneButton.innerHTML = `${CheckIcon}Done`;
doneButton.className = "settings icon primary";
doneButton.title = i18n("SettingMode");
doneButton.onclick = () => {
	doneButton.replaceWith(settingButton);
	setShortcutEditable(false);
	document.body.classList.remove("editing");
};

const addShortcut = document.getElementById("add-shortcut");
addShortcut.title = i18n("NewShortcut");
addShortcut.innerHTML = AddIcon;
addShortcut.onclick = () => {
	editDialog.show();
	editDialog.index = undefined;
};

function switchToEditingMode() {
	settingButton.replaceWith(doneButton);
	setShortcutEditable(true);
	menu.close();
	document.body.classList.add("editing");
}

function showSearchEngineDialog() {
	enginesDialog.show(engineSelect.list, appConfig.defaultEngine);
}

function requestClearData() {
	window.confirm(i18n("ConfirmClearData")) && clearAllData();
}

menu.innerHTML = `
	<div class='menu-group'>
		<button class='primary'>
			${CheckIcon}${i18n("Accept")}
		</button>
		<button>
			${SearchIcon}${i18n("SearchEngines")}
		</button>
		<button>
			${StarIcon}${i18n("ManageShortcuts")}
		</button>
		<button>
			${DevicesIcon}${i18n("TopSites")}
		</button>
		<button>
			${UploadIcon}${i18n("ImportData")}
		</button>
		<button>
			${DownloadIcon}${i18n("ExportData")}
		</button>
		<button class='warning'>
			${TrashIcon}${i18n("ClearData")}
		</button>
	</div>
	
	<h2>${i18n("SearchBox")}</h2>
	<div class='menu-group'>
		<label>
			${i18n("MaxSuggestions")}
			<input name='limit' type='number' min='0'>
		</label>
		<label>
			${i18n("Debounce")}
			<input name='threshold' type='number' min='0'>
		</label>
		<check-box title='${i18n("IMEDebounceTitle")}' name='waitIME'>
			${i18n("IMEDebounce")}
		</check-box>
	</div>
`;

/**
 * Enter setting mode, which will mount some components.
 *
 * @return {Promise<void>} Resolve when setting finished.
 */
export function switchToSettingMode() {
	menu.showModal();

	const searchBox = document.querySelector("search-box");
	bindInput(menu.querySelector("input[name='threshold']"), searchBox);
	bindInput(menu.querySelector("input[name='limit']"), searchBox);
	bindInput(menu.querySelector("check-box[name='waitIME']"), searchBox);

	const { children } = menu.firstChild;
	children[1].onclick = showSearchEngineDialog;
	children[2].onclick = switchToEditingMode;
	children[3].onclick = () => topSiteDialog.show();
	children[4].onclick = importSettings;
	children[5].onclick = exportSettings;
	children[6].onclick = requestClearData;

	children[0].onclick = () => {
		const { limit, waitIME, threshold } = searchBox;
		menu.close();
		return saveConfig({ searchBox: { limit, waitIME, threshold } });
	};
}
