'use strict';

const Controller = require('egg').Controller;

class ClockController extends Controller {
  /**
   * @description 创建或修改打卡记录。请求参数：id(编辑时传),user_id(默认为uid), status, habit_id
   */
  async createOrEditClock() {
    const { query, request, service } = this.ctx;
    const req = { ...query, ...request.body };
    this.ctx.body = await service.clock.createOrEditClock(req);
  }

  /**
   * @description 获取用户打卡记录。请求参数：habit_id,create_time, pageNo, pageSize
   */
  async getClockInfo() {
    const { query, service } = this.ctx;
    this.ctx.body = await service.clock.getClockInfo(query);
  }

  /**
   * @description 获取打卡记录。请求参数：user_id,habit_id, pageNo, pageSize
   */
  async getClockList() {
    const { query, service } = this.ctx;
    this.ctx.body = await service.clock.getClockList(query);
  }
  /**
   * @description 获取今天打卡记录。请求参数：status,habit_id
   */
  async getTodayIsClock() {
    const { query, service } = this.ctx;
    this.ctx.body = await service.clock.getTodayIsClock(query);
  }

  /**
   * @description 获取今天打卡记录列表。请求参数：status,habit_id,pageNo,pageSize
   */
  async getTodayIsClockList() {
    const { query, service } = this.ctx;
    this.ctx.body = await service.clock.getTodayIsClockList(query);
  }
}

module.exports = ClockController;
