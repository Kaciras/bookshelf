import xIcon from "@tabler/icons/x.svg";
import { i18n } from "@share";
import styles from "./DialogBase.css";

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	<dialog>
		<h1></h1>
		<button
			class='plain'
			title='${i18n("Close")}'
			type='button'
		 >
			${xIcon}
		</button>
		<slot></slot>
	</dialog>
`;

/**
 * 简单封装下 <dialog>，加上了标题、个关闭按钮以及点击遮罩关闭的功能。
 */
class DialogBaseElement extends HTMLElement {

	static get observedAttributes() {
		return ["name"];
	}

	constructor() {
		super();
		const root = this.attachShadow({ mode: "closed" });
		root.append(template.content.cloneNode(true));

		this.dialogEl = root.querySelector("dialog");
		this.titleEl = root.querySelector("h1");

		root.querySelector("button").onclick = this.close.bind(this);
		this.dialogEl.onclick = this.handleClick.bind(this);
	}

	get name() {
		return this.getAttribute("aria-labelledby");
	}

	set name(value) {
		this.titleEl.textContent = value;
		this.setAttribute("aria-labelledby", value);
	}

	// 在构造方法里设置 DOM 属性会报错。
	connectedCallback() {
		this.setAttribute("role", "dialog");
		this.setAttribute("aria-modal", "true");
	}

	attributeChangedCallback(name, old, value) {
		this[name] = value;
	}

	showModal() {
		this.dialogEl.showModal();
	}

	close() {
		this.dialogEl.close();
	}

	/**
	 * dialog 元素好像没法简单地区分点击遮罩，只能判断鼠标位置。
	 *
	 * https://stackoverflow.com/a/64578435
	 */
	handleClick(event) {
		const rect = this.dialogEl.getBoundingClientRect();
		const { clientX, clientY } = event;

		if (clientY < rect.top || clientY > rect.bottom ||
			clientX < rect.left || clientX > rect.right) {
			this.close();
		}
	}
}

customElements.define("dialog-base", DialogBaseElement);
