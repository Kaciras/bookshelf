import WebsiteIcon from "@assets/Website.svg?url";
import { delegate, getFaviconUrl, imageUrlToLocal } from "@share";
import "./TaskButton.js";
import styles from "./EditDialog.css";

const defaultData = {
	iconUrl: null,
	label: "",
	url: "",
	favicon: WebsiteIcon,
};

function pick(source, target) {
	target.url = source.url;
	target.favicon = source.favicon;
	target.label = source.label;
	target.iconUrl = source.iconUrl;
}

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	<dialog-base name="编辑快捷方式">
		<form>
			<div id="icon-group">
				<div id="icon-box">
					<img id="favicon" alt="icon">
				</div>
				<task-button id="fetch">自动获取</task-button>
			</div>
			<div id="field-group">
				<label>
					名字（标题）
					<input name="name" placeholder="某某小站" required>
				</label>
				<label>
					地址（URL）
					<input name="url" type="url" required>
				</label>
			</div>
			<div id="actions">
				<button id="cancel" type="button">取消</button>
				<button id="accept" class="primary" type="button">确定</button>
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
			dialogEl.hide();
		} else if (urlInput.form.reportValidity()) {
			dialogEl.hide();
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
			this.iconUrl = href;
			this.favicon = await imageUrlToLocal(href);
		} catch (e) {
			window.alert(`图标下载失败：${e.message}`);
		}
	}
}

customElements.define("edit-dialog", EditDialogElement);
