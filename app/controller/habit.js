'use strict';

const Controller = require('egg').Controller;

class HabitController extends Controller {
  /**
   * @description 创建或编辑习惯。请求参数：id(编辑时传), name, type, frequency,completion_times, time_of_days, end_time, sign, encourage
   */
  async createOrEditHabit() {
    const { query, request, service } = this.ctx;
    const req = { ...query, ...request.body };
    this.ctx.body = await service.habit.createOrEditHabit(req);
  }

  /**
   * @description 获取习惯详情。请求参数：id
   */
  async getHabitDetail() {
    const { query, service } = this.ctx;
    this.ctx.body = await service.habit.getHabitDetail(query);
  }

  /**
   * @description 获取用户习惯信息。请求参数：status,time_of_days, my_habit, my_superintendent, pageNo, pageSize
   */
  async getHabitInfo() {
    const { query, service } = this.ctx;
    this.ctx.body = await service.habit.getHabitInfo(query);
  }

  /**
   * @description 获取习惯列表。请求参数：id, name, status, create_time, time_of_days, cstatus, account, pageNo, pageSize
   */
  async getHabitList() {
    const { query, service } = this.ctx;
    this.ctx.body = await service.habit.getHabitList(query);
  }

  /**
   * @description 删除习惯。请求参数：id
   */
  async deleteHabit() {
    const { query, request, service } = this.ctx;
    const req = { ...query, ...request.body };
    this.ctx.body = await service.habit.deleteHabit(req);
  }

  /**
   * @description 改变习惯的状态。请求参数：habit_id
   */
  async changeUserHabitStatus() {
    const { query, request, service } = this.ctx;
    const req = { ...query, ...request.body };
    this.ctx.body = await service.habit.changeUserHabitStatus(req);
  }

  /**
   * @description 增加习惯的监督人。请求参数：id,superintendent_id
   */
  async addSuperintendent() {
    const { query, request, service } = this.ctx;
    const req = { ...query, ...request.body };
    this.ctx.body = await service.habit.addSuperintendent(req);
  }
}

module.exports = HabitController;
