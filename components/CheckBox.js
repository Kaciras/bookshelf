import Icon from "@material-design-icons/svg/filled/check_box_outline_blank.svg";
import IconChecked from "@material-design-icons/svg/filled/check_box.svg";
import styles from "./CheckBox.css";
import { delegateAttribute } from "../share/index.js";

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	<div></div>
	<span><slot></slot></span>
`;

/**
 * A checkbox with label. We don't use the <input> element
 * because it's hard to customize.
 *
 * Tutorial of how to write a check-box:
 * https://developers.google.com/web/fundamentals/web-components/examples/howto-checkbox
 */
class CheckBoxElement extends HTMLElement {

	static get observedAttributes() {
		return ["checked"];
	}

	constructor() {
		super();
		const root = this.attachShadow({ mode: "open" });
		root.append(template.content.cloneNode(true));

		this.markEl = root.querySelector("div");

		this.addEventListener("keyup", this.handleKeyup);
		this.addEventListener("click", this.toggleChecked);
	}

	connectedCallback() {
		this.setAttribute("role", "checkbox");
		this.tabIndex = 0;
		this.attributeChangedCallback("checked", "", null);
	}

	attributeChangedCallback(name, _, value) {
		// Only "checked" attribute currently.
		this.markEl.innerHTML = value !== null ? IconChecked : Icon;
	}

	handleKeyup(event) {
		if (event.key === " ") {
			event.preventDefault();
			this.toggleChecked();
		}
	}

	/**
	 * We only use `event.target` to get the value,
	 * so no need to set `event.detail`.
	 */
	toggleChecked() {
		if (this.disabled) {
			return;
		}
		const event = new CustomEvent("input", {
			cancelable: true,
		});
		if (this.dispatchEvent(event)) {
			this.checked = !this.checked;
		}
	}
}

delegateAttribute(CheckBoxElement, "name");
delegateAttribute(CheckBoxElement, "disabled", true);
delegateAttribute(CheckBoxElement, "checked", true);

// Simulation <input type="checkbox"> for compatibility.
CheckBoxElement.prototype.type = "checkbox";

customElements.define("check-box", CheckBoxElement);
