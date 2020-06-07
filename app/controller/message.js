'use strict';

const Controller = require('egg').Controller;

class MessageController extends Controller {
  /**
   * @description 创建消息。请求参数：id(编辑时传),content, status,habit_id, user1_i
   */
  async createOrEditMessage() {
    const { query, request, service } = this.ctx;
    const req = { ...query, ...request.body };
    this.ctx.body = await service.message.createOrEditMessage(req);
  }

  /**
   * @description 获取接受到的消息。请求参数：my_message, system_message, pageNo, pageSize
   */
  async getMessageInfo() {
    const { query, service } = this.ctx;
    this.ctx.body = await service.message.getMessageInfo(query);
  }

  /**
   * @description 获取接受到的系统通知。请求参数：, pageNo, pageSize
   */
  async getSystemMessageInfo() {
    const { query, service } = this.ctx;
    this.ctx.body = await service.message.getSystemMessageInfo(query);
  }

  /**
   * @description 修改消息。请求参数：id, content,status
   */
  async modifyMessageInfo() {
    const { query, request, service } = this.ctx;
    const req = { ...query, ...request.body };
    this.ctx.body = await service.message.modifyMessageInfo(req);
  }

  /**
   * @description 获取消息详情。请求参数：id
   */
  async getMessageDetail() {
    const { query, service } = this.ctx;
    this.ctx.body = await service.message.getMessageDetail(query);
  }

  /**
   * @description 删除消息。请求参数：id
   */
  async deleteMessage() {
    const { query, request, service } = this.ctx;
    const req = { ...query, ...request.body };
    this.ctx.body = await service.message.deleteMessage(req);
  }

  /**
   * @description 改变消息状态为已读或未读。请求参数：id,read
   */
  async changeMessageRead() {
    const { query, request, service } = this.ctx;
    const req = { ...query, ...request.body };
    this.ctx.body = await service.message.changeMessageRead(req);
  }

  /**
   * @description 创建二级消息。请求参数：content, message_id, user1_id,
   */
  async createMessageDetail() {
    const { query, request, service } = this.ctx;
    const req = { ...query, ...request.body };
    this.ctx.body = await service.message.createMessageDetail(req);
  }

  /**
   * @description 获取接受到的二级消息。请求参数：message_id, pageNo, pageSize
   */
  async getMessageDetailInfo() {
    const { query, service } = this.ctx;
    this.ctx.body = await service.message.getMessageDetailInfo(query);
  }

  /**
   * @description 获取接受到的二级消息列表。请求参数：content, pageNo, pageSize
   */
  async getMessageDetailList() {
    const { query, service } = this.ctx;
    this.ctx.body = await service.message.getMessageDetailList(query);
  }
}

module.exports = MessageController;
