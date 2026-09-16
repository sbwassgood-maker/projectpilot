// Empty shim so scripts run outside Next's RSC bundler can import modules that
// use `import "server-only"`. These scripts ARE server-side (Node), so the
// guard is unnecessary here. Wired via tsx --require alias in the e2e command.
module.exports = {};
