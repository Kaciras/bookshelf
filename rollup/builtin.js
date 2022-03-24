import { builtinModules } from "module";

const builtins = new Set([
	...builtinModules,
	"wasi",
	"assert/strict",
	"diagnostics_channel",
	"dns/promises",
	"fs/promises",
	"path/posix",
	"path/win32",
	"readline/promises",
	"stream/consumers",
	"stream/promises",
	"stream/web",
	"util/types",
	"timers/promises",
]);

/**
 * 解析 Node 的内置模块，使其作为外部依赖并能够被摇树优化。
 *
 * <h2>为什么造轮子</h2>
 * https://github.com/rollup/plugins/tree/master/packages/node-resolve
 * Rollup 官方的 node-resolve 插件有以下缺陷：
 * 1）不能检测到子模块比如 fs/promises。
 * 2）Node 模块的 moduleSideEffects = null，还需要额外配置才能摇树。
 */
export default {
	name: "node-builtin",

	// 返回 false 代表外部依赖，这里写法有点怪。
	resolveId(id) {
		if (id.startsWith("node:") || builtins.has(id)) {
			return {
				id,
				external: true,
				moduleSideEffects: false,
			};
		}
	},
};
