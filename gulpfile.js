const { src, dest, series, parallel, watch } = require('gulp')
const babel = require('gulp-babel')
const del = require('del')
const uglify = require('gulp-uglify')
const postcss = require('gulp-postcss')
const pxtoviewport = require('postcss-px-to-viewport')
const autoprefixer = require('autoprefixer')
const sass = require('gulp-sass')
const connect = require('gulp-connect')
const htmlmin = require('gulp-htmlmin')
const cleanCss = require('gulp-clean-css')
const rev = require('gulp-rev')
const revCollector = require('gulp-rev-collector')

sass.compiler = require('node-sass')

const distPath = 'dist/'
const srcPath = 'src/'

const postcssPluginsAutoprefixer = autoprefixer({ overrideBrowserslist: ['last 2 version'] })
const postcssPluginsPxtoviewport = pxtoviewport({
  unitToConvert: 'px', // 要转换的单位，默认情况下是px
  viewportWidth: 750, // 视口的宽度
  unitPrecision: 5,
  propList: ['*'],
  viewportUnit: 'vw',
  fontViewportUnit: 'vw',
  selectorBlackList: ['.ignore'],
  minPixelValue: 1,
  mediaQuery: false,
  replace: true,
  exclude: []
})

/*
 * 清空 dist 目录
 */
function clean(cb) {
  return del([distPath]).then(res => {
    console.log(`${distPath}清空完毕...`)
  })
}

function copyStatic() {
  return src(`${srcPath}static/**`)
    .pipe(dest(`${distPath}static`))
    .pipe(connect.reload())
}
/*
 * 用于 dev 的 脚本
 */

// 复制html  用于 dev 环境 watch
function devHtml() {
  return src(`${srcPath}**/*.html`)
    .pipe(dest(distPath))
    .pipe(connect.reload())
}
// 复制js  用于 dev 环境 watch
function devJs() {
  return src(`${srcPath}**/*.js`)
    .pipe(dest(distPath))
    .pipe(connect.reload())
}
// 复制css  用于 dev 环境 watch
function devCss() {
  return src(`${srcPath}**/*.css`)
    .pipe(dest(distPath))
    .pipe(connect.reload())
}
// 编译scss 和px转vw
function devScss() {
  return src(`${srcPath}**/*.scss`)
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([postcssPluginsPxtoviewport]))
    .pipe(dest(distPath))
    .pipe(connect.reload())
}
/*
 * 用于 build 的 脚本
 */
function buildJs() {
  return src(`${srcPath}**/*.js`)
    .pipe(babel({ presets: ['@babel/env'] }))
    .pipe(uglify())
    .pipe(dest(distPath))
}
// 复制css  用于 build
function buildCss() {
  return src(`${srcPath}**/*.css`)
    .pipe(cleanCss())
    .pipe(dest(distPath))
}
// 编译scss 和px转vw
function buildScss() {
  return src(`${srcPath}**/*.scss`)
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([postcssPluginsAutoprefixer, postcssPluginsPxtoviewport]))
    .pipe(cleanCss())
    .pipe(dest(distPath))
}
// 复制html  用于 dev 环境 watch
function buildHtml() {
  return src(`${srcPath}**/*.html`)
    .pipe(
      htmlmin({
        removeComments: true, // 清除HTML注释
        collapseWhitespace: true, // 压缩HTML
        minifyJS: true, // 压缩页面JS
        minifyCSS: true // 压缩页面CSS
      })
    )
    .pipe(dest(distPath))
}

let devServerOptions = {
  name: 'ENV：dev',
  root: `${distPath}`,
  host: '0.0.0.0',
  port: 8888,
  livereload: true
}
function devServer() {
  connect.server(devServerOptions)
}

function watchList() {
  watch(`${srcPath}**/*.html`, series(devHtml))
  watch(`${srcPath}**/*/*.js`, series(devJs))
  watch(`${srcPath}**/*.css`, series(devCss))
  watch(`${srcPath}**/*.scss`, series(devScss))
  watch(`${srcPath}static/**`, series(copyStatic))
}
const BuildServerOptions = {
  name: 'build dist 目录后 打开该链接可查看效果',
  root: `${distPath}`,
  host: '0.0.0.0',
  port: 3000,
  livereload: false
}
function buildServer() {
  connect.server(BuildServerOptions)
}
exports.clean = clean
exports.dev = series(parallel(devServer, devHtml, devCss, devScss, devJs, copyStatic, watchList))
exports.build = series(clean, parallel(buildHtml, buildCss, buildScss, buildJs, copyStatic))
exports.buildServer = series(clean, parallel(buildHtml, buildCss, buildScss, buildJs, copyStatic), buildServer)
exports.default = exports.dev
