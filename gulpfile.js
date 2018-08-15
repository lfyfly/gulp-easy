const gulp = require('gulp')
const browserSync = require('browser-sync').create()
const reload = browserSync.reload
const postcss = require('gulp-postcss')
const plumber = require('gulp-plumber')
const fs = require('fs')
const path = require('path')
const gulpIf = require('gulp-if')
// 压缩
const htmlmin = require('gulp-htmlmin')
const cleanCSS = require('gulp-clean-css')
const uglify = require('gulp-uglify')
const del = require('del')
const chokidar = require('chokidar')
// dev

const config = require('./config')
config.tmpPath = config.tmpPath || 'node_modules/__tmp__'
config.srcPath = config.srcPath || 'src'
gulp.task('del_tmp', function () {
  del.sync(path.resolve(__dirname, config.tmpPath))
})


const proxyMiddleware = require('http-proxy-middleware')
const middleware = config.proxyTable && Object.prototype.toString.call(config.proxyTable) === '[object Object]' ? Object.keys(config.proxyTable).map(key => proxyMiddleware(key, typeof config.proxyTable[key] === 'string' ? { target: config.proxyTable[key] } : config.proxyTable[key])) : []

gulp.task('dev', ['del_tmp'].concat(config.pug ? ['pug'] : []).concat((config.sass || config.scss) ? ['scss'] : []).concat(config.babel ? ['babel'] : []), function () {
  browserSync.init({
    server: {
      baseDir: [config.tmpPath, config.srcPath],
    },
    middleware,
    port: 9000,
    online: false,
  })


  // 监听缓存文件夹
  chokidar.watch([config.tmpPath, `${config.srcPath}/**/*.html`, `${config.srcPath}/**/*.css`], { ignoreInitial: true, ignorePermissionErrors: true })
    .on('all', function (event, filePath) {
      console.log('【dev】', event, filePath)
      if (/\.css$/.test(filePath)) {
        gulp.start('css')
        return
      }
      reload()
    })

  chokidar.watch(config.srcPath, { ignoreInitial: true, ignorePermissionErrors: true })
    .on('all', (event, filePath) => {
      let task
      let deleteFilePath
      try {
        console.log('【 src 】', event, path.resolve(__dirname, filePath))
        // 删除文件时，删除缓存
        if (event === 'change' || event === 'add') {
          if (/\.js$/.test(filePath)) {
            if (!config.babel) {
              reload()
              return
            }
            task = 'babel'
          } else if ((config.scss || config.sass) && /(\.scss|\.sass)$/.test(filePath)) {
            task = 'scss'
          } else if (config.pug && /(\.pug)$/.test(filePath)) {
            task = 'pug'
          }
          if (!task) return

          // mock
          if (event === 'change') {
            gulp.start(task)
          } else { // add
            setTimeout(() => {
              gulp.start(task)
              // 这100ms的延迟是为了，在拖动文件夹（文件）的时候，可以让unlink优先在babel触发，unlink钩子中删除文件缓存
              // 否者在执行task scripts时，由于缓存文件没有清楚，那么其实已经被删除的文件又会生成
            }, 100)
          }
        } else if (event === 'unlink' || event === 'unlinkDir') {

          if (event === 'unlink') {

            // 要删除的dev目录下的文件的后缀替换
            deleteFilePath = filePath.replace(/(\.scss|\.sass)$/, '.css')
            deleteFilePath = deleteFilePath.replace(/\.pug$/, '.html')

          } else {
            deleteFilePath = filePath // 删除的是文件夹
          }

          // 同步删除dev的文件
          // 文件名后缀替换
          deleteFilePath = path.resolve(__dirname, deleteFilePath.replace(config.srcPath, config.tmpPath))

          console.log('deleteFilePath= ', deleteFilePath)
          del.sync(deleteFilePath)
          reload()
        }
      } catch (err) {
        console.log('chokidar 事件函数内 错误：', err)
      }

    })
})

// css 热更新
gulp.task('css', function () {
  return gulp.src([`${config.srcPath}/**/*.css`, `${config.tmpPath}/**/*.css`, `!${config.srcPath}/_vendor/**/*.css`])
    .pipe(plumber())
    // .pipe(postcss()) 报错就无法自动刷新了
    .pipe(reload({ stream: true }))
})

const changed = require('gulp-changed')
const sourcemaps = require('gulp-sourcemaps')

