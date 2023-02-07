import styles from "./EngineSelect.css";

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	<div id='container'></div>
`;

class EngineSelectElement extends HTMLElement {

	selected;
	engines;

	constructor() {
		super();
		const root = this.attachShadow({ mode: "open" });
		root.append(template.content.cloneNode(true));

		this.container = root.getElementById("container");
	}

	get list() {
		return this.engines;
	}

	set list(value) {
		this.engines = value;
		this.render(value);
	}

	get index() {
		return this.selected;
	}

	set index(value) {
		const old = this.container.children[this.selected];

		const { length } = this.engines;
		value = (value + length) % length;
		this.selected = value;

		old?.classList.remove("active");
		this.container.children[value].classList.add("active");
	}

	get value() {
		return this.engines[this.selected];
	}

	set value(value) {
		const i = this.engines.indexOf(value);
		if (i > -1) {
			this.index = i;
		} else {
			throw new Error(`Unknown search engine: ${value.name}`);
		}
	}

	render(value) {
		const buttons = value.map(engine => {
			const img = document.createElement("img");
			img.alt = engine.name;
			img.src = engine.favicon;

			const button = document.createElement("button");
			button.type = "button";
			button.title = engine.name;
			button.engine = engine;
			button.onclick = this.handleClick.bind(this);

			button.append(img);
			return button;
		});

		this.container.replaceChildren(...buttons);
	}

	handleClick(event) {
		const { engine } = event.currentTarget;
		this.value = engine;
		this.dispatchEvent(new CustomEvent("input"));
	}
}

customElements.define("engine-select", EngineSelectElement);
