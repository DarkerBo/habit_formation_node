'use strict';

/** @type Egg.EggPlugin */
module.exports = {
  // 引入mysql
  mysql: {
    enable: true,
    package: 'egg-mysql',
  },

  // 配置CORS跨域
  cors: {
    enable: true,
    package: 'egg-cors',
  },
};
