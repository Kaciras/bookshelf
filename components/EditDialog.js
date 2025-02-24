import CheckIcon from "@tabler/icons/outline/check.svg";
import xIcon from "@tabler/icons/outline/x.svg";
import DownCircleIcon from "@tabler/icons/outline/circle-arrow-down.svg";
import { delegate, i18n, metaScraper } from "../share/index.js";
import defaultFavicon from "../assets/website.svg?url";
import "./TaskButton.js";
import styles from "./EditDialog.css";

const defaultData = {
	label: "",
	url: "",
	favicon: defaultFavicon,
};

function pick(source, target) {
	target.label = source.label;
	target.url = source.url;
	target.favicon = source.favicon;
}

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	<dialog-base name='${i18n("EditShortcutDialog")}'>
		<form>
			<div id='icon-group'>
				<div class='shortcut-icon'>
					<img id='favicon' alt='icon'>
				</div>
				<task-button id='fetch'>
					${DownCircleIcon}
					${i18n("Fetch")}
				</task-button>
			</div>
			<div id='field-group'>
				<label>
					${i18n("Name")}
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
		const root = this.attachShadow({ mode: "open" });
		root.append(template.content.cloneNode(true));

		this.dialogEl = root.querySelector("dialog-base");
		this.iconEl = root.getElementById("favicon");
		this.nameInput = root.querySelector("input[name='name']");
		this.urlInput = root.querySelector("input[name='url']");

		delegate(this, "label", this.nameInput, "value");
		delegate(this, "url", this.urlInput, "value");
		delegate(this, "favicon", this.iconEl, "src");

		root.getElementById("fetch").taskFn = this.fetchSiteMetadata.bind(this);

		this.handleActionClick = this.handleActionClick.bind(this);
		root.getElementById("cancel").onclick = this.handleActionClick;
		root.getElementById("accept").onclick = this.handleActionClick;
	}

	show(data = defaultData) {
		pick(data, this);
		this.dialogEl.showModal();
		this.nameInput.focus();
	}

	handleActionClick(event) {
		const { dialogEl, urlInput } = this;

		if (event.currentTarget.id !== "accept") {
			dialogEl.close();
		} else if (urlInput.form.reportValidity()) {
			dialogEl.close();
			const detail = {};
			pick(this, detail);
			this.dispatchEvent(new CustomEvent("change", { detail }));
		}
	}

	async fetchSiteMetadata(signal) {
		const { nameInput, urlInput } = this;
		if (!urlInput.reportValidity()) {
			return;
		}
		try {
			const scraper = await metaScraper(urlInput.value, signal);
			if (nameInput.value === "") {
				nameInput.value = scraper.doc.title;
			}
			URL.revokeObjectURL(this.favicon);
			this.favicon = await scraper.selectFavicon(48, signal);
		} catch (e) {
			console.error(e);
			window.alert(`Favicon download failed: ${e.message}`);
		}
	}
}

customElements.define("edit-dialog", EditDialogElement);
