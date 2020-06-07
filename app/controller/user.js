'use strict';

const Controller = require('egg').Controller;

class UserController extends Controller {
  /**
   * @description 登录。请求参数：account, password, type
   */
  async login() {
    const { request, service } = this.ctx;
    const req = request.body;
    this.ctx.body = await service.user.login(req);
  }

  /**
   * @description 用户注册。请求参数：account, password, rePassword
   */
  async register() {
    const { request, service } = this.ctx;
    const req = request.body;
    this.ctx.body = await service.user.register(req);
  }

  /**
   * @description 获取用户信息。不需要请求参数，前端已经自动加uid在地址栏中
   */
  async getUserInfo() {
    const { query, service } = this.ctx;
    this.ctx.body = await service.user.getUserInfo(query);
  }

  /**
   * @description 获取用户信息列表。请求参数：id, account, nickname, status, pageNo, pageSize
   */
  async getUserList() {
    const { query, service } = this.ctx;
    this.ctx.body = await service.user.getUserList(query);
  }

  /**
   * @description 修改用户信息。请求参数：nickname, sex, motto, files, backgroundFiles
   */
  async modifyUserInfo() {
    const { query, request, service } = this.ctx;
    const req = { ...query, ...request.body, files: request.files };
    this.ctx.body = await service.user.modifyUserInfo(req);
  }

  /**
   * @description 修改用户密码。请求参数：password, newPassword
   */
  async modifyPassword() {
    const { query, request, service } = this.ctx;
    const req = { ...query, ...request.body };
    this.ctx.body = await service.user.modifyPassword(req);
  }

  /**
   * @description 判断监督人昵称是否合法。请求参数：nickname
   */
  async getNicknameLegal() {
    const { query, service } = this.ctx;
    this.ctx.body = await service.user.getNicknameLegal(query);
  }

  /**
   * @description 冻结或解冻用户。请求参数：id, status
   */
  async freezeOrThawUser() {
    const { query, request, service } = this.ctx;
    const req = { ...query, ...request.body };
    this.ctx.body = await service.user.freezeOrThawUser(req);
  }
}

module.exports = UserController;