const pug = require('gulp-pug')
gulp.task('pug', function () {
  return gulp.src([`${config.srcPath}/**/*.pug`, `!${config.srcPath}/_pug/**/*.pug`, `!${config.srcPath}/_modules/**/*.pug`])
    .pipe(plumber())
    // .pipe(changed(config.tmpPath, { extension: '.html' }))
    .pipe(pug({ pretty: true }))
    .pipe(gulp.dest(config.tmpPath))
})

const sass = require('gulp-sass')
gulp.task('scss', function () {
  return gulp.src([`${config.srcPath}/**/*.{scss,sass}`, `!${config.srcPath}/_scss/**/*.{scss,sass}`, `!${config.srcPath}/_modules/**/*.{scss,sass}`])
    .pipe(plumber())
    // .pipe(changed(config.tmpPath, { extension: '.css' }))
    .pipe(sourcemaps.init())
    .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(config.tmpPath))
})

const babel = require('gulp-babel')
gulp.task('babel', function () {
  return gulp.src([`${config.srcPath}/**/*.js`, `!${config.srcPath}/static/_vendor/**/*.js`])
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(changed(config.tmpPath, { extension: '.js' }))
    .pipe(babel())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(config.tmpPath))
})
// build
gulp.task('build', ['del_dist', 'move__vendor', 'copy', 'build_css', 'build_js', 'imgmin'], function () {
  gulp.start('build_html')
})


gulp.task('del_dist', function () {
  del.sync('dist')
})

gulp.task('move__vendor', function () {
  gulp.src(`${config.srcPath}/static/_vendor/**/*.*`)
    .pipe(gulp.dest('dist/static/_vendor'))
})

gulp.task('copy', function () {
  gulp.src([`${config.srcPath}/**/*.{ico,svg,gif,woff2,eot,ttf,otf,mp4,webm,ogg,mp3,wav,flac,aac}`])
    .pipe(gulp.dest('dist'))
})

const htmlminConfig = {
  // removeComments: true,//清除HTML注释
  collapseWhitespace: true, // 压缩HTML
  // collapseBooleanAttributes: true,//省略布尔属性的值 <input checked='true'/> ==> <input />
  // removeEmptyAttributes: true,//删除所有空格作属性值 <input id='' /> ==> <input />
  // removeScriptTypeAttributes: true,//删除<script>的type='text/javascript'
  // removeStyleLinkTypeAttributes: true,//删除<style>和<link>的type='text/css'
  minifyJS: true, // 压缩页面JS
  minifyCSS: true// 压缩页面CSS
}
const revReplace = require('gulp-rev-replace')
const prefix = require('gulp-prefix')
gulp.task('build_html', function () {
  let manifestJs
  let manifestCss
  if (config.build.versionHash) {
    manifestJs = gulp.src('rev-manifest-js.json')
    manifestCss = gulp.src('rev-manifest-css.json')
  }
  return gulp.src([`${config.srcPath}/**/*.html`, `!${config.srcPath}/static/_vendor/**/*.html`].concat(config.pug ? [`${config.srcPath}/**/*.pug`, `!${config.srcPath}/_pug/**/*.pug`, `!${config.srcPath}/_modules/**/*.pug`] : []))
    .pipe(gulpIf(config.pug, pug({ pretty: true })))
    .pipe(gulpIf(!!config.build.cdn, prefix(config.build.cdn, null)))
    .pipe(gulpIf(config.build.htmlmin, htmlmin(htmlminConfig)))
    .pipe(gulpIf(config.build.versionHash, revReplace({ manifest: manifestJs })))
    .pipe(gulpIf(config.build.versionHash, revReplace({ manifest: manifestCss })))
    .pipe(gulp.dest('dist'))
})

const base64 = require('gulp-base64')

