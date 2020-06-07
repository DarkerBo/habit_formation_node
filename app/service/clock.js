'use strict';

const Service = require('egg').Service;

class ClockService extends Service {
  async createOrEditClock(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { id, uid, user_id, status, habit_id } = req;

      const commonClockData = {
        status,
        user_id: user_id || uid,
        habit_id,
      };

      const habitInfo = await mysql.get('habit', { id: habit_id });

      let result;
      if (id) {
        result = await mysql.beginTransactionScope(async conn => {
          await conn.update('clock', { id, ...commonClockData });
          await conn.update('habit', {
            id: habit_id,
            clock_count: status === '0' ? habitInfo.clock_count - 1 : habitInfo.clock_count + 1,
          });
          return { success: true };
        }, this.ctx);
      } else {
        result = await mysql.insert('clock', commonClockData);
      }

      return id
        ? result.success
          ? helper.response.success(result)
          : helper.response.error('操作失败')
        : result.affectedRows === 1
          ? helper.response.success()
          : helper.response.error('操作失败');
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async getClockDetail(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { id } = req;
      if (!id) return helper.response.error('打卡记录ID不能为空');
      const result = await mysql.get('clock', { id });
      return helper.response.success(result);
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async getClockInfo(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, status, habit_id, create_time, pageNo = 1, pageSize = 10 } = req;
      const conditionArray = [];
      let condition;

      status && conditionArray.push(`c.status = ${status}`);
      habit_id && conditionArray.push(`c.habit_id = ${habit_id}`);
      create_time && conditionArray.push(`c.create_time LIKE '%${create_time}%'`);

      if (!conditionArray.length) condition = `WHERE c.user_id = ${uid}`;
      else condition = `WHERE c.user_id = ${uid} AND ${conditionArray.join(' AND ')}`;

      const result = await mysql.query(`
        SELECT c.id, c.status, c.user_id, c.habit_id, c.create_time, h.name
        FROM clock AS c
        LEFT JOIN habit AS h ON c.habit_id = h.id
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

  async getClockList(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { user_id, habit_id, pageNo = 1, pageSize = 10 } = req;
      const conditionArray = [];
      let condition;

      user_id && conditionArray.push(`user_id = ${user_id}`);
      habit_id && conditionArray.push(`habit_id = ${habit_id}`);

      if (!conditionArray.length) condition = '';
      else condition = `WHERE ${conditionArray.join(' AND ')}`;

      const result = await mysql.query(`
        SELECT * FROM clock ${condition} ORDER BY id DESC
        LIMIT ${(pageNo - 1) * pageSize}, ${pageSize}
      `);

      return helper.response.success(result);
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async getTodayIsClock(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, status, habit_id } = req;

      const conditionArray = [];
      let condition;

      habit_id && conditionArray.push(`c.habit_id = ${habit_id}`);
      status && conditionArray.push(`c.status = ${status}`);

      if (!conditionArray.length) condition = `WHERE to_days(c.create_time) = to_days(now()) AND c.user_id = ${uid}`;
      else {
        condition = `WHERE to_days(c.create_time) = to_days(now()) AND c.user_id = ${uid} AND ${conditionArray.join(
          ' AND '
        )}`;
      }

      const result = await mysql.query(`
        SELECT c.id, c.habit_id, h.name, u.nickname, u.avatar, c.create_time
        FROM clock AS c
        INNER JOIN habit AS h ON c.habit_id = h.id
        INNER JOIN user AS u ON c.user_id = u.id
        ${condition}
        ORDER BY id DESC
      `);

      return helper.response.success(result);
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async getTodayIsClockList(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, status, habit_id, pageNo = 1, pageSize = 10 } = req;

      const userInfo = await mysql.get('user', { id: uid });
      if (userInfo.type !== '1') return helper.response.error('用户没有该权限');

      const conditionArray = [];
      let condition;

      habit_id && conditionArray.push(`c.habit_id = ${habit_id}`);
      status && conditionArray.push(`c.status = ${status}`);

      if (!conditionArray.length) condition = 'WHERE to_days(c.create_time) = to_days(now())';
      else {
        condition = `WHERE to_days(c.create_time) = to_days(now()) AND ${conditionArray.join(' AND ')}`;
      }

      const result = await mysql.query(`
        SELECT c.id, c.habit_id, h.name, u.nickname, u.avatar, c.create_time
        FROM clock AS c
        INNER JOIN habit AS h ON c.habit_id = h.id
        INNER JOIN user AS u ON c.user_id = u.id
        ${condition}
        ORDER BY id DESC
        LIMIT ${(pageNo - 1) * pageSize}, ${pageSize}
      `);
      // 数据总数
      const totalCount = await mysql.query(`SELECT COUNT(*) AS count FROM clock as c ${condition}`);

      return helper.response.success({
        result,
        totalCount: totalCount[0].count,
      });
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }
}

module.exports = ClockService;
