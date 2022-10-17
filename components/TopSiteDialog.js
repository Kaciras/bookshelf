import AddIcon from "@tabler/icons/plus.svg";
import CheckIcon from "@tabler/icons/check.svg";
import { i18n } from "@share";
import { defaultFavicon } from "../new-tab/storage.js";
import styles from "./TopSiteDialog.css";

/**
 * 如果 TopSite 没有自带标题则尝试使用域名。
 *
 * @param url TopSite 的 URL
 * @return {string} 用作标题的域名
 */
function adviceTitle(url) {
	const { hostname } = new URL(url);
	const parts = hostname.split(".");
	const top = parts.pop();
	return parts.length ? parts.pop() : top;
}

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	<dialog-base name='${i18n("TopSiteDialog")}'>
		<ul id='top-sites'></ul>
	</dialog-base>
`;

const itemTemplate = document.createElement("template");
itemTemplate.innerHTML = `
	<li>
		<img alt='favicon'>
		<span></span>
		<span class='url'></span>
		<button
			class='icon'
			title='${i18n("AddToShortcut")}'
		 >
			${AddIcon}
		</button>
	</li>
`;

/**
 * 导入对话框，能够读取浏览器原生的新标签页里的快捷方式，并将其添加到本插件中。
 *
 * 【获取数据的 API】
 * browser.topSites 仅支持读取，而新标签页却需要自定义快捷方式，
 * 所以只能从 topSites 导入然后保存到本插件的存储。
 */
class TopSiteDialogElement extends HTMLElement {

	constructor() {
		super();
		const root = this.attachShadow({ mode: "closed" });
		root.append(template.content.cloneNode(true));

		this.listEl = root.getElementById("top-sites");
		this.dialogEl = root.querySelector("dialog-base");
	}

	async show() {
		// Firefox 有更多选项而 Edge 没有且不能有参数
		const sites = browser.topSites.get.length > 0
			? await browser.topSites.get({
				newtab: true,
				includeFavicon: true,
			})
			: await browser.topSites.get();

		if (import.meta.env.dev) {
			console.debug("topSites.get return:", sites);
		}

		const listItems = new Array(sites.length);

		for (let i = 0; i < sites.length; i++) {
			let { title, url, favicon } = sites[i];

			// Can't use default value of destructuring as it only caused by undefined.
			favicon ??= defaultFavicon;

			// 标题可能为空字符串，所以不能用 ??=
			url = decodeURI(url);
			title ||= adviceTitle(url);

			const fragment = itemTemplate.content.cloneNode(true);
			const item = listItems[i] = fragment.firstChild;

			item.children[0].src = favicon;
			item.children[1].textContent = title;
			item.children[2].textContent = url;
			item.children[3].onclick = async () => {
				const event = new CustomEvent("add", {
					bubbles: true,
					detail: {
						label: title,
						url,
						favicon,
						icon: favicon,
					},
				});
				if (this.dispatchEvent(event)) {
					item.classList.add("added");
					item.children[3].innerHTML = CheckIcon;
				}
			};
		}

		this.listEl.replaceChildren(...listItems);
		this.dialogEl.showModal();
	}
}

customElements.define("top-site-dialog", TopSiteDialogElement);