gulp.task('build_css', function () {
  return gulp.src([`${config.srcPath}/**/*.css`, `!${config.srcPath}/static/_vendor/**/*.css`].concat((config.sass || config.scss) ? [`${config.srcPath}/**/*.{scss,sass}`, `!${config.srcPath}/_scss/**/*.scss`, `!${config.srcPath}/_modules/**/*.{scss,sass}`] : []))
    .pipe(gulpIf(config.build.cssSourcemap, sourcemaps.init()))
    .pipe(gulpIf((config.sass || config.scss), sass({ outputStyle: 'expanded' }).on('error', sass.logError)))
    .pipe(gulpIf(!!config.build.base64, base64({ maxImageSize: config.build.base64 })))
    .pipe(postcss())
    .pipe(gulpIf(config.build.cssmin, cleanCSS({ rebase: false })))
    .pipe(gulpIf(config.build.versionHash, rev()))
    .pipe(gulpIf(config.build.cssSourcemap, sourcemaps.write('/maps')))
    .pipe(gulp.dest('dist'))
    .pipe(gulpIf(config.build.versionHash, rev.manifest('rev-manifest-css.json')))
    .pipe(gulpIf(config.build.versionHash, gulp.dest('')))
})
const rev = require('gulp-rev')
gulp.task('build_js', function () {
  return gulp.src([`${config.srcPath}/**/*.js`, `!${config.srcPath}/static/_vendor/**/*.js`])
    .pipe(gulpIf(config.build.jsSourcemap, sourcemaps.init()))
    .pipe(gulpIf(config.babel, babel()))
    .pipe(gulpIf(config.build.jsmin, uglify({ mangle: { reserved: ['require'] }})))   // seajs 模块 保留require关键词
    .pipe(gulpIf(config.build.versionHash, rev()))
    .pipe(gulpIf(config.build.jsSourcemap, sourcemaps.write('/maps')))
    .pipe(gulp.dest('dist'))
    .pipe(gulpIf(config.build.versionHash, rev.manifest('rev-manifest-js.json')))
    .pipe(gulpIf(config.build.versionHash, gulp.dest('')))
})


// 图片压缩
const imagemin = require('gulp-imagemin')
const mozjpeg = require('imagemin-mozjpeg')
const pngquant = require('imagemin-pngquant')
const cache = require('gulp-cache') // 缓存压缩图片，避免重复压缩

gulp.task('imgmin', function () {
  gulp.src(`${config.srcPath}/**/*.{jpg,jpeg,png}`)
    .pipe(cache(imagemin([mozjpeg({ quality: 70 }), pngquant({ quality: 70 })])))
    .pipe(gulp.dest('dist'))
})

//  雪碧图
const spritesmith = require('gulp.spritesmith')
gulp.task('sprites', function () {
  // 读取 sprites
  let spritesList = fs.readdirSync('sprites')
  let sprites = gulp.src('sprites/*/*.{jpg,png}')
  spritesList.forEach((spritesItem) => {
    sprites = sprites.pipe(gulpIf(`${spritesItem}/*.{jpg,png,svg}`, spritesmith({
      imgName: spritesItem + '.png',
      cssName: spritesItem + '.css',
      imgPath: `./${spritesItem}.png`
    })))
  })
  return sprites.pipe(gulp.dest(`${config.srcPath}/static/sprites/`))
})

// 线上模式
gulp.task('start', ['build'], function () {
  browserSync.init({
    server: {
      baseDir: ['dist'],  // 设置服务器的根目录
    },
    middleware,
    port: 8888,
    online: false,
    snippetOptions: {
      ignorePaths: ['/', '/**/*.html'], // 不对任何html进行注入，可以通过是否注入判断是否在 开发模式下
    }
  })
})


// 一个命令兼容webp

gulp.task('webp', ['generateWebp', 'webpcss', 'webphtml'])
const generateWebp = require('gulp-webp')
gulp.task('generateWebp', function () {
  gulp.src('dist/**/*.{png,jpg,jpeg}')
    .pipe(generateWebp())
    .pipe(gulp.dest('./dist'))
})

const webpcss = require('gulp-webpcss')
const cssnano = require('gulp-cssnano')
gulp.task('webpcss', function () {
  gulp.src('dist/**/*.css')
    .pipe(webpcss({
      webpClass: '.__webp__',
      replace_from: /\.(png|jpg|jpeg)/,
      replace_to: '.webp',
    }))
    .pipe(cssnano())
    .pipe(gulp.dest('./dist'))
})

const cheerio = require('gulp-cheerio')
gulp.task('webphtml', function () {
  return gulp
    .src('dist/**/*.html')
    .pipe(cheerio(function ($, file) {
      // 插入webp.js

      var webpJs = fs.readFileSync('__webp__.js', 'utf-8')
      $('head').append(`<script id="__webp__">${webpJs}</script>`)

      $('img[src]:not(.not-webp)').each(function () {
        var imgEl = $(this)
        var src = imgEl.attr('src')
        if (/^http|\.(gif|svg)$/.test(src)) return

        imgEl.css('visibility', 'hidden')
        imgEl.removeAttr('src')
        imgEl.attr('data-src', src)
      })

      if ($('#__webp__').length > 0) return
    }))
    .pipe(gulp.dest('dist'))
})
