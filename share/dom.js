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
 * Define getter & setter for an attribute of the custom element.
 */
export function delegateAttribute(clazz, name, isBool) {
	function getBool() {
		return this.hasAttribute(name);
	}

	function setBool(value) {
		if (value) {
			this.setAttribute(name, "");
		} else {
			this.removeAttribute(name);
		}
	}

	function getDefault() {
		return this.getAttribute(name);
	}

	function setDefault(value) {
		return this.setAttribute(name, value);
	}

	Object.defineProperty(clazz.prototype, name, {
		configurable: true,
		enumerable: true,
		get: isBool ? getBool : getDefault,
		set: isBool ? setBool : setDefault,
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
