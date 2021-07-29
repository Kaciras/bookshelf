import xIcon from "@assets/Close.svg";
import styles from "./index.css";

/**
 * 弹出文件选择框，在用户点确定之后 resolve。
 *
 * @param accept 文件类型
 * @param multiple 是否多选，如果为 true 返回文件列表，否则返回单个文件
 * @return 在用户点击确定时完成的 Promise
 */
export function openFile(accept, multiple = false) {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = accept;
	input.multiple = multiple;
	input.click();

	return new Promise(resolve => input.onchange = event => {
		const { files } = event.target;
		resolve(multiple ? files : files[0]);
	});
}

/**
 * 将 Blob 对象转为 base64 编码的 Data-URL 字符串。
 *
 * 【其他方案】
 * 如果可能，使用 URL.createObjectURL + URL.revokeObjectURL 性能更好。
 *
 * @param blob Blob对象
 * @return Data-URL 字符串
 */
export function blobToURL(blob) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = reject;
		reader.onloadend = () => resolve(reader.result);
		reader.readAsDataURL(blob);
	});
}

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
	<form id="dialog">
		<button id="close" type="button">${xIcon}</button>
		<h1>编辑快捷方式</h1>
		
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
`;

class EditDialogElement extends HTMLElement {

	constructor() {
		super();
		const root = this.attachShadow({ mode: "closed" });
		root.append(template.content.cloneNode(true));

		this.iconEl = root.getElementById("favicon");
		this.nameInput = root.querySelector("input[name='name']");
		this.urlInput = root.querySelector("input[name='url']");

		root.getElementById("cancel").addEventListener("click", this.handleResultButtonClick.bind(this));
		root.getElementById("accept").addEventListener("click", this.handleResultButtonClick.bind(this));
		root.getElementById("close").addEventListener("click", this.handleResultButtonClick.bind(this));

		root.getElementById("icon-box").addEventListener("click", this.selectFile.bind(this));
		root.getElementById("fetch").addEventListener("click", this.fetchFavicon.bind(this));
	}

	// 不能再构造方法里设置属性，否则会报错。
	connectedCallback() {
		this.style.display = "none";
	}

	show() {
		this.style.removeProperty("display");
		return new Promise(resolve => this.resolve = resolve);
	}

	handleResultButtonClick(event) {
		this.style.display = "none";
		this.resolve(event.target.id === "accept");
	}

	async selectFile() {
		const file = await openFile("image/*");
		this.iconEl.src = await blobToURL(file);
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
		this.iconEl.src = await blobToURL(await response.blob());
	}
}

customElements.define("edit-dialog", EditDialogElement);
