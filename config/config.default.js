'use strict';

module.exports = {
  // cookie安全字符串
  keys: 's^_gmiD3zdHR5_QCa_5hNRCGi+zJ@Mfu5wnaDxS#RLD_omkYK+_#d$BSgNJX*iS51M&$eg6Wy6nwH#1h',

  // 中间件配置,按顺序执行
  middleware: ['token'],

  // 密码加密key
  cryptoKey: 'qIk$lIl#Nk#qhPQXg$LG)+wKi##En$V7Vi&QWRfL&x&L@NPuq9cFRN^m+)rhV1^LnDRSK#t!BN6LqKPf',

  // 配置mysql
  mysql: {
    client: {
      host: 'localhost', // host, 或者 127.0.0.1
      port: '3306', // 端口号,默认 3306
      user: 'root', // 用户名
      password: '123456', // 密码
      database: 'habit_formation', // 数据库名
    },
  },

  // 配置token
  token: {
    key: 'kXQV6qLCv0B_BPqs5_m6T9^eMT1kSyFcy_DZ8Wb7e~B!k&GKE0o7iqjT2x_8zh&tUvV~2dp5!SCDa1tr',
    expiresIn: '1d',
  },

  // 安全检验配置
  security: {
    csrf: {
      enable: false,
    },
  },

  // 文件上传配置
  multipart: {
    mode: 'file',
  },

  // 跨域配置
  cors: {
    origin: '*',
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
    allowHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization',
    credentials: true,
  },
};
