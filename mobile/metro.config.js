// Metro configuration for the LESEN patrol app.
//
// The app consumes `@lesan/form-engine` from `../shared/form-engine` — the same
// source the Deno backend and the Next.js frontend use, so all three evaluate
// form rules identically. Metro cannot resolve files outside the project root by
// default, so `shared/` is added to `watchFolders` and its modules are made
// resolvable via `extraNodeModules`.
//
// Without this, `@forms` fails to resolve in the RN bundle even though
// `tsconfig.json` maps it (TypeScript resolves paths; Metro does not).

const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, "..");
const sharedRoot = path.resolve(repoRoot, "shared");
const engineRoot = path.resolve(sharedRoot, "form-engine");

const config = getDefaultConfig(projectRoot);

// Watch the shared engine so editing it hot-reloads the app.
config.watchFolders = [...(config.watchFolders ?? []), sharedRoot];

// Resolve `@forms` and `@forms/*` to the shared engine, and make sure the
// engine's own bare imports resolve against the mobile workspace's node_modules.
config.resolver.extraNodeModules = {
	...(config.resolver.extraNodeModules ?? {}),
	// `@forms` → shared/form-engine/src/index.ts (per the package `exports`),
	// `@forms/*` → shared/form-engine/src/*.
	"@forms": path.resolve(engineRoot, "src", "index.ts"),
};

// Metro resolves `@forms` through extraNodeModules only for bare specifiers;
// sub-path imports (`@forms/types`) need an explicit alias map.
config.resolver.resolveRequest = (context, moduleName, platform) => {
	if (moduleName === "@forms") {
		return {
			type: "sourceFile",
			filePath: path.resolve(engineRoot, "src", "index.ts"),
		};
	}
	if (moduleName.startsWith("@forms/")) {
		const rest = moduleName.slice("@forms/".length);
		return {
			type: "sourceFile",
			filePath: path.resolve(engineRoot, "src", `${rest}.ts`),
		};
	}
	return context.resolveRequest(context, moduleName, platform);
};

config.resolver.nodeModulesPaths = [
	path.resolve(projectRoot, "node_modules"),
	...(config.resolver.nodeModulesPaths ?? []),
];

// Blocklist the engine's own copies of anything resolvable from node_modules,
// so Metro never bundles two copies of a dependency.
config.resolver.blockList = [
	/[/\\]shared[/\\]form-engine[/\\]node_modules[/\\].+/,
	...(Array.isArray(config.resolver.blockList)
		? config.resolver.blockList
		: [config.resolver.blockList].filter(Boolean)),
];

module.exports = config;