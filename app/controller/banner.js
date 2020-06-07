'use strict';

const Controller = require('egg').Controller;

class BannerController extends Controller {
  /**
   * @description 创建或编辑公告图。请求参数： author, content, picture
   */
  async createOrEditBanner() {
    const { query, request, service } = this.ctx;
    const req = { ...query, ...request.body, picture: request.files };
    this.ctx.body = await service.banner.createOrEditBanner(req);
  }

  /**
   * @description 获取公告图信息。不需要请求参数，前端已经把请求信息放到地址栏中
   */
  async getBannerInfo() {
    const { query, service } = this.ctx;
    this.ctx.body = await service.banner.getBannerInfo(query);
  }
}

module.exports = BannerController;
