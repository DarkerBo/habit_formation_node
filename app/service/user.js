'use strict';

const Service = require('egg').Service;
const jwt = require('jsonwebtoken');
const xss = require('xss');
const fs = require('fs');
const path = require('path');

class UserService extends Service {
  async login(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { account, password, type = '0' } = req;
      const validateMessage = helper.validateForm([
        { value: account, name: '账号', required: true, type: 'account', minLength: 4, maxLength: 15 },
      ]);

      if (validateMessage) return helper.response.error(validateMessage);

      const cryptoPassword = helper.encrypt(password);
      const userInfo = await mysql.get('user', { account, password: cryptoPassword, type });
      if (!userInfo) return helper.response.error('用户名或密码错误');
      // 如果该用户存在,先判断该用户是否被冻结
      if (userInfo.status === '1') {
        this.ctx.status = 401;
        return helper.response.error('该用户已被冻结，禁止访问');
      }

      const { key, expiresIn } = this.config.token;
      const token = jwt.sign({ account }, key, { expiresIn });
      const result = await mysql.update('user', { id: userInfo.id, token });

      return result.affectedRows === 1
        ? helper.response.success({ id: userInfo.id, token, type })
        : helper.response.error('操作失败');
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部异常');
    }
  }

  async register(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { account, password, rePassword } = req;
      const validateMessage = helper.validateForm([
        { value: account, name: '账号', required: true, type: 'account', minLength: 4, maxLength: 15 },
        { value: password, name: '密码', required: true, type: 'password', minLength: 6, maxLength: 15 },
      ]);

      if (validateMessage) return helper.response.error(validateMessage);
      if (password !== rePassword) return helper.response.error('两次输入的密码不一致');

      const userInfo = await mysql.get('user', { account });
      if (userInfo) return helper.response.error('该用户已存在，请换个账号注册');

      const cryptoPassword = helper.encrypt(password);
      const { key, expiresIn } = this.config.token;
      const filterAccount = xss(account);
      const token = jwt.sign({ account: filterAccount }, key, { expiresIn });

      const result = await mysql.insert('user', {
        account: filterAccount,
        password: cryptoPassword,
        nickname: filterAccount,
        type: '0',
        token,
      });

      return result.affectedRows === 1
        ? helper.response.success({ id: result.insertId, token })
        : helper.response.error('操作失败');
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async getUserInfo(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const result = await mysql.get('user', {
        id: req.uid,
      });
      return helper.response.success(result);
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部异常');
    }
  }

  async getUserList(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, id, account, nickname, status, pageNo = 1, pageSize = 10 } = req;

      const adminInfo = await mysql.get('user', { id: uid, type: '1' });

      // 管理员才能获取用户列表信息
      if (!adminInfo) {
        this.ctx.status = 403;
        return helper.response.error('非法操作');
      }

      const conditionArray = [];
      let condition;

      id && conditionArray.push(`id = ${id}`);
      status && conditionArray.push(`status = ${status}`);

      const filterNickname = mysql.escape(nickname).replace(/^'|'$/g, '');
      nickname && conditionArray.push(`nickname LIKE '%${filterNickname}%'`);

      const filterAccount = mysql.escape(account).replace(/^'|'$/g, '');
      account && conditionArray.push(`account LIKE '%${filterAccount}%'`);

      if (!conditionArray.length) condition = 'WHERE type = "0"';
      else condition = `WHERE type = "0" AND ${conditionArray.join(' AND ')}`;

      // 分页数据
      const result = await mysql.query(
        `SELECT * FROM user ${condition} ORDER BY id DESC LIMIT ${(pageNo - 1) * pageSize}, ${pageSize}`
      );

      // 数据总数(传递数据的时候要减1，管理员不算)
      const totalCount = await mysql.query(`SELECT COUNT(*) AS count FROM user ${condition}`);

      // 日增长数量
      const dailyGrowth = await mysql.query(
        'SELECT COUNT(*) AS count FROM user WHERE to_days(create_time) = to_days(now())'
      );

      return helper.response.success({
        result,
        totalCount: totalCount[0].count,
        dailyGrowth: dailyGrowth[0].count,
      });
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部异常');
    }
  }

  async modifyUserInfo(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, nickname, sex = '0', motto, files } = req;
      const FILE_TYPE = ['image/jpeg', 'image/jpeg'];
      const AVATAR_FILE_SIZE = 0.5 * 1024 * 1024;
      const BACKGROUND_IMAGE_FILE_SIZE = 1024 * 1024;

      // 表单验证
      const validateMessage = helper.validateForm([
        { value: nickname, name: '昵称', required: true, maxLength: 15 },
        { value: motto, name: '座右铭', maxLength: 60 },
      ]);

      if (validateMessage) return helper.response.error(validateMessage);

      // 昵称不可以重复
      const userInfo = await mysql.get('user', { nickname });
      if (userInfo && userInfo.id !== Number(uid)) return helper.response.error('该昵称已存在');

      let avatarPath = ''; // 头像图片地址
      let backgroundImagePath = ''; // 背景图片地址
      const avatarIndex = files.findIndex(item => item.field === 'files');
      const backgroundImageIndex = files.findIndex(item => item.field === 'backgroundFiles');
      const updateData = {
        id: uid,
        nickname,
        sex,
        motto,
      };

      // 如果上传了头像，将图片存到本地
      if (avatarIndex !== -1) {
        const { mime, filepath } = files[avatarIndex];
        const stat = fs.statSync(filepath);

        if (!FILE_TYPE.includes(mime)) {
          this.ctx.status = 415;
          return helper.response.error('请上传jpg或png格式的图片');
        }

        if (stat.size > AVATAR_FILE_SIZE) {
          this.ctx.status = 413;
          return helper.response.error('上传的头像图片大小超过500K');
        }

        const commonImagePath = `/public/images/user_avatar/${uid}_${Date.now() + path.extname(filepath)}`;

        const writeFilePath = path.join(__dirname, '../', commonImagePath);
        const reader = fs.createReadStream(filepath);
        const writer = fs.createWriteStream(writeFilePath);
        reader.pipe(writer);

        const { protocol, host, port } = this.config;
        const databaseImagePath = `${protocol}://${host}:${port}${commonImagePath}`;
        avatarPath = databaseImagePath;
        updateData.avatar = avatarPath;
      }

      // 如果上传了背景图片，将图片存到本地
      if (backgroundImageIndex !== -1) {
        const { mime, filepath } = files[backgroundImageIndex];
        const stat = fs.statSync(filepath);

        if (!FILE_TYPE.includes(mime)) {
          this.ctx.status = 415;
          return helper.response.error('请上传jpg或png格式的图片');
        }

        if (stat.size > BACKGROUND_IMAGE_FILE_SIZE) {
          this.ctx.status = 413;
          return helper.response.error('上传的背景图片大小超过1M');
        }

        const commonImagePath = `/public/images/user_background_image/${uid}_${Date.now() + path.extname(filepath)}`;

        const writeFilePath = path.join(__dirname, '../', commonImagePath);
        const reader = fs.createReadStream(filepath);
        const writer = fs.createWriteStream(writeFilePath);
        reader.pipe(writer);

        const { protocol, host, port } = this.config;
        const databaseImagePath = `${protocol}://${host}:${port}${commonImagePath}`;
        backgroundImagePath = databaseImagePath;
        updateData.background_image = backgroundImagePath;
      }

      const result = await mysql.update('user', updateData);
      return result.affectedRows === 1 ? helper.response.success() : helper.response.error('操作失败');
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部异常');
    }
  }

  async modifyPassword(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, password, newPassword } = req;

      const cryptoPassword = helper.encrypt(password);
      const userInfo = await mysql.get('user', { id: uid, password: cryptoPassword });

      if (!userInfo) return helper.response.error('原密码不正确');

      // 表单验证
      const validateMessage = helper.validateForm([
        { value: newPassword, name: '新密码', required: true, maxLength: 15 },
      ]);
      if (validateMessage) return helper.response.error(validateMessage);

      const cryptoNewPassword = helper.encrypt(newPassword);
      const result = await mysql.update('user', { id: uid, password: cryptoNewPassword });

      return result.affectedRows === 1 ? helper.response.success() : helper.response.error('操作失败');
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部异常');
    }
  }

  async getNicknameLegal(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, nickname } = req;
      const validateMessage = helper.validateForm([{ value: nickname, name: '昵称', required: true, maxLength: 15 }]);
      if (validateMessage) return helper.response.error(validateMessage);

      // 监督人不可以为管理员或者不存在
      const userInfo = await mysql.get('user', {
        nickname,
        type: '0',
      });

      if (!userInfo) return helper.response.error('监督人不存在');

      if (userInfo.id === Number(uid)) return helper.response.error('监督人不能设置为自己');

      return helper.response.success({ user_id: userInfo.id });
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部异常');
    }
  }

  async freezeOrThawUser(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, id, status } = req;
      if (!id) return helper.response.error('用户ID不能为空');

      const userInfo = await mysql.get('user', { id: uid });
      if (userInfo.type !== '1') return helper.response.error('用户没有该权限');

      const result = await mysql.update('user', {
        id,
        status,
      });

      return result.affectedRows === 1 ? helper.response.success() : helper.response.error('操作失败');
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部异常');
    }
  }
}

module.exports = UserService;
