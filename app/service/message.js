'use strict';

const Service = require('egg').Service;

class MessageService extends Service {
  async createOrEditMessage(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, id, content, status, habit_id, user1_id } = req;
      const validateMessage = helper.validateForm([
        { value: content, name: '内容', required: true, maxLength: 100 },
        { value: status, name: '状态', required: true },
        { value: habit_id, name: '习惯ID', required: true },
      ]);

      if (validateMessage) return helper.response.error(validateMessage);

      const commonMessageData = {
        content,
        status,
        read: '0',
        habit_id,
      };

      let result;
      if (id) {
        result = await mysql.update('message', { id, user1_id: uid, ...commonMessageData });
      } else {
        result = await mysql.insert('message', { user2_id: uid, user1_id, ...commonMessageData });
      }

      return result.affectedRows === 1 ? helper.response.success() : helper.response.error('操作失败');
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async getMessageInfo(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, habit_id, pageNo = 1, pageSize = 10 } = req;
      const conditionArray = [];
      let condition;

      habit_id && conditionArray.push(`m.habit_id = ${habit_id}`);

      if (!conditionArray.length) condition = `WHERE m.user2_id <> ${1} AND m.user1_id = ${uid} OR m.user2_id = ${uid}`;
      else {
        condition = `WHERE m.user2_id <> ${1} AND m.user1_id = ${uid} OR m.user2_id = ${uid} AND ${conditionArray.join(
          ' AND '
        )}`;
      }

      const result = await mysql.query(`
        SELECT m.id, m.content, m.status, m.read, m.habit_id, m.user1_id, m.user2_id, m.create_time, u1.nickname AS nickname1, u1.avatar AS avatar1, u2.nickname AS nickname2, u2.avatar AS avatar2
        FROM message AS m
        INNER JOIN user AS u1 ON m.user1_id = u1.id
        INNER JOIN user AS u2 ON m.user2_id = u2.id
        ${condition}
        ORDER BY id DESC
        LIMIT ${(pageNo - 1) * pageSize}, ${pageSize}
      `);
      return helper.response.success(result);
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async getSystemMessageInfo(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, pageNo = 1, pageSize = 10 } = req;
      const result = await mysql.query(`
      SELECT m.id, m.content, m.status, m.read, m.habit_id, m.user1_id, m.user2_id, m.create_time, u.nickname, u.avatar
      FROM message AS m
      INNER JOIN user AS u ON m.user1_id = u.id
      WHERE m.user2_id = ${1} AND m.user1_id = ${uid}
      ORDER BY id DESC
      LIMIT ${(pageNo - 1) * pageSize}, ${pageSize}
    `);
      return helper.response.success(result);
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async modifyMessageInfo(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { id, content, status } = req;

      const result = await mysql.update('message', {
        id,
        content,
        status,
      });
      return result.affectedRows === 1 ? helper.response.success() : helper.response.error('操作失败');
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async getMessageDetail(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { id } = req;
      const result = await mysql.query(`
      SELECT m.id, m.content, m.status, m.read, m.habit_id, m.user1_id, m.user2_id, m.create_time, u.nickname, u.avatar, u.sex,h.name, h.type, h.frequency, h.completion_times, h.end_time, h.time_of_days
      FROM message AS m
      INNER JOIN user AS u ON m.user2_id = u.id
      INNER JOIN habit AS h ON m.habit_id = h.id
      WHERE m.id = ${id}
    `);
      return helper.response.success(result);
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async deleteMessage(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, id } = req;
      if (!id) return helper.response.error('消息ID不能为空');

      const MessageInfo = await mysql.get('message', { id });
      const { user1_id, user2_id } = MessageInfo;
      if (user1_id !== Number(uid) && user2_id !== Number(uid)) return helper.response.error('用户没有该权限');

      const result = await mysql.delete('message', { id });
      return result.affectedRows === 1 ? helper.response.success() : helper.response.error('操作失败');
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async changeMessageRead(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, id, read } = req;
      if (!id) return helper.response.error('消息ID不能为空');

      const MessageInfo = await mysql.get('message', { id });
      const { user1_id, user2_id } = MessageInfo;
      if (user1_id !== Number(uid) && user2_id !== Number(uid)) return helper.response.error('用户没有该权限');

      const result = await mysql.update('message', {
        id,
        read,
      });
      return result.affectedRows === 1 ? helper.response.success() : helper.response.error('操作失败');
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async createMessageDetail(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, content, message_id, user1_id } = req;
      const validateMessage = helper.validateForm([
        { value: content, name: '消息内容', required: true, maxLength: 100 },
      ]);

      if (validateMessage) return helper.response.error(validateMessage);

      const result = await mysql.insert('message_detail', {
        content,
        message_id,
        user1_id,
        user2_id: uid,
      });

      return result.affectedRows === 1 ? helper.response.success() : helper.response.error('操作失败');
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async getMessageDetailInfo(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { message_id, pageNo = 1, pageSize = 10 } = req;

      const result = await mysql.query(`
      SELECT m.id, m.content, m.message_id, m.user1_id, m.user2_id, m.create_time, u1.nickname AS nickname1, u1.avatar AS avatar1, u2.nickname AS nickname2, u2.avatar AS avatar2, ms.habit_id
      FROM message_detail AS m
      INNER JOIN message AS ms ON m.message_id = ms.id
      INNER JOIN user AS u1 ON m.user1_id = u1.id
      INNER JOIN user AS u2 ON m.user2_id = u2.id
      WHERE message_id = ${message_id}
      ORDER BY create_time ASC
      LIMIT ${(pageNo - 1) * pageSize}, ${pageSize}
      `);

      return helper.response.success(result);
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async getMessageDetailList(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { content, pageNo = 1, pageSize = 10 } = req;
      const conditionArray = [];
      let condition;

      content && conditionArray.push(`m.content = '${content}'`);

      if (!conditionArray.length) condition = '';
      else condition = `WHERE ${conditionArray.join(' AND ')}`;

      const result = await mysql.query(`
      SELECT m.id, m.content, m.message_id, m.user1_id, m.user2_id, m.create_time, u1.nickname AS nickname1, u1.avatar AS avatar1, u2.nickname AS nickname2, u2.avatar AS avatar2, ms.habit_id
      FROM message_detail AS m
      INNER JOIN message AS ms ON m.message_id = ms.id
      INNER JOIN user AS u1 ON m.user1_id = u1.id
      INNER JOIN user AS u2 ON m.user2_id = u2.id
      ${condition}
      ORDER BY create_time DESC
      LIMIT ${(pageNo - 1) * pageSize}, ${pageSize}
      `);

      return helper.response.success(result);
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }
}

module.exports = MessageService;
