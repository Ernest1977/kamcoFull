#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const { build } = require('esbuild');
const csso = require('csso');
const { minify } = require('html-minifier-terser');

const rootDir = path.resolve(__dirname);
const outDir = path.join(rootDir, 'dist');
const ignorePatterns = ['**/dist/**', '**/node_modules/**'];

async function writeFile(dest, content) {
  await fs.mkdirp(path.dirname(dest));
  await fs.writeFile(dest, content, 'utf8');
}

async function buildHtml() {
  const files = glob.sync('**/*.html', { cwd: rootDir, nodir: true, ignore: ignorePatterns });
  for (const file of files) {
    const src = path.join(rootDir, file);
    const dest = path.join(outDir, file);
    const html = await fs.readFile(src, 'utf8');
    const minified = await minify(html, {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeEmptyAttributes: true,
      minifyCSS: true,
      minifyJS: true,
      keepClosingSlash: true,
    });
    await writeFile(dest, minified);
  }
}

async function buildCss() {
  const files = glob.sync('**/*.css', { cwd: rootDir, nodir: true, ignore: ignorePatterns });
  for (const file of files) {
    const src = path.join(rootDir, file);
    const dest = path.join(outDir, file);
    const css = await fs.readFile(src, 'utf8');
    const result = csso.minify(css).css;
    await writeFile(dest, result);
  }
}

async function buildJs() {
  const files = glob.sync('**/*.js', {
    cwd: rootDir,
    nodir: true,
    ignore: ignorePatterns.concat(['build.js']),
  });

  for (const file of files) {
    const src = path.join(rootDir, file);
    const dest = path.join(outDir, file);
    await fs.mkdirp(path.dirname(dest));
    await build({
      entryPoints: [src],
      outfile: dest,
      bundle: false,
      minify: true,
      sourcemap: false,
      target: ['es2017'],
      platform: 'browser',
      logLevel: 'silent',
    });
  }
}

async function copyAssets() {
  const files = glob.sync('**/*', {
    cwd: rootDir,
    nodir: true,
    ignore: ignorePatterns.concat([
      '**/*.html',
      '**/*.css',
      '**/*.js',
      'package.json',
      'package-lock.json',
      'build.js',
      'README.md',
      'README.txt',
      '.gitignore',
      '.npmrc',
    ]),
  });

  for (const file of files) {
    const src = path.join(rootDir, file);
    const dest = path.join(outDir, file);
    await fs.copy(src, dest);
  }
}

async function run() {
  const clean = process.argv.includes('--clean');
  if (clean) {
    await fs.remove(outDir);
    console.log('Cleaned dist directory.');
    return;
  }

  await fs.remove(outDir);
  await fs.mkdirp(outDir);

  console.log('Building HTML...');
  await buildHtml();

  console.log('Building CSS...');
  await buildCss();

  console.log('Building JavaScript...');
  await buildJs();

  console.log('Copying assets...');
  await copyAssets();

  console.log('Frontend build complete:', outDir);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
