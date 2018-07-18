# dev-easy (github)[https://github.com/lfyfly/dev-easy.git]

## 1、简介
使用gulp搭建一个传统的多页面前端项目的开发环境

- 支持`pug` `scss` `es6`编译支持
- 支持开发环境和打包生成`sourceMap`
- 支持文件变动自动刷新浏览器，css是热更新（css改动无需刷新浏览器即可更新）
- 支持新增文件没无需重启gulp，即可改动自动刷新浏览器
- 支持命令生成雪碧图和对应css
- 支持eslint，使用的eslint插件是[eslint-config-alloy](https://github.com/AlloyTeam/eslint-config-alloy)
- 支持打包html，css，js图片压缩，css中小图片转base64
- 支持css，js文件版本hash值，文件无变动则版本hash不会改变，更好利用缓存
- 支持html中的css，js，img路径添加cdn域名前缀，css中的图片链接建议使用`相对路径`
- 支持代理，便于跨域调试

## 2、如何使用
### 2.1 下载项目
 （1） `git clone https://github.com/lfyfly/dev-easy.git`或者下载 `zip包`
 
 （2）删除项目下的因此目录`.git`文件夹，这是我的commit记录，所以删除

 （3）`npm install` 安装依赖

 （4）`npm run dev`

### 2.2 命令
### `npm run dev`
进入开发模式

### `npm run build`
打包命令

### `npm run start`
打包并且以`dist`为根目录开启服务器查看效果

### `npm run sp`
把根目录下的sprites文件夹下的子目录内的所有文件夹中的png和jpg的图片，以子文件夹目录为单位生产雪碧图，文件名为子目录名

### `npm run lint`
eslint检测

### `npm run fix`
eslint修复

## 3、 约定的目录
> src是源码目录，可以通过`config.srcPath`进行配置，以下src只目录只是个例子，代表源码目录
#### 3.1 `src/static`
静态文件目录
#### 3.2 `src/static/_vendor`
第三方js，css，iconfont等
#### 3.3 `src/_scss`
scss模块目录，里面的`.scss`文件不会被单独编译成css文件
#### 3.4`src/_pug`
pug模块目录，里面的`.pug`文件不会被单独编译成html文件

#### 4.5 `src/_modules`
该目录里面的`.pug`,`.scss`文件不会被单独编译成html文件

## 4、功能配置文件
根目录下的`config.js`
```
module.exports = {
  srcPath: 'src',
  pug: true,
  scss: true,
  babel: true,
  tmpPath: 'node_modules/__tmp__',
  build: {
    htmlmin: true,
    cssmin: true,
    jsmin: true,
    base64: 10 * 1024, // (bytes) 使用css中图片使用相对路径，否者无效
    cssSourcemap: true,
    jsSourcemap: true,
    cdn: 'http://your/cdn/url/',
    versionHash: true, // 版本hash
  },
  proxyTable: {
    '/api': 'http://localhost:3000',
    '/hehe': {
      target: 'http://localhost:3000',
      pathRewrite: {
        // 地址重写
        '^/hehe': '/api'
      }
    }
  }
}
```
## 5、功能配置项详解
> **如不需要使用某个配置项目，直接将其注释即可**
### srcPath

配置目录源文件目录，默认为`'src'`

### pug

- 值为`true`时，会开启对`src`目录内所有的`.pug`文件（除`src/_pug/`外）编译成html
- `src/_pug`作为pug的模块目录，不会被单独编译为html文件

### scss

- 值为`true`时，会开启对src内所有的`.scss`,`.sass`文件（除`src/_scss`外）编译成scss
- `src/_scss/`作为scss的模块目录，不会被单独编译为css文件


### babel

- 值为`true`时，会开启对`src`目录内所有的`.js`文件（除`src/static/vendor/`外）编译成es5
- babel配置文件，根目录下`.babelrc`文件

### tmpPath

- 默认值为 `'node_modules/__tmp__'`
- `npm run dev`作为`.pug`，`.scss`，`.js`文件编译的临时文件目录，和`src`同为静态文件目录，且优先级高于src目录

    ```
    browserSync.init({
        server: {
          baseDir: [config.tmpPath, 'src'],
        },
        middleware,
        port: 9000,
        online: false
      })
    
    ```
- 编译后文件访问：`src/static/public/public.scss`在html的访问路径为`/static/public/public.css`
- 每次运行`npm run dev` `config.tmpPath`都会被清理

###  打包配置项

config.build | 描述
---|---
htmlmin | 值为`true`时开启html压缩
cssmin | 值为`true`时开启css压缩
jsmin | 值为`true`时开启js压缩
base64 | Number类型，单位（bytes），当css图片大小小于该值时将转base64<br>`css中图片地址必须为相对路径才会生效`<br>
cssSourcemap | 值为`true`时，生成cssSourcemap文件
jsSourcemap | 值为`true`时，生成jsSourcemap文件
cdn | 值为你的cdn地址
versionHash | 值为`true`时，生成css js文件版本hash值
proxyTable | 代理配置，[http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware)

#### proxyTable配置实例
```
  proxyTable: {
    '/api': 'http://localhost:3000',
    '/hehe': {
      target: 'http://localhost:3000',
      pathRewrite: {
        // 地址重写
        '^/hehe': '/api'
      }
    }
  }
```
## 6、项目目录构建示例
### 6.1 Deom-0 见`src`目录
使用html,css,js构建项目

### 6.2 Deom-1 见`src-1`目录
使用pug(可选用),scss,js构建项目
将`config.srcPath`值设为`src-1`即可切换到该项目

## 7、其他
### 7.1 模块化？
推荐使用`sea.js`或`require.js`进行模块管理

### 7.2 为什么不在gulp中配置eslint？
推荐使用浏览器插件进行提示，还可以配置保存时自动修复eslint

### 7.3 js中如何判断是否为开发模式

```
// 当前环境为开发环境
var isDev = !!document.getElementById('__bs_script__')
```
**注意：** isDev只能在body标签内的js中这样获取，或者在`DOMContenLoaded`或`load`事件回调中初始化 isDev

