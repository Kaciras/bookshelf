import xIcon from "@assets/Close.svg";
import styles from "./DialogBase.css";

/*
 * 不能将自定义元素作为遮罩层，然后对话框放在内部，虽然这样能省个元素，
 * 但 ShadowDOM 会屏蔽细节，将内部元素事件的 target 属性全改为自定义元素自身，
 * 这会导致无法判断点击的是对话框还是遮罩层。
 */
const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	<dialog>
		<h1></h1>
		<button
			class="plain"
			title="关闭"
			type="button"
		 >
			${xIcon}
		</button>
		<slot></slot>
	</dialog>
`;

/**
 * 因为 Firefox 不支持 dialog 元素，所以自己搞了，顺便加个关闭按钮。
 *
 * @see https://caniuse.com/dialog
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

		root.querySelector("button").onclick = this.hide.bind(this);
		this.dialogEl.onclick = this.handleBackdropClick.bind(this);
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

	hide() {
		this.dispatchEvent(new CustomEvent("close"));
		this.dialogEl.close();
	}

	/**
	 * dialog 元素好像没法简单地区分点击遮罩，只能判断鼠标位置。
	 *
	 * https://stackoverflow.com/a/64578435
	 */
	handleBackdropClick(event) {
		const rect = this.dialogEl.getBoundingClientRect();
		if (event.clientY < rect.top || event.clientY > rect.bottom ||
			event.clientX < rect.left || event.clientX > rect.right) {
			this.hide();
		}
	}
}

customElements.define("dialog-base", DialogBaseElement);
