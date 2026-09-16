// Runner that neutralizes the `server-only` import guard, then delegates to
// tsx to execute a TypeScript script. Used for standalone Node scripts (e2e,
// seeds) that legitimately run server-side code outside Next's bundler.
const Module = require("module");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  if (request === "server-only" || request === "client-only") {
    return require.resolve("./server-only-shim.js");
  }
  return originalResolve.call(this, request, ...args);
};

const target = process.argv[2];
if (!target) {
  console.error("usage: node scripts/run-node-script.js <script.ts>");
  process.exit(1);
}

// Register tsx so we can require a .ts file directly.
require("tsx/cjs");
require(require("path").resolve(process.cwd(), target));
