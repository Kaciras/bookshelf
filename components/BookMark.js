import { delegate, i18n } from "@share";
import EditIcon from "@tabler/icons/edit.svg";
import CloseIcon from "@tabler/icons/x.svg";
import styles from "./BookMark.css";

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	
	<a id="link">
		<div id="icon-box">
			<img id="favicon" alt="favicon">
		</div>
		<span id="label"></span>
	</a>
	
	<button
		type="button"
		id="edit"
		title='${i18n("Edit")}'
	>
		${EditIcon}
	</button>
	<button 
		type="button"
		id="remove"
		title='${i18n("Delete")}'
	>
		${CloseIcon}
	</button>
`;

/**
 * 搜索框下方的快捷方式，因为 shortcut 是一个单词不符合规范所以用 book-mark。
 * 这里的样式做得跟 Firefox 一样，除了右上角的修改按钮。
 *
 * 因为该元素仅通过 JS 创建，就不写 observedAttributes 了。
 */
class BookMarkElement extends HTMLElement {

	constructor() {
		super();
		const root = this.attachShadow({ mode: "closed" });
		root.append(template.content.cloneNode(true));

		this.labelEl = root.getElementById("label");
		this.iconEl = root.getElementById("favicon");
		this.linkEl = root.getElementById("link");

		delegate(this, "label", this.labelEl, "textContent");
		delegate(this, "url", this.linkEl, "href");
		delegate(this, "favicon", this.iconEl, "src");

		root.getElementById("edit").onclick = () => {
			this.dispatchEvent(new CustomEvent("edit", { bubbles: true }));
		};
		root.getElementById("remove").onclick = () => {
			this.dispatchEvent(new CustomEvent("remove", { bubbles: true }));
		};
	}

	/**
	 * 是否处于被拖动中，为 true 时将隐藏图标和标题，变为白板。
	 */
	get isDragging() {
		return this.linkEl.className === "blank";
	}

	set isDragging(value) {
		this.linkEl.className = value ? "blank" : null;
	}

	/**
	 * 是否显示右上角的编辑和删除按钮，默认不显示以免误碰。
	 */
	get isEditable() {
		return this.classList.contains("editable");
	}

	set isEditable(value) {
		this.classList.toggle("editable", Boolean(value));
	}
}

customElements.define("book-mark", BookMarkElement);
