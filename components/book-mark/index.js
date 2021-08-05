import { delegate } from "@share";
import EditIcon from "@assets/Edit.svg";
import CloseIcon from "@assets/Close.svg";
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
	
	<button
		type="button"
		id="edit"
		title="编辑"
	>
		${EditIcon}
	</button>
	
	<button 
		type="button"
		id="remove"
		title="删除"
	>
		${CloseIcon}
	</button>
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

		root.getElementById("edit").onclick = () => this.dispatchEvent(new CustomEvent("edit"));
		root.getElementById("remove").onclick = () => this.dispatchEvent(new CustomEvent("remove"));
	}

	handleClick(event) {
		if (this.disabled) {
			event.preventDefault();
		}
	}
}

customElements.define("book-mark", BookMarkElement);
