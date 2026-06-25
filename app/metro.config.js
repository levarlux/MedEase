const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// `convex/` holds the generated client code consumed by the app at build time.
// Unlike `shared/` and `backend/`, it has no package.json, so Expo's monorepo
// autodetection does NOT add it to watchFolders — which makes `convex/_generated/*`
// (aliased to `@convex/*` in tsconfig) unresolvable. Register it with Metro
// explicitly so the bundler (and EAS) can see and resolve into it.
const convexRoot = path.resolve(__dirname, "../convex");
config.watchFolders.push(convexRoot);

if (Array.isArray(config.resolver.nodeModulesPaths)) {
  config.resolver.nodeModulesPaths.push(path.join(convexRoot, "node_modules"));
}

module.exports = withNativeWind(config, { input: "./global.css" });
