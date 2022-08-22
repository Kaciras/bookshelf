import CheckIcon from "@tabler/icons/check.svg";
import StarIcon from "@tabler/icons/star.svg";
import DevicesIcon from "@material-design-icons/svg/outlined/important_devices.svg";
import DownloadIcon from "@tabler/icons/download.svg";
import UploadIcon from "@tabler/icons/upload.svg";
import TrashIcon from "@tabler/icons/trash.svg";
import "../components/DialogBase.js";
import "../components/CheckBox.js";
import "../components/EditDialog.js";
import "../components/TopSiteDialog.js";
import { bindInput, i18n, indexInParent } from "@share";
import { clearAllData, exportSettings, importSettings, saveConfig } from "./storage.js";
import { add, remove, setShortcutEditable, update } from "./shortcuts.js";

const container = document.getElementById("shortcuts");
const importDialog = document.createElement("top-site-dialog");
const editDialog = document.createElement("edit-dialog");

document.body.append(importDialog, editDialog);

/**
 * 快捷方式右上角的编辑按钮被点击时调用。
 *
 * 【注意】
 * 这里用索引来记录当前编辑的对象，需要保证编辑时 shortcuts 里的顺序不变。
 *
 * @param event BookMark 元素的 edit 事件
 */
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

// 因为有内联 SVG 所以没法写在 index.html 里。
const rightTemplate = document.createElement("template");
rightTemplate.innerHTML = `
	<button class='primary'>
		${CheckIcon}${i18n("Accept")}
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
`;

const leftTemplate = document.createElement("template");
leftTemplate.innerHTML = `
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
`;

/**
 * 切换到设置模式，这将修改部分元素的内容，挂载上选项组件。
 *
 * @return {Promise<void>} 点击确定按钮后 resolve，退出设置模式。
 */
export function switchToSettingMode() {
	const left = document.getElementById("setting-left");
	const right = document.getElementById("setting-right");

	// template 中从 HTML 解析的自定义元素没有关联到实现，必须先挂载。
	left.replaceChildren(leftTemplate.content.cloneNode(true));
	right.replaceChildren(rightTemplate.content.cloneNode(true));

	setShortcutEditable(true);
	document.body.classList.add("editing");

	const searchBox = document.querySelector("search-box");
	bindInput(left.querySelector("input[name='threshold']"), searchBox);
	bindInput(left.querySelector("input[name='limit']"), searchBox);
	bindInput(left.querySelector("check-box[name='waitIME']"), searchBox);

	right.children[1].onclick = startAddShortcut;
	right.children[2].onclick = startImportTopSites;
	right.children[3].onclick = importSettings;
	right.children[4].onclick = exportSettings;
	right.children[5].onclick = requestClearData;

	// 退出设置模式时除了切换到通常模式，还要把设置保存下来。
	return new Promise(resolve => right.children[0].onclick = () => {
		const searchBox = document.querySelector("search-box");
		resolve();
		return saveConfig(searchBox, ["threshold", "waitIME", "limit"]);
	});
}
