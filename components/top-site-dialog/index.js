import AddIcon from "@assets/Add.svg";
import styles from "./index.css";

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	<dialog-base name="导入常用网站">
		<ul id="top-sites"></ul>
	</dialog-base>
`;

class TopSiteDialogElement extends HTMLElement {

	constructor() {
		super();
		const root = this.attachShadow({ mode: "closed" });
		root.append(template.content.cloneNode(true));

		this.dialogEl = root.querySelector("dialog-base");
		this.listEl = root.getElementById("top-sites");
	}

	async show() {
		const sites = await browser.topSites.get({
			includePinned: true,
			includeFavicon: true,
		});
		for (const site of sites) {
			const item = document.createElement("li");

			// 标题可能为空字符串，所以不能用 ??=
			site.title ||= new URL(site.url).hostname;

			const img = document.createElement("img");
			img.alt = "favicon";
			img.src = site.favicon;

			const title = document.createElement("span");
			title.className = "title";
			title.textContent = site.title;

			const url = document.createElement("span");
			url.textContent = site.url;

			const button = document.createElement("button");
			button.type = "button";
			button.title = "添加该网站";
			button.innerHTML = AddIcon;
			button.onclick = () => this.handleAddClick(site);

			item.append(img, title, url, button);
			this.listEl.append(item);
		}
		this.dialogEl.showModal();
		return new Promise(resolve => this.resolve = resolve);
	}

	handleAddClick(site) {
		const { title, url, favicon } = site;
		const detail = { label: title, favicon, url };
		this.dispatchEvent(new CustomEvent("add", { bubbles: true, detail }));
	}
}

customElements.define("top-site-dialog", TopSiteDialogElement);
