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
 *
 * There 2 kind of debouncing: cancel previous or ignore next,
 * this class support the first.
 *
 * If you pass `delay = 0` it will not do throttling.
 * If you ignore the signal in the handler, it will not do debouncing.
 */
export class Debounced {

	controller = new AbortController();
	timer = 0;

	/**
	 * Create an instance with handler & delay, you can change them later.
	 *
	 * @param handler The function to execute.
	 * @param delay Debounce delay in millisecond, 0 = disabled.
	 */
	constructor(handler, delay = 0) {
		this.handler = handler;
		this.delay = delay;
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
		const { timer, run, delay } = this;
		clearTimeout(timer);

		/*
		 * Don't use `setTimeout(run, 0)` when throttling is disabled,
		 * because JS engine may have minimum delay for setTimeout.
		 */
		if (delay === 0) {
			run();
		} else {
			this.timer = setTimeout(run, delay);
		}
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
	return i === -1 ? path : path.slice(0, i);
}

/**
 * Just like the `fetch`, but checks the status code.
 */
export async function fetchChecked(input, init) {
	const response = await fetch(input, init);
	if (response.ok) {
		return response;
	}
	throw new Error(`Request failed (${response.status})`);
}
