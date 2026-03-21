'use strict';
/**
 * Windows-aware Tailwind v4 PostCSS plugin wrapper.
 *
 * Problem:
 *   Angular's build passes the stylesheet's absolute Windows path
 *   (C:\…\styles.css) as PostCSS opts.from.  Tailwind v4 computes its
 *   @source base directory as:
 *
 *       base = path.dirname( path.resolve(opts.from) )
 *
 *   On Windows, path.resolve() returns backslash-separated absolute paths.
 *   Tailwind's Oxide / fast-glob scanner requires forward slashes, so with
 *   backslashes it finds zero template files and generates no utility classes.
 *
 * Why we can't patch path.resolve at module-load time:
 *   Angular's build loads this module during the esbuild onStart phase,
 *   which runs CONCURRENTLY with Angular's TypeScript configuration reader
 *   (readConfiguration in @angular/compiler-cli).  A global path.resolve
 *   patch at load time corrupts the TypeScript init and causes build failures.
 *
 * Solution:
 *   Wrap each of Tailwind's inner plugin Once handlers to apply the patch
 *   only during that specific handler's execution.  By the time any Once
 *   handler runs, the onStart phase is complete and TypeScript is already
 *   configured, so the temporary patch cannot affect it.
 *
 *   The patch also restores path.relative (which internally calls
 *   path.resolve) so that Angular's SSR entry-point path computation
 *   continues to return correct relative paths.
 */

const path = require('path');
const tailwindcss = require('@tailwindcss/postcss');

// Capture originals immediately (before any possible external patching)
const _origResolve  = path.resolve.bind(path);
const _origRelative = path.relative.bind(path);

function applyPatch() {
  path.resolve = (...args) => _origResolve(...args).replace(/\\/g, '/');

  // path.relative internally calls path.resolve; temporarily swap it back
  // so that relative() still produces correct backslash-separated results.
  path.relative = (from, to) => {
    const saved   = path.resolve;
    path.resolve  = _origResolve;
    const result  = _origRelative(from, to);
    path.resolve  = saved;
    return result;
  };
}

function removePatch() {
  path.resolve  = _origResolve;
  path.relative = _origRelative;
}

function wrapOnce(plugin) {
  if (!plugin.Once) return plugin;
  const originalOnce = plugin.Once;
  return {
    ...plugin,
    async Once(root, helpers) {
      if (process.platform === 'win32') applyPatch();
      try {
        return await originalOnce.call(this, root, helpers);
      } finally {
        if (process.platform === 'win32') removePatch();
      }
    },
  };
}

// Build the plugin pack with wrapped inner plugins.
// tailwindcss() is called here (during module require, i.e. in onStart) but
// does NOT call path.resolve at this point — that only happens inside Once.
const twPlugins = tailwindcss().plugins.map(wrapOnce);

function windowsTailwindPlugin() {
  return {
    postcssPlugin: '@tailwindcss/postcss-windows',
    plugins: twPlugins,
  };
}
windowsTailwindPlugin.postcss = true;

module.exports = windowsTailwindPlugin;
