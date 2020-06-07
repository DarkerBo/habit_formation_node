'use strict';

const Controller = require('egg').Controller;

class LogController extends Controller {
  /**
   * @description 创建日志。请求参数： content, picture, private_log,topping, habit_id
   */
  async createLog() {
    const { query, request, service } = this.ctx;
    const req = { ...query, ...request.body, picture: request.files };
    this.ctx.body = await service.log.createLog(req);
  }

  /**
   * @description 获取日志信息。 请求参数：pageNo, pageSize
   */
  async getLogInfo() {
    const { query, service } = this.ctx;
    this.ctx.body = await service.log.getLogInfo(query);
  }

  /**
   * @description 获取日志列表。请求参数：id, nickname, topping, pageNo, pageSize
   */
  async getLogList() {
    const { query, service } = this.ctx;
    this.ctx.body = await service.log.getLogList(query);
  }

  /**
   * @description 获取日志详情。请求参数：id,
   */
  async getLogDetail() {
    const { query, service } = this.ctx;
    this.ctx.body = await service.log.getLogDetail(query);
  }

  /**
   * @description 删除日志。请求参数：id
   */
  async deleteLog() {
    const { query, request, service } = this.ctx;
    const req = { ...query, ...request.body };
    this.ctx.body = await service.log.deleteLog(req);
  }

  /**
   * @description 是否置顶日志。请求参数：id,topping
   */
  async changeLogTopping() {
    const { query, request, service } = this.ctx;
    const req = { ...query, ...request.body };
    this.ctx.body = await service.log.changeLogTopping(req);
  }

  /**
   * @description 将日志设为私密或公开。请求参数：id,private_log
   */
  async changeLogPrivate() {
    const { query, request, service } = this.ctx;
    const req = { ...query, ...request.body };
    this.ctx.body = await service.log.changeLogPrivate(req);
  }

  /**
   * @description 创建日志评论。请求参数： content, status, log_id
   */
  async createLogComment() {
    const { query, request, service } = this.ctx;
    const req = { ...query, ...request.body };
    this.ctx.body = await service.log.createLogComment(req);
  }

  /**
   * @description 获取日志评论列表。请求参数： account, log_id, status,pageNo, pageSize
   */
  async getLogCommentList() {
    const { query, service } = this.ctx;
    this.ctx.body = await service.log.getLogCommentList(query);
  }

  /**
   * @description 将日志评论设为置顶或非置顶。请求参数：id,status
   */
  async changeLogCommentStatus() {
    const { query, request, service } = this.ctx;
    const req = { ...query, ...request.body };
    this.ctx.body = await service.log.changeLogCommentStatus(req);
  }

  /**
   * @description 将日志评论根据日期排序。请求参数：log_id,sort
   */
  async getLogCommentBySort() {
    const { query, service } = this.ctx;
    this.ctx.body = await service.log.getLogCommentBySort(query);
  }

  /**
   * @description 删除日志评论。请求参数：id,log_id
   */
  async deleteLogComment() {
    const { query, request, service } = this.ctx;
    const req = { ...query, ...request.body };
    this.ctx.body = await service.log.deleteLogComment(req);
  }

  /**
   * @description 创建点赞。请求参数： log_id
   */
  async createLogLike() {
    const { query, request, service } = this.ctx;
    const req = { ...query, ...request.body };
    this.ctx.body = await service.log.createLogLike(req);
  }

  /**
   * @description 获取日志点赞总数。请求参数： log_id
   */
  async getLogLikeList() {
    const { query, service } = this.ctx;
    this.ctx.body = await service.log.getLogLikeList(query);
  }

  /**
   * @description 删除日志点赞。请求参数：log_id
   */
  async deleteLogLike() {
    const { query, request, service } = this.ctx;
    const req = { ...query, ...request.body };
    this.ctx.body = await service.log.deleteLogLike(req);
  }
}

module.exports = LogController;
