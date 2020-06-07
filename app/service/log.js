'use strict';

const Service = require('egg').Service;
const uuidv4 = require('uuid/v4');
const fs = require('fs');
const path = require('path');

class LogService extends Service {
  async createLog(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, content, picture, private_log, topping, habit_id } = req;
      const validateMessage = helper.validateForm([
        { value: content, name: '内容', required: true, maxLength: 150 },
        { value: private_log, name: '私密状态', required: true },
        { value: topping, name: '置顶状态', required: true },
        { value: habit_id, name: '习惯ID', required: true },
      ]);

      if (validateMessage) return helper.response.error(validateMessage);

      const FILE_TYPE = ['image/jpeg', 'image/png'];
      const databasePicturePath = [];

      if (picture.length) {
        for (const file of picture) {
          if (!FILE_TYPE.includes(file.mime)) {
            this.ctx.status = 415;
            return helper.response.error('请上传图片格式');
          }
        }

        // 配置日志图片路径
        const commentPicturePath = picture.map(file => {
          return `/public/images/log_picture/${uuidv4() + path.extname(file.filepath)}`;
        });

        const { protocol, host, port } = this.config;

        for (const [index, file] of picture.entries()) {
          const currentPath = commentPicturePath[index];
          databasePicturePath.push(`${protocol}://${host}:${port}${currentPath}`);

          const writePicturePath = path.join(__dirname, '../', currentPath);
          const reader = fs.createReadStream(file.filepath);
          const writer = fs.createWriteStream(writePicturePath);
          reader.pipe(writer);
        }
      }

      const result = await mysql.insert('log', {
        content,
        picture: databasePicturePath.join(','),
        private_log,
        topping,
        habit_id,
        user_id: uid,
      });
      return result.affectedRows === 1 ? helper.response.success() : helper.response.error('操作失败');
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async getLogInfo(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, pageNo = 1, pageSize = 10 } = req;

      const result = await mysql.query(`
        SELECT l.id, l.content, l.picture, l.topping, l.private_log, l.user_id, l.habit_id, l.create_time, l.like_count, l.comment_count, p.id AS pid, u.nickname, u.avatar, u.sex, h.name
        FROM log AS l
        INNER JOIN user AS u ON l.user_id = u.id
        INNER JOIN habit AS h ON l.habit_id = h.id
        LEFT JOIN prefer AS p ON l.id = p.log_id AND p.user_id = ${uid}
        WHERE l.user_id = ${uid}
        ORDER BY if (l.topping='1',0,1),l.topping, id DESC
        LIMIT ${(pageNo - 1) * pageSize}, ${pageSize}
      `);

      return helper.response.success(result);
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async getLogList(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, id, nickname, topping, pageNo = 1, pageSize = 10 } = req;

      const conditionArray = [];
      let condition;

      id && conditionArray.push(`l.id = ${id}`);
      topping && conditionArray.push(`l.topping = ${topping}`);

      const filterNickname = mysql.escape(nickname).replace(/^'|'$/g, '');
      nickname && conditionArray.push(`u.nickname LIKE '%${filterNickname}%'`);

      if (!conditionArray.length) condition = 'WHERE private_log = "0" ';
      else condition = `WHERE private_log = '0' AND ${conditionArray.join(' AND ')}`;

      // 分页数据
      const result = await mysql.query(
        `SELECT l.id, l.content, l.picture, l.topping, l.private_log, l.user_id, l.habit_id, l.create_time, l.like_count, l.comment_count,p.id AS pid, u.nickname, u.avatar, u.sex, h.name
        FROM log AS l
        INNER JOIN user AS u ON l.user_id = u.id
        INNER JOIN habit AS h ON l.habit_id = h.id
        LEFT JOIN prefer AS p ON l.id = p.log_id AND p.user_id = ${uid}
        ${condition}
        ORDER BY if (l.topping='1',0,1),l.topping, id DESC
        LIMIT ${(pageNo - 1) * pageSize}, ${pageSize}`
      );

      // 数据总数
      const totalCount = await mysql.query(`SELECT COUNT(*) AS count FROM log AS l
      INNER JOIN user AS u ON l.user_id = u.id ${condition}`);

