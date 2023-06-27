import SearchIconURL from "@tabler/icons/search.svg?url";
import AddIcon from "@tabler/icons/plus.svg";
import xIcon from "@tabler/icons/x.svg";
import PhotoIcon from "@tabler/icons/photo-plus.svg";
import DownCircleIcon from "@tabler/icons/circle-arrow-down.svg";
import CheckIcon from "@tabler/icons/check.svg";
import { dragSortContext, nthInChildren, selectFile } from "@kaciras/utilities/browser";
import "./TaskButton.js";
import { getFaviconUrl, i18n } from "../share/index.js";
import styles from "./SearchEngineDialog.css";

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	<dialog-base name='${i18n("SearchEngines")}'>
		<div>
			<section>
				<button
					id='new-engine'
					class='plain'
					title='${i18n("Add")}'
				>
					${AddIcon}
				</button>
			</section>
			
			<form>
				${i18n("Name")}:
				<div class='group'>
					<input
						name='name'
						required
						placeholder='${i18n("Name")}'
					>
					<check-box name='isDefault'>
						${i18n("Default")}
					</check-box>
				</div>
				
				${i18n("Icon")}:
				<div class='group'>
					<img alt='icon'>
					<task-button
						type='button'
						id='download'
					>
						${DownCircleIcon}
						${i18n("DownloadFavicon")}
					</task-button>
					<button
						type='button'
						id='file'
					>
						${PhotoIcon}
						${i18n("SelectFile")}
					</button>
				</div>
				
				<textarea
					name='searchAPI'
					required
					placeholder='${i18n("SearchAPI")}'
				/>
				<textarea
					name='suggestAPI'
					placeholder='${i18n("SuggestAPI")}'
				/>
				
				<div id='actions'>
					<button
						id='cancel'
						type='button'
					>
						${xIcon}
						${i18n("Cancel")}
					</button>
					<button
						id='accept'
						class='primary'
						type='button'
					>
						${CheckIcon}
						${i18n("Accept")}
					</button>
				</div>
			</form>
		</div>
	</dialog-base>
`;

const itemTemplate = document.createElement("template");
itemTemplate.innerHTML = `
	<a class='plain button' draggable='true' href='#'>
		<img alt='icon'>
		<span class='one-line'/>
		<button
			class='plain'
			title='${i18n("Delete")}'
		 >
			${xIcon}
		</button>
	</a>
`;

const dragSort = dragSortContext();

const kData = Symbol();

const defaultData = {
	name: "New Search",
	favicon: SearchIconURL,
	searchAPI: null,
	suggestAPI: null,
};

class SearchEngineDialogElement extends HTMLElement {

	defaultTab;		// Tab element of the default engine.
	current;		// Current active tab element.

	constructor() {
		super();
		const root = this.attachShadow({ mode: "open" });
		root.append(template.content.cloneNode(true));

		this.dialogEl = root.querySelector("dialog-base");
		this.listEl = root.querySelector("section");
		this.addEl = root.getElementById("new-engine");

		this.iconEl = root.querySelector("img");
		this.nameEl = root.querySelector("input[name='name']");
		this.defaultEl = root.querySelector("check-box");
		this.searchEl = root.querySelector("textarea[name='searchAPI']");
		this.suggestEl = root.querySelector("textarea[name='suggestAPI']");

		const handleInput = this.handleInput.bind(this);
		this.nameEl.oninput = handleInput;
		this.searchEl.oninput = handleInput;
		this.suggestEl.oninput = handleInput;

		this.defaultEl.oninput = this.changeDefault.bind(this);
		this.addEl.onclick = () => this.AddTab(defaultData);

		this.handleActionClick = this.handleActionClick.bind(this);
		this.handleRemove = this.handleRemove.bind(this);
		this.handleTabChange = this.handleTabChange.bind(this);

		root.getElementById("download").taskFn = this.fetchFavicon.bind(this);
		root.getElementById("file").onclick = this.uploadIcon.bind(this);
		root.getElementById("cancel").onclick = this.handleActionClick;
		root.getElementById("accept").onclick = this.handleActionClick;
	}

	show(engines, defaultEngine) {
		const { listEl } = this;

		listEl.replaceChildren(listEl.lastChild);
		for (const e of engines) {
			this.AddTab(e);
		}
		this.defaultTab = listEl.children[defaultEngine];
		this.dialogEl.showModal();
	}

	AddTab(engine) {
		const li = itemTemplate.content.cloneNode(true).firstChild;
		li[kData] = structuredClone(engine);
		li.querySelector("img").src = engine.favicon;
		li.querySelector("span").textContent = engine.name;

		dragSort.register(li);
		this.listEl.insertBefore(li, this.addEl);
		this.switchTab(li);

		li.onclick = this.handleTabChange;
		li.querySelector("button").onclick = this.handleRemove;
	}

	handleTabChange(event) {
		const { currentTarget } = event;
		if (currentTarget !== this.current) {
			this.switchTab(currentTarget);
		}
	}

	handleRemove(event) {
		const tab = event.currentTarget.parentNode;
		event.stopPropagation();

		if (tab.parentNode.children.length === 2) {
			return alert(i18n("RequireSearchEngine"));
		}
		this.switchTab(tab.previousSibling ?? tab.nextSibling);
		tab.remove();
	}

	handleInput({ currentTarget }) {
		const { name, value } = currentTarget;
		this.current[kData][name] = value;

		if (name === "name") {
			this.current.querySelector("span").textContent = value;
		}
	}

	async fetchFavicon(signal) {
		if (!this.searchEl.reportValidity()) {
			return;
		}
		const url = this.searchEl.value;

		try {
			this.changeIcon(await getFaviconUrl(48, url, signal));
		} catch (e) {
			console.error(e);
			window.alert(`Favicon download failed: ${e.message}`);
		}
	}

	async uploadIcon() {
		const [file] = await selectFile("image/*");
		this.changeIcon(URL.createObjectURL(file));
	}

	changeIcon(value) {
		URL.revokeObjectURL(this.iconEl.src);
		this.current[kData].favicon = value;
		this.iconEl.src = value;
		this.current.querySelector("img").src = value;
	}

	changeDefault(event) {
		if (this.defaultEl.checked) {
			return event.preventDefault();
		}
		this.defaultTab = this.current;
	}

	switchTab(li) {
		this.current?.classList.remove("active");
		this.current = li;
		li.classList.add("active");

		const data = li[kData];
		this.defaultEl.checked = this.defaultTab === li;
		this.iconEl.src = data.favicon;
		this.nameEl.value = data.name;
		this.searchEl.value = data.searchAPI;
		this.suggestEl.value = data.suggestAPI;
	}

	handleActionClick(event) {
		const { listEl, defaultTab, dialogEl } = this;
		dialogEl.close();

		if (event.currentTarget.id === "cancel") {
			return;
		}

		const detail = {
			engines: Array.from(listEl.children).slice(0, -1).map(el => el[kData]),
			defaultEngine: nthInChildren(defaultTab),
		};
		this.dispatchEvent(new CustomEvent("change", { detail }));
	}
}

customElements.define("search-engine-dialog", SearchEngineDialogElement);
