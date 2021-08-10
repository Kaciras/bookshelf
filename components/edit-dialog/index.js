import WebsiteIcon from "@assets/Website.svg?url";
import { delegate, getFaviconUrl, imageUrlToLocal } from "@share";
import styles from "./index.css";

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	<dialog-base name="编辑快捷方式">
		<form>
			<div id="icon-group">
				<div id="icon-box">
					<img id="favicon" alt="icon" src>
				</div>
				<button id="fetch" type="button">自动获取</button>
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

const loadingHTML = "<span class='dot-flashing'><div class='middle'></div></span>";

class EditDialogElement extends HTMLElement {

	constructor() {
		super();
		const root = this.attachShadow({ mode: "closed" });
		root.append(template.content.cloneNode(true));

		this.dialogEl = root.querySelector("dialog-base");
		this.iconEl = root.getElementById("favicon");
		this.nameInput = root.querySelector("input[name='name']");
		this.urlInput = root.querySelector("input[name='url']");
		this.fetchBtn = root.getElementById("fetch");

		delegate(this, "label", this.nameInput, "value");
		delegate(this, "url", this.urlInput, "value");
		delegate(this, "favicon", this.iconEl, "src");

		this.fetchBtn.onclick = this.fetchFavicon.bind(this);
		this.fetchBtn.innerHTML = loadingHTML;

		this.handleActionClick = this.handleActionClick.bind(this);
		root.getElementById("cancel").onclick = this.handleActionClick;
		root.getElementById("accept").onclick = this.handleActionClick;
	}

	reset() {
		this.label = "";
		this.url = "";
		this.favicon = WebsiteIcon;
	}

	show() {
		this.dialogEl.showModal();
		return new Promise(resolve => this.resolve = resolve);
	}

	handleActionClick(event) {
		this.dialogEl.hide();
		this.resolve(event.target.id === "accept");
	}

	async fetchFavicon() {
		if (!this.urlInput.checkValidity()) {
			return alert("地址的格式错误！");
		}
		this.fetchBtn.innerHTML = loadingHTML;
		const url = this.urlInput.value;

		try {
			const href = await getFaviconUrl(url);
			this.favicon = await imageUrlToLocal(href);
		} catch (e) {
			alert(e.message);
		} finally {
			this.fetchBtn.textContent = "自动获取";
		}
	}
}

customElements.define("edit-dialog", EditDialogElement);
