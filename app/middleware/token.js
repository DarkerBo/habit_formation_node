'use strict';

const jwt = require('jsonwebtoken');

module.exports = (options, app) => async (ctx, next) => {
  // 不用经过token验证的路由
  const filterPath = ['/user/register', '/user/login', '/admin/login'];

  if (filterPath.includes(ctx.path)) {
    await next();
    return;
  }

  try {
    const initialToken = ctx.headers.authorization || '';
    let token = '';
    if (initialToken.startsWith('Bearer ')) {
      token = initialToken.replace('Bearer ', '');
    }
    const uid = ctx.query.uid;
    const userInfo = await app.mysql.get('user', { id: uid, token });

    if (!userInfo) {
      ctx.status = 401;
      ctx.body = ctx.helper.response.error('登陆状态已失效，请重新登陆');
      return;
    }

    if (userInfo.status === '1') {
      ctx.status = 403;
      ctx.body = ctx.helper.response.error('该用户已被冻结，禁止访问');
      return;
    }

    try {
      jwt.verify(token, options.key);
    } catch (error) {
      ctx.status = 401;
      ctx.body = ctx.helper.response.error('token已失效，请重新登陆');
      return;
    }
    await next();
  } catch (error) {
    app.logger.error(error);
    ctx.status = 500;
    ctx.body = ctx.helper.response.error('服务器内部异常');
  }
};
