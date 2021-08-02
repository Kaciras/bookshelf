import { blobToURL, delegate, openFile } from "@share";
import styles from "./index.css";

/**
 * 获取网页中所有包含图标的 <link> 元素。
 *
 * Firefox 的实现挺复杂而且用得 C艹：
 * https://github.com/mozilla/gecko-dev/blob/master/toolkit/components/places/FaviconHelpers.cpp
 *
 * @param url 页面的 URL
 * @param signal AbortSignal 取消加载页面
 * @return <link> 元素列表
 */
async function getFavicons(url, signal) {
	const response = await fetch(url, { mode: "no-cors", signal });
	if (!response.ok) {
		throw new Error(`Request is not OK (status = ${response.status})`);
	}
	const parser = new DOMParser();
	const doc = parser.parseFromString(await response.text(), "text/html");
	const links = doc.head.getElementsByTagName("link");

	return Array.from(links)
		.filter(({ rel }) => rel === "icon" || rel === "shortcut icon");
}

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	<dialog-base name="编辑快捷方式">
		<form>
			<div id="icon-group">
				<div id="icon-box" title="选择图标">
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
				<button id="accept" type="button">确定</button>
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

		delegate(this, "label", this.nameInput, "value");
		delegate(this, "url", this.urlInput, "value");
		delegate(this, "favicon", this.iconEl, "src");

		this.handleActionClick = this.handleActionClick.bind(this);

		root.getElementById("cancel").onclick = this.handleActionClick;
		root.getElementById("accept").onclick = this.handleActionClick;

		root.getElementById("fetch").onclick = this.fetchFavicon.bind(this);
		root.getElementById("icon-box").onclick = this.selectFile.bind(this);
	}

	show() {
		this.dialogEl.showModal();
		return new Promise(resolve => this.resolve = resolve);
	}

	handleActionClick(event) {
		this.dialogEl.hide();
		this.resolve(event.target.id === "accept");
	}

	async selectFile() {
		const file = await openFile("image/*");
		this.url = await blobToURL(file);
	}

	async fetchFavicon() {
		if (!this.urlInput.checkValidity()) {
			return alert("地址的格式错误！");
		}
		const url = this.urlInput.value;
		const links = await getFavicons(url);

		let href = "/favicon.ico";
		if (links.length > 0) {
			// 不能直接 .href 因为它会转成完整的 URL
			href = links[0].getAttribute("href");
		}
		href = new URL(href, url).toString();

		const response = await fetch(href, { mode: "no-cors" });
		this.url = await blobToURL(await response.blob());
	}
}

customElements.define("edit-dialog", EditDialogElement);
