/**
 * Class-style debounce wrapper for functions. you can stop the schedule
 * or trigger it immediately which function-style wrapper can not.
 *
 * Useful for search suggestion (frequent input + network).
 *
 * <h2>debounce vs throttle<h2>
 * Throttling will delay executing a function. It will reduce
 * the notifications of an event that fires multiple times.
 *
 * Debouncing will bunch a series of sequential calls to a function into
 * a single call to that function. It ensures that one notification is
 * made for an event that fires multiple times.
 */
export class Debounced {

	controller = new AbortController();
	timer = 0;

	/**
	 * @param handler The function to execute.
	 * @param threshold Debounce delay in millisecond.
	 */
	constructor(handler, threshold = 0) {
		this.handler = handler;
		this.threshold = threshold;
		this.run = this.run.bind(this);
	}

	run() {
		this.stop();
		this.controller = new AbortController();
		this.handler(this.controller.signal);
	}

	stop() {
		clearTimeout(this.timer);
		this.controller.abort();
	}

	reschedule() {
		const { timer, run, threshold } = this;
		clearTimeout(timer);
		this.timer = setTimeout(run, threshold);
	}
}

/**
 * Two-way bind between object[name] and target[prop]。
 */
export function delegate(object, name, target, prop) {
	Object.defineProperty(object, name, {
		configurable: true,
		enumerable: true,
		get: () => target[prop],
		set: value => { target[prop] = value; },
	});
}

/**
 * returns the directory name of a path.
 */
export function dirname(path) {
	const i = path.lastIndexOf("/");
	return i < 0 ? path : path.slice(0, i);
}
