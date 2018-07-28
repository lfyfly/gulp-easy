module.exports = {
  srcPath: 'src',
  tmpPath: 'node_modules/__tmp__',
  pug: true,
  scss: true,
  babel: true,
  build: {
    htmlmin: true,
    cssmin: true,
    jsmin: true,
    base64: 4 * 1024, // (bytes) 使用css中图片使用相对路径，否者无效
    // cssSourcemap: true,
    // jsSourcemap: true,
    // cdn: 'http://your/cdn/url',
    versionHash: true, // 版本hash
  },
  // proxyTable: {
  //   '/api': 'http://localhost:3000',
  //   '/hehe': {
  //     target: 'http://localhost:3000',
  //     pathRewrite: {
  //       // 地址重写
  //       '^/hehe': '/api'
  //     }
  //   }
  // }
}