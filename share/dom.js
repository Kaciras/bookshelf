/**
 * Bind the value of the input to a property of the object。
 * Property name is equals to input's name.
 *
 * @param input The input element, must have a name attribute。
 * @param receiver The object to bind to.
 */
export function bindInput(input, receiver) {
	const { type, name } = input;
	let prop;

	switch (type) {
		case "number":
			prop = "valueAsNumber";
			break;
		case "checkbox":
			prop = "checked";
			break;
		default:
			prop = "value";
			break;
	}

	input[prop] = receiver[name];
	input.addEventListener("input", event => {
		receiver[name] = event.target[prop];
	});
}

/**
 * Download the image by url and return its width & height.
 *
 * @param url The url of the image.
 * @returns {Promise<{width: number, height: number}>}
 */
export function getImageResolution(url) {
	const element = document.createElement("img");
	element.src = url;

	return new Promise((resolve, reject) => {
		element.onerror = reject;
		element.onload = () => resolve(element);
	});
}

/**
 * Gets the element's index among all children of its parent.
 * Throw an error if the element does not have a parent.
 *
 * @param el The DOM element.
 * @return {number} The index.
 */
export function indexInParent(el) {
	return Array.prototype.indexOf.call(el.parentNode.children, el);
}

export function dragSortContext() {
	let dragEl = null;

	function dragstart(event) {
		dragEl = event.currentTarget;
		dragEl.removeEventListener("dragenter", dragenter);
	}

	function dragend() {
		dragEl.isDragging = false;
		dragEl.addEventListener("dragenter", dragenter);
		dragEl = null;
	}

	function dragenter(event) {
		if (!dragEl) {
			return;
		}
		const { currentTarget } = event;
		dragEl.isDragging = true;

		const i = indexInParent(dragEl);
		const j = indexInParent(currentTarget);
		if (i < j) {
			currentTarget.after(dragEl);
		} else {
			currentTarget.before(dragEl);
		}
	}

	return element => {
		element.addEventListener("dragstart", dragstart);
		element.addEventListener("dragend", dragend);
		element.addEventListener("dragenter", dragenter);
	};
}
