'use strict';

const Service = require('egg').Service;
const xss = require('xss');

class HabitService extends Service {
  async createOrEditHabit(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, id, name, type, frequency, completion_times, time_of_days, end_time, sign, encourage } = req;

      const userInfo = await mysql.get('user', { id: uid });
      if (userInfo.type === '1') {
        this.ctx.status = 403;
        return helper.response.error('用户没有该权限');
      }

      const validateMessage = helper.validateForm([
        { value: name, name: '习惯名称', required: true, maxLength: 15 },
        { value: type, name: '习惯频率', required: true },
        { value: frequency, name: '习惯频率', required: true },
        { value: completion_times, name: '完成次数', type: 'posInteger', required: true },
        { value: time_of_days, name: '时分', required: true },
        { value: encourage, name: '鼓励的话', maxLength: 40 },
      ]);

      if (validateMessage) return helper.response.error(validateMessage);

      if (end_time === '') return helper.response.error('结束时间不能为空');

      const commonHabitData = {
        name: xss(name),
        type,
        frequency,
        completion_times,
        time_of_days,
        end_time,
        sign,
        encourage: xss(encourage),
        user_id: uid,
      };

      let result;
      if (id) {
        result = await mysql.update('habit', { id, ...commonHabitData });
      } else {
        result = await mysql.insert('habit', commonHabitData);
      }
      return result.affectedRows === 1 ? helper.response.success() : helper.response.error('操作失败');
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async getHabitDetail(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { id } = req;
      if (!id) return helper.response.error('习惯ID不能为空');

      const result = await mysql.query(
        `SELECT h.id, h.completion_times, h.create_time, h.encourage,h.frequency, h.type, h.name, h.sign, h.status, h.time_of_days, h.user_id, h.superintendent_id, h.end_time, h.clock_count, u.avatar, u.nickname, u.sex, u2.avatar AS avatar2, u2.nickname AS nickname2, c.id AS cid,
        c.status AS cstatus
        FROM habit AS h
        LEFT JOIN user AS u ON h.superintendent_id = u.id
        LEFT JOIN user AS u2 ON h.user_id = u2.id
        LEFT JOIN clock AS c ON h.id = c.habit_id AND to_days(c.create_time) = to_days(now())
        WHERE h.id = ${id}`
      );
      return helper.response.success(result);
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部异常');
    }
  }

  async getHabitInfo(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, status, time_of_days, my_habit, my_superintendent, pageNo = 1, pageSize = 10 } = req;

      const conditionArray = [];
      let condition;

      status && conditionArray.push(`h.status = ${status}`);
      time_of_days && conditionArray.push(`h.time_of_days = ${time_of_days}`);
      my_habit && conditionArray.push(`h.user_id = ${uid}`);
      my_superintendent && conditionArray.push(`h.superintendent_id = ${uid}`);

      if (!conditionArray.length) condition = '';
      else condition = `WHERE  ${conditionArray.join(' AND ')}`;

      const result = await mysql.query(
        `SELECT h.id, h.completion_times, h.create_time, h.encourage,h.frequency, h.type, h.name, h.sign, h.status, h.time_of_days, h.user_id, h.superintendent_id, h.end_time, h.clock_count, u.avatar, u.nickname, u.sex, u2.avatar AS avatar2, u2.nickname AS nickname2, c.id AS cid,
        c.status AS cstatus
        FROM habit AS h
        LEFT JOIN user AS u ON h.superintendent_id = u.id
        LEFT JOIN user AS u2 ON h.user_id = u2.id
        LEFT JOIN clock AS c ON h.id = c.habit_id AND to_days(c.create_time) = to_days(now())
        ${condition}
        ORDER BY h.id DESC
        LIMIT ${(pageNo - 1) * pageSize}, ${pageSize}`
      );

      return helper.response.success(result);
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async getHabitList(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { id, name, status, create_time, time_of_days, cstatus, account, pageNo = 1, pageSize = 10 } = req;

      const conditionArray = [];
      let condition;

      id && conditionArray.push(`h.id = ${id}`);
      status && conditionArray.push(`h.status = ${status}`);
      time_of_days && conditionArray.push(`h.time_of_days = ${time_of_days}`);
      cstatus && conditionArray.push(`c.status = ${cstatus}`);
      create_time && conditionArray.push(`to_days(h.create_time) = to_days(${create_time})`);

      const filterName = mysql.escape(name).replace(/^'|'$/g, '');
      name && conditionArray.push(`h.name LIKE '%${filterName}%'`);

      const filterAccount = mysql.escape(account).replace(/^'|'$/g, '');
      account && conditionArray.push(`u.account LIKE '%${filterAccount}%'`);

      if (!conditionArray.length) condition = '';
      else condition = `WHERE ${conditionArray.join(' AND ')}`;

      // 分页数据
      const result = await mysql.query(
        `SELECT h.id, h.completion_times, h.create_time, h.encourage,h.frequency, h.type, h.name, h.sign, h.status, h.time_of_days, h.user_id, h.superintendent_id, h.end_time, h.clock_count, h.encourage, u.avatar, u.account, c.id AS cid,
        c.status AS cstatus
        FROM habit AS h
        LEFT JOIN user AS u ON h.user_id = u.id
        LEFT JOIN clock AS c ON h.id = c.habit_id AND to_days(c.create_time) = to_days(now())
        ${condition}
        ORDER BY id DESC LIMIT ${(pageNo - 1) * pageSize}, ${pageSize}`
      );

      // 数据总数
      const totalCount = await mysql.query(`
      SELECT COUNT(*) AS count  FROM habit AS h
      LEFT JOIN user AS u ON h.user_id = u.id
      LEFT JOIN clock AS c ON h.id = c.habit_id AND to_days(c.create_time) = to_days(now()) ${condition}`);

      // 习惯完成率
      const completionCount = await mysql.query('SELECT COUNT(*) AS count FROM habit WHERE status = "2"');

      const undoneCount = await mysql.query('SELECT COUNT(*) AS count FROM habit WHERE status = "1"');

      const completionRate =
        completionCount[0].count === 0
          ? 0
          : completionCount[0].count / (completionCount[0].count + undoneCount[0].count);

      return helper.response.success({
        result,
        totalCount: totalCount[0].count,
        completionRate: completionRate.toFixed(0),
      });
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async deleteHabit(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, id } = req;

      if (!id) return helper.response.error('习惯ID不能为空');

      const habitInfo = await mysql.get('habit', { id });
      if (habitInfo.user_id !== Number(uid)) return helper.response.error('用户没有该权限');

      const result = await mysql.delete('habit', { id });
      return result.affectedRows === 1 ? helper.response.success() : helper.response.error('操作失败');
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async editHabitStatus(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { id, status } = req;
      if (!id) return helper.response.error('习惯ID不能为空');

      const result = await mysql.update('habit', {
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

  async addSuperintendent(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { id, superintendent_id } = req;
      if (!id) return helper.response.error('习惯ID不能为空');
      const superintendentInfo = await mysql.get('user', {
        id: superintendent_id,
        type: '0',
      });

      if (!superintendentInfo) return helper.response.error('监督人不存在');

      const result = await mysql.update('habit', {
        id,
        superintendent_id,
      });

      return result.affectedRows === 1 ? helper.response.success() : helper.response.error('操作失败');
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  // 根据打卡记录和约定完成天数改变指定用户习惯的状态
  async changeUserHabitStatus(req) {
    const { habit_id } = req;
    const getHabitReq = { id: habit_id };

    const result = await this.getHabitDetail(getHabitReq);
    const habitDetail = result.data[0];
    const date = new Date();

    // 结束时间为永久或大于当前时间，判断打卡记录与约定次数是否相同，相同则把习惯状态改为已完成
    // 结束时间小于等于当前时间，判断打卡记录与约定次数是否相同，相同则把习惯状态改为已完成,不同就把习惯状态改为未完成
    if (habitDetail.end_time <= date) {
      await this.editHabitStatus({
        id: habitDetail.id,
        status: habitDetail.clock_count === habitDetail.completion_times ? '2' : '0',
      });
    } else if (habitDetail.end_time > date || habitDetail.end_time === '0000-00-00 00:00:00') {
      if (habitDetail.clock_count === habitDetail.completion_times) {
        await this.editHabitStatus({ id: habitDetail.id, status: '2' });
      }
    }
  }

  // 根据打卡记录和约定完成天数改变所有习惯的状态
  async changeHabitStatus() {
    const req = { status: '1', pageNo: 1, pageSize: 100000000 };
    const result = await this.getHabitList(req);
    const habitList = result.data.result;

    const date = new Date();

    for (const item of habitList) {
      // 结束时间为永久或大于当前时间，判断打卡记录与约定次数是否相同，相同则把习惯状态改为已完成
      // 结束时间小于等于当前时间，判断打卡记录与约定次数是否相同，相同则把习惯状态改为已完成,不同就把习惯状态改为未完成

      if (item.end_time <= date) {
        await this.editHabitStatus({
          id: item.id,
          status: item.clock_count === item.completion_times ? '2' : '0',
        });
      } else if (item.end_time > date || item.end_time === '0000-00-00 00:00:00') {
        if (item.clock_count === item.completion_times) {
          await this.editHabitStatus({ id: item.id, status: '2' });
        }
      }
    }
  }

  // 获取状态时进行中和今天要做的习惯
  async getProcessTodayHabit() {
    const req = { status: '1', pageNo: 1, pageSize: 100000 };
    const result = await this.getHabitList(req);
    const habitList = result.data.result;

    const weekDay = new Date().getDay().toString;
    const habitArray = [];

    for (const item of habitList) {
      if (item.type !== '3' || (item.type === '3' && item.frequency.includes(weekDay))) {
        habitArray.push(item);
      }
    }

    return habitArray;
  }
}

module.exports = HabitService;
