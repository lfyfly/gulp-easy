module.exports = {
  extends: [
    'eslint-config-alloy',
  ],
  globals: {
    // 这里填入你的项目需要的全局变量
    // 这里值为 false 表示这个全局变量不允许被重新赋值，比如：
    jQuery: false,
    $: false,
    define: false,
    requirejs: false,
    seajs: false,
    Base: false
  },
  rules: {
    // 这里填入你的项目需要的个性化配置，比如：
    //
    // // @fixable 一个缩进必须用两个空格替代
    semi: ['error', 'never'], // 不要分号
    quotes: ["error", "single"], //  单引号
    'no-var': 0,
    'indent': [
      'error',
      2,
      {
        SwitchCase: 1,
        flatTernaryExpressions: true
      }
    ]
  }
};