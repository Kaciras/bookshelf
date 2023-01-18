import CheckIcon from "@tabler/icons/check.svg";
import StarIcon from "@tabler/icons/star.svg";
import DevicesIcon from "@material-design-icons/svg/outlined/important_devices.svg";
import DownloadIcon from "@tabler/icons/download.svg";
import UploadIcon from "@tabler/icons/upload.svg";
import TrashIcon from "@tabler/icons/trash.svg";
import SearchIcon from "@tabler/icons/search.svg";
import "../components/DialogBase.js";
import "../components/CheckBox.js";
import "../components/EditDialog.js";
import "../components/TopSiteDialog.js";
import "../components/SearchEngineDialog.js";
import { bindInput, i18n, indexInParent } from "../share/index.js";
import { clearAllData, exportSettings, importSettings, saveConfig } from "./storage.js";
import * as iconCache from "./cache.js";
import { add, remove, setShortcutEditable, update } from "./shortcuts.js";
import { setSearchEngines } from "./index.js";

const container = document.getElementById("shortcuts");
const engineSelect = document.querySelector("engine-select");

const importDialog = document.createElement("top-site-dialog");
const editDialog = document.createElement("edit-dialog");
const searchEngineDialog = document.createElement("search-engine-dialog");

document.body.append(importDialog, editDialog, searchEngineDialog);

container.addEventListener("edit", event => {
	const el = event.target;
	editDialog.index = indexInParent(el);
	editDialog.show(el);
});

container.addEventListener("remove", remove);

editDialog.addEventListener("change", event => {
	const { target, detail } = event;
	const { index } = target;

	if (index === undefined) {
		return add(detail);
	} else {
		return update(index, detail);
	}
});

importDialog.addEventListener("add", event => add(event.detail));

searchEngineDialog.addEventListener("change", async ({ detail }) => {
	const { engines } = detail;
	for (const engine of engines) {
		engine.favicon = await iconCache.save(engine.favicon);
	}
	return Promise.all([saveConfig(detail), setSearchEngines(detail)]);
});

function showSearchEngineDialog() {
	searchEngineDialog.show(engineSelect.list, engineSelect.defaultIndex ?? 1);
}

export function startAddShortcut() {
	editDialog.show();
	editDialog.index = undefined;
}

export function startImportTopSites() {
	importDialog.show();
}

function requestClearData() {
	window.confirm(i18n("ConfirmClearData")) && clearAllData();
}

const template = document.createElement("template");
template.innerHTML = `
	<div class='menu-group'>
		<button class='primary'>
			${CheckIcon}${i18n("Accept")}
		</button>
		<button>
			${SearchIcon}${i18n("SearchEngines")}
		</button>
		<button>
			${StarIcon}${i18n("AddShortcut")}
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
	const left = document.getElementById("menu");

	// Does not work if put replaceChildren() to the end.
	left.replaceChildren(template.content.cloneNode(true));
	left.open = true;

	setShortcutEditable(true);

	const searchBox = document.querySelector("search-box");
	bindInput(left.querySelector("input[name='threshold']"), searchBox);
	bindInput(left.querySelector("input[name='limit']"), searchBox);
	bindInput(left.querySelector("check-box[name='waitIME']"), searchBox);

	const { children } = left.firstChild;
	children[1].onclick = showSearchEngineDialog;
	children[2].onclick = startAddShortcut;
	children[3].onclick = startImportTopSites;
	children[4].onclick = importSettings;
	children[5].onclick = exportSettings;
	children[6].onclick = requestClearData;

	return new Promise(resolve => children[0].onclick = () => {
		const searchBox = document.querySelector("search-box");
		left.open = false;
		resolve();
		return saveConfig(searchBox, ["threshold", "waitIME", "limit"]);
	});
}
