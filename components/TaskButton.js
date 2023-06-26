import styles from "./TaskButton.css";

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	<slot></slot>
	<div class='dot-flashing'>
		<div class='middle'/>
	</div>
`;

/**
 * A button with a busy state, click it starts the task and turns
 * to a busy state, and changes back the task done.
 *
 * When busy, clicking the button will abort the current task with AbortSignal.
 *
 * <h2>Why not extends HTMLButtonElement</h2>
 * Firefox doesn't support extends elements other than HTMLElement.
 * If you do this, the ShadowDOM will not be displayed.
 */
class TaskButtonElement extends HTMLElement {

	running = false;
	controller = new AbortController();

	constructor() {
		super();
		const root = this.attachShadow({ mode: "open" });
		root.append(template.content.cloneNode(true));

		this.slotEl = root.querySelector("slot");
		this.loadingEl = root.querySelector(".dot-flashing");
		this.loadingEl.remove();
	}

	connectedCallback() {
		this.classList.add("button");
		this.tabIndex = 0;
		this.addEventListener("click", this.handleClick);
	}

	async handleClick() {
		const { running, taskFn } = this;

		// Just like a normal button if no taskFn.
		if (!taskFn) return;

		if (!running) {
			this.startTask();
		} else {
			this.controller.abort();
			this.switchToNormal();
		}
	}

	startTask() {
		const { slotEl, loadingEl, taskFn, style } = this;
		this.running = true;

		// Prevent size changing after content switching.
		const { width, height } = this.getBoundingClientRect();
		style.width = width + "px";
		style.height = height + "px";

		const { signal } = this.controller = new AbortController();
		slotEl.replaceWith(loadingEl);
		taskFn(signal).finally(this.switchToNormal.bind(this));
	}

	switchToNormal() {
		this.removeAttribute("style");
		this.running = false;
		this.loadingEl.replaceWith(this.slotEl);
	}
}

customElements.define("task-button", TaskButtonElement);
