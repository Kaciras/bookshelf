import xIcon from "@assets/Close.svg";
import styles from "./index.css";

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	<div>
		<h1></h1>
		<button 
			id="close" 
			type="button"
			class="plain"
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

		root.getElementById("close").onclick = () => this.hide();
	}

	get name() {
		return this.getAttribute("aria-labelledby");
	}

	set name(value) {
		this.titleEl.textContent = value;
		this.setAttribute("aria-labelledby", value);
	}

	attributeChangedCallback(name, old, value) {
		this.name = value;
	}

	// 不能再构造方法里设置属性，否则会报错。
	connectedCallback() {
		this.setAttribute("role", "dialog");
		this.style.display = "none";
	}

	showModal() {
		this.style.removeProperty("display");
	}

	hide(accept) {
		this.style.display = "none";
	}
}

customElements.define("dialog-base", DialogBaseElement);
