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
 * 包含标签的复选框，因为浏览器自带的不能改颜色所以就自己实现了。
 *
 * 实现参考了 Google 的教程：
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

	/**
	 * 即便内部的 input 能捕获焦点，但被聚焦对象仍会变为整个组件。
	 * 所以需要自行处理键盘切换值的问题。
	 */
	handleKeyup(event) {
		if (event.key === " ") {
			event.preventDefault();
			this.toggleChecked();
		}
	}

	/**
	 * 输入组件的 input 事件基本上只用 target 这个属性，
	 * 所以直接分发以 input 为名的 CustomEvent 也是可以的。
	 */
	toggleChecked() {
		if (this.inputEl.disabled) {
			return;
		}
		this.checked = !this.checked;
		this.dispatchEvent(new CustomEvent("input"));
	}
}

// 跟原生的 input 属性保持一致，在一些场合能减少无聊的判断。
CheckBoxElement.prototype.type = "checkbox";

customElements.define("check-box", CheckBoxElement);
