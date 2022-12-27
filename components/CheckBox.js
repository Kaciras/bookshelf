import Icon from "@material-design-icons/svg/filled/check_box_outline_blank.svg";
import IconChecked from "@material-design-icons/svg/filled/check_box.svg";
import { delegate } from "../share/index.js";
import styles from "./CheckBox.css";

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	<input id='input' type='checkbox'>
	<div id='icon'></div>
	<label for='input'><slot></slot></label>
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
		return ["checked", "disabled", "name"];
	}

	constructor() {
		super();
		const root = this.attachShadow({ mode: "closed" });
		root.append(template.content.cloneNode(true));

		this.inputEl = root.getElementById("input");
		this.markEl = root.getElementById("icon");

		delegate(this, "name", this.inputEl, "name");

		this.addEventListener("keyup", this.handleKeyup);
		this.addEventListener("click", this.toggleChecked);
	}

	set checked(value) {
		this.inputEl.checked = Boolean(value);
		this.markEl.innerHTML = value ? IconChecked : Icon;
	}

	get checked() {
		return this.inputEl.checked;
	}

	attributeChangedCallback(name, oldValue, newValue) {
		const { inputEl } = this;
		if (newValue === null) {
			inputEl.removeAttribute(name);
		} else {
			inputEl.setAttribute(name, newValue);
		}
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
		if (this.inputEl.disabled) {
			return;
		}
		this.checked = !this.checked;
		this.dispatchEvent(new CustomEvent("input"));
	}
}

// Simulation <input type="checkbox"> for compatibility.
CheckBoxElement.prototype.type = "checkbox";

customElements.define("check-box", CheckBoxElement);
