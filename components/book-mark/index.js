import { delegate } from "@share";
import styles from "./index.css";

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	
	<a id="link">
		<div id="icon-box">
			<img id="favicon" alt="favicon" src="#">
		</div>
		<span id="label"></span>
	</a>
	
	<button id="edit" type="button"></button>
	<button id="remove" type="button"></button>
`;


/**
 * 因为该元素仅通过 JS 创建，所以就不写 observedAttributes 了。
 */
class BookMarkElement extends HTMLElement {

	constructor() {
		super();
		this.disabled = false;

		const root = this.attachShadow({ mode: "closed" });
		root.append(template.content.cloneNode(true));

		this.labelEl = root.getElementById("label");
		this.iconEl = root.getElementById("favicon");
		this.linkEl = root.getElementById("link");

		delegate(this, "label", this.labelEl, "textContent");
		delegate(this, "url", this.linkEl, "href");
		delegate(this, "favicon", this.iconEl, "src");

		this.linkEl.addEventListener("click", this.handleClick.bind(this));
	}

	handleClick(event) {
		if (this.disabled) {
			event.preventDefault();
		}
	}
}

customElements.define("book-mark", BookMarkElement);