      return helper.response.success({ result, totalCount: totalCount[0].count });
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async getLogDetail(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, id } = req;
      if (!id) return helper.response.error('日志ID不能为空');
      const logInfo = await mysql.get('log', { id });
      if (logInfo.private_log === '1' && logInfo.user_id !== Number(uid)) {
        return helper.response.error('没有权限获取该日志详情');
      }

      const result = await mysql.query(`
        SELECT l.id, l.content, l.picture, l.topping, l.private_log, l.user_id, l.habit_id, l.create_time, p.id AS pid,  l.like_count, l.comment_count,
        u.nickname, u.avatar, u.sex, h.name
        FROM log AS l
        INNER JOIN user AS u ON l.user_id = u.id
        INNER JOIN habit AS h ON l.habit_id = h.id
        LEFT JOIN prefer AS p ON l.id = p.log_id AND p.user_id = ${uid}
        WHERE l.id = ${id}
      `);

      return helper.response.success(result);
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async deleteLog(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, id } = req;
      if (!id) return helper.response.error('日志ID不能为空');

      const logInfo = await mysql.get('log', { id });
      const userInfo = await mysql.get('user', { id: uid });
      if (!(logInfo.user_id === Number(uid) || userInfo.type === '1')) return helper.response.error('用户没有该权限');

      const result = await mysql.delete('log', { id });
      return result.affectedRows === 1 ? helper.response.success() : helper.response.error('操作失败');
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async changeLogTopping(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, id, topping } = req;
      if (!id) return helper.response.error('日志ID不能为空');

      const userInfo = await mysql.get('user', { id: uid });
      if (userInfo.type === '0') return helper.response.error('用户没有该权限');

      const result = await mysql.update('log', {
        id,
        topping,
      });
      return result.affectedRows === 1 ? helper.response.success() : helper.response.error('操作失败');
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async changeLogPrivate(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, id, private_log } = req;
      if (!id) return helper.response.error('日志ID不能为空');

      const userInfo = await mysql.get('user', { id: uid });
      if (userInfo.id !== Number(uid)) return helper.response.error('用户没有该权限');

      const result = await mysql.update('log', {
        id,
        private_log,
      });
      return result.affectedRows === 1 ? helper.response.success() : helper.response.error('操作失败');
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async createLogComment(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, content, status, log_id } = req;

      const validateMessage = helper.validateForm([
        { value: content, name: '内容', required: true, maxLength: 100 },
        { value: status, name: '评论状态', required: true },
        { value: log_id, name: '日志ID', required: true },
      ]);

      if (validateMessage) return helper.response.error(validateMessage);

      const logInfo = await mysql.get('log', { id: log_id });

      const result = await mysql.beginTransactionScope(async conn => {
        await conn.insert('comment', {
          content,
          status,
          log_id,
          user_id: uid,
        });
        await conn.update('log', { id: log_id, comment_count: logInfo.comment_count + 1 });
        return { success: true };
      }, this.ctx);

