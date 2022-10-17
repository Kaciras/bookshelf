import CheckIcon from "@tabler/icons/check.svg";
import xIcon from "@tabler/icons/x.svg";
import DownCircleIcon from "@tabler/icons/arrow-down-circle.svg";
import { delegate, getFaviconUrl, i18n } from "@share";
import { defaultFavicon } from "../new-tab/storage.js";
import "./TaskButton.js";
import styles from "./EditDialog.css";

const defaultData = {
	label: "",
	url: "",

	/**
	 * 图标下载到本地后引用的 URL，也可能是缓存中取出的。
	 * 该属性是由 iconUrl 生成的。
	 */
	icon: defaultFavicon,

	favicon: defaultFavicon,
};

function pick(source, target) {
	target.label = source.label;
	target.url = source.url;
	target.icon = source.icon;
	target.favicon = source.favicon;
}

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	<dialog-base name='${i18n("EditShortcutDialog")}'>
		<form>
			<div id='icon-group'>
				<div id='icon-box'>
					<img id='favicon' alt='icon'>
				</div>
				<task-button id='fetch'>
					${DownCircleIcon}
					${i18n("DownloadFavicon")}
				</task-button>
			</div>
			<div id='field-group'>
				<label>
					${i18n("ShortcutName")}
					<input 
						name='name'
						required
					>
				</label>
				<label>
					${i18n("ShortcutURL")}
					<input 
						name='url' 
						type='url'
						required
					>
				</label>
			</div>
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
	</dialog-base>
`;

class EditDialogElement extends HTMLElement {

	constructor() {
		super();
		const root = this.attachShadow({ mode: "closed" });
		root.append(template.content.cloneNode(true));

		this.dialogEl = root.querySelector("dialog-base");
		this.iconEl = root.getElementById("favicon");
		this.nameInput = root.querySelector("input[name='name']");
		this.urlInput = root.querySelector("input[name='url']");
		this.fetchButton = root.getElementById("fetch");

		delegate(this, "label", this.nameInput, "value");
		delegate(this, "url", this.urlInput, "value");
		delegate(this, "favicon", this.iconEl, "src");

		this.fetchButton.taskFn = this.fetchFavicon.bind(this);

		this.handleActionClick = this.handleActionClick.bind(this);
		root.getElementById("cancel").onclick = this.handleActionClick;
		root.getElementById("accept").onclick = this.handleActionClick;
	}

	// 不要使用 Object.assign 因为参数可能含有额外的字段。
	show(data = defaultData) {
		pick(data, this);
		this.dialogEl.showModal();
		this.nameInput.focus();
	}

	// 把要传递的属性挑出来，以便调用方解构。
	handleActionClick(event) {
		const { dialogEl, urlInput } = this;

		if (event.target.id !== "accept") {
			dialogEl.close();
		} else if (urlInput.form.reportValidity()) {
			dialogEl.close();
			const detail = {};
			pick(this, detail);
			this.dispatchEvent(new CustomEvent("change", { detail }));
		}
	}

	async fetchFavicon(signal) {
		if (!this.urlInput.reportValidity()) {
			return;
		}
		const url = this.urlInput.value;

		try {
			const href = await getFaviconUrl(url, signal);
			const res = await fetch(href, { mode: "no-cors" });

			URL.revokeObjectURL(this.favicon);
			this.icon = res.clone();
			this.favicon = URL.createObjectURL(await res.blob());
		} catch (e) {
			console.error(e);
			window.alert(`Favicon download failed: ${e.message}`);
		}
	}
}

customElements.define("edit-dialog", EditDialogElement);
