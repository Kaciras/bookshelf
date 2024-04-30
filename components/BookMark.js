import EditIcon from "@tabler/icons/outline/edit.svg";
import CloseIcon from "@tabler/icons/outline/x.svg";
import { delegate, i18n } from "../share/index.js";
import styles from "./BookMark.css";

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	
	<a id='link'>
		<div class='shortcut-icon'>
			<img id='favicon' alt='icon'>
		</div>
		<span 
			id='label' 
			class='one-line'
		/>
	</a>
	
	<button
		type='button'
		id='edit'
		title='${i18n("Edit")}'
	>
		${EditIcon}
	</button>
	<button 
		type='button'
		id='remove'
		title='${i18n("Delete")}'
	>
		${CloseIcon}
	</button>
`;

/**
 * Shortcut tile under the search box. The style is the same as that of Firefox,
 * except for buttons in the upper right corner。
 *
 * Since this element is only created via JS, observedAttributes is not needed.
 */
class BookMarkElement extends HTMLElement {

	constructor() {
		super();
		const root = this.attachShadow({ mode: "open" });
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
	 * Is being dragged, set this property to true will hide the content。
	 */
	get isDragging() {
		return this.linkEl.className === "blank";
	}

	set isDragging(value) {
		this.linkEl.className = value ? "blank" : null;
	}

	/**
	 * Whether to display controls in the upper right corner.
	 */
	get isEditable() {
		return this.classList.contains("editable");
	}

	set isEditable(value) {
		this.classList.toggle("editable", Boolean(value));
	}
}

customElements.define("book-mark", BookMarkElement);