      return result.success ? helper.response.success(result) : helper.response.error('操作失败');
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async getLogCommentList(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { account, log_id, status, pageNo = 1, pageSize = 10 } = req;
      const conditionArray = [];
      let condition;

      const filterAccount = mysql.escape(account).replace(/^'|'$/g, '');
      account && conditionArray.push(`u.account LIKE '%${filterAccount}%'`);
      log_id && conditionArray.push(`log_id = ${log_id}`);
      status && conditionArray.push(`c.status = ${status}`);

      if (!conditionArray.length) condition = '';
      else condition = `WHERE ${conditionArray.join(' AND ')}`;

      // 分页数据
      const result = await mysql.query(
        `SELECT c.id, c.content, c.status, c.user_id, c.log_id, c.create_time,
        u.nickname, u.avatar, u.sex, u.account
        FROM comment AS c
        INNER JOIN user AS u ON c.user_id = u.id
        ${condition}
        ORDER BY if (c.status='1',0,1),c.status, id DESC
        LIMIT ${(pageNo - 1) * pageSize}, ${pageSize}`
      );

      // 数据总数
      const totalCount = await mysql.query(
        `SELECT COUNT(*) AS count FROM comment AS c INNER JOIN user AS u ON c.user_id = u.id  ${condition}`
      );

      return helper.response.success({ result, totalCount: totalCount[0].count });
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async changeLogCommentStatus(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, id, status } = req;
      if (!id) return helper.response.error('日志评论ID不能为空');

      const userInfo = await mysql.get('user', { id: uid });
      if (userInfo.type !== '1') return helper.response.error('用户没有该权限');

      const result = await mysql.update('comment', {
        id,
        status,
      });
      return result.affectedRows === 1 ? helper.response.success() : helper.response.error('操作失败');
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async getLogCommentBySort(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { log_id, sort, pageNo = 1, pageSize = 10 } = req;

      const result = await mysql.query(`
        SELECT c.id, c.content, c.status, c.user_id, c.log_id, c.create_time,
        u.nickname, u.avatar, u.sex
        FROM comment AS c
        INNER JOIN user AS u ON c.user_id = u.id
        WHERE c.log_id = ${log_id}
        ORDER BY if (c.status='1',0,1),c.status, id ${sort === '0' ? 'DESC' : 'ASC'}
        LIMIT ${(pageNo - 1) * pageSize}, ${pageSize}
      `);

      const totalCount = await mysql.query('SELECT COUNT(*) AS count FROM comment');
      return helper.response.success({ result, totalCount: totalCount[0].count });
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async deleteLogComment(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, id, log_id } = req;
      if (!id) return helper.response.error('日志评论ID不能为空');

      const commentInfo = await mysql.get('comment', { id });
      const userInfo = await mysql.get('user', { id: uid });
      if (!(commentInfo.user_id === Number(uid) || userInfo.type === '1')) {
        return helper.response.error('用户没有该权限');
      }

      const logInfo = await mysql.get('log', { id: log_id });

      const result = await mysql.beginTransactionScope(async conn => {
        await conn.delete('comment', {
          id,
        });
        await conn.update('log', { id: log_id, comment_count: logInfo.comment_count - 1 });
        return { success: true };
      }, this.ctx);

      return result.success ? helper.response.success(result) : helper.response.error('操作失败');
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async createLogLike(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, log_id } = req;
      if (!log_id) return helper.response.error('日志ID不能为空');

      const logInfo = await mysql.get('log', { id: log_id });

      const result = await mysql.beginTransactionScope(async conn => {
        await conn.insert('prefer', {
          user_id: uid,
          log_id,
        });
        await conn.update('log', { id: log_id, like_count: logInfo.like_count + 1 });
        return { success: true };
      }, this.ctx);

      return result.success ? helper.response.success(result) : helper.response.error('操作失败');
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async getLogLikeList(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { log_id, user_id } = req;
      if (!log_id) return helper.response.error('日志ID不能为空');

      const conditionArray = [];
      let condition;

      log_id && conditionArray.push(`log_id = ${log_id}`);
      user_id && conditionArray.push(`user_id = ${user_id}`);

      if (!conditionArray.length) condition = '';
      else condition = `WHERE ${conditionArray.join(' AND ')}`;

      const result = await mysql.query(`SELECT * FROM prefer ${condition}`);

      // 数据总数
      const totalCount = await mysql.query('SELECT COUNT(*) AS count FROM `prefer`' + condition);

      return helper.response.success({ result, totalCount: totalCount[0].count });
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async deleteLogLike(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { log_id, uid } = req;
      if (!log_id) return helper.response.error('日志ID不能为空');

      const logInfo = await mysql.get('log', { id: log_id });

      const result = await mysql.beginTransactionScope(async conn => {
        await conn.delete('prefer', {
          log_id,
          user_id: uid,
        });
        await conn.update('log', { id: log_id, like_count: logInfo.like_count - 1 });
        return { success: true };
      }, this.ctx);

      return result.success ? helper.response.success(result) : helper.response.error('操作失败');
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }
}

module.exports = LogService;
