import AddIcon from "@assets/Add.svg";
import CheckIcon from "@assets/Check.svg";
import styles from "./TopSiteDialog.css";

function adviceTitle(url) {
	const { hostname } = new URL(url);
	const parts = hostname.split(".");
	const top = parts.pop();
	return parts.length ? parts.pop() : top;
}

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	<dialog-base name="导入常用网站">
		<ul id="top-sites"></ul>
	</dialog-base>
`;

/**
 * browser.topSites 仅支持读取，而新标签页却需要自定义快捷方式，
 * 所以只能从 topSites 导入然后保存到本插件的存储。
 */
class TopSiteDialogElement extends HTMLElement {

	constructor() {
		super();
		const root = this.attachShadow({ mode: "closed" });
		root.append(template.content.cloneNode(true));

		this.dialogEl = root.querySelector("dialog-base");
		this.listEl = root.getElementById("top-sites");

		// 自定义的事件没法用 onXXX 啊……
		this.dialogEl.addEventListener("backdrop-click", () => {
			this.resolve();
			this.dialogEl.hide();
		});
		this.dialogEl.addEventListener("close", () => this.resolve());
	}

	async show() {
		const sites = await browser.topSites.get({
			newtab: true,
			includeFavicon: true,
		});
		const listItems = new Array(sites.length);

		for (let i = 0; i < sites.length; i++) {
			let { title, url, favicon } = sites[i];
			const item = listItems[i] = document.createElement("li");

			// 标题可能为空字符串，所以不能用 ??=
			url = decodeURI(url);
			title ||= adviceTitle(url);

			const imgEl = document.createElement("img");
			imgEl.alt = "favicon";
			imgEl.src = favicon;

			const titleEl = document.createElement("span");
			titleEl.textContent = title;

			const urlEl = document.createElement("span");
			urlEl.className = "url";
			urlEl.textContent = url;

			const button = document.createElement("button");
			button.className = "icon";
			button.type = "button";
			button.title = "添加该网站";
			button.innerHTML = AddIcon;

			button.onclick = () => {
				item.classList.add("added");
				button.innerHTML = CheckIcon;

				const init = {
					bubbles: true,
					detail: {
						url,
						label: title,
						favicon,
					},
				};
				this.dispatchEvent(new CustomEvent("add", init));
			};

			item.append(imgEl, titleEl, urlEl, button);
		}

		this.listEl.replaceChildren(...listItems);
		this.dialogEl.showModal();
		return new Promise(resolve => this.resolve = resolve);
	}
}

customElements.define("top-site-dialog", TopSiteDialogElement);
