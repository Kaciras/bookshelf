import xIcon from "@assets/Close.svg";
import styles from "./index.css";

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	<div>
		<h1></h1>
		<button 
			id="close"
			class="plain"
			title="关闭"
			type="button"
		 >
			${xIcon}
		</button>
		<slot></slot>
	</div>
`;

/**
 * 因为 Firefox 不支持 dialog 元素，所以自己搞了，顺便加个关闭按钮。
 */
class DialogBaseElement extends HTMLElement {

	static get observedAttributes() {
		return ["name"];
	}

	constructor() {
		super();
		const root = this.attachShadow({ mode: "closed" });
		root.append(template.content.cloneNode(true));

		this.titleEl = root.querySelector("h1");

		this.addEventListener("click", this.handleClick.bind(this));
		root.getElementById("close").onclick = () => this.hide();
	}

	get name() {
		return this.getAttribute("aria-labelledby");
	}

	set name(value) {
		this.titleEl.textContent = value;
		this.setAttribute("aria-labelledby", value);
	}

	showModal() {
		this.classList.add("open");
	}

	hide() {
		this.dispatchEvent(new CustomEvent("close"));
		this.classList.remove("open");
	}

	attributeChangedCallback(name, old, value) {
		this.name = value;
	}

	// 不能再构造方法里设置属性，否则会报错。
	connectedCallback() {
		this.setAttribute("role", "dialog");
	}

	handleClick(event) {
		if(event.target !== this) {
			return;
		}
		this.dispatchEvent(new CustomEvent("backdrop-click"));
	}
}

customElements.define("dialog-base", DialogBaseElement);
