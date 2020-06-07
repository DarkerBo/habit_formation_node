'use strict';

const Service = require('egg').Service;
const fs = require('fs');
const path = require('path');

class BannerService extends Service {
  async createOrEditBanner(req) {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const { uid, author, content, picture } = req;
      const validateMessage = helper.validateForm([
        { value: content, name: '内容', required: true },
        { value: author, name: '出处', required: true },
      ]);

      if (validateMessage) return helper.response.error(validateMessage);

      if (!picture.length) return helper.response.error('公告图不能为空');

      const userInfo = await mysql.get('user', { id: uid });
      if (userInfo.type !== '1') return helper.response.error('用户没有该权限');

      const FILE_TYPE = ['image/jpeg', 'image/png'];
      const { mime, filepath } = picture[0];

      if (!FILE_TYPE.includes(mime)) {
        this.ctx.status = 415;
        return helper.response.error('请上传正确图片格式');
      }

      const commonImgPath = `/public/images/banner_picture/${uid}_${Date.now() + path.extname(filepath)}`;

      const writeFilePath = path.join(__dirname, '../', commonImgPath);
      const reader = fs.createReadStream(filepath);
      const writer = fs.createWriteStream(writeFilePath);
      reader.pipe(writer);

      const { protocol, host, port } = this.config;
      const databaseImgPath = `${protocol}://${host}:${port}${commonImgPath}`;

      const commonBannerData = {
        author,
        content,
        picture: databaseImgPath,
      };

      const bannerInfo = await mysql.select('banner');

      let result;
      if (bannerInfo[0]) {
        result = await mysql.update('banner', { id: bannerInfo[0].id, ...commonBannerData });
      } else {
        result = await mysql.insert('banner', commonBannerData);
      }

      return result.affectedRows === 1 ? helper.response.success() : helper.response.error('操作失败');
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }

  async getBannerInfo() {
    const { helper } = this.ctx;
    const { mysql } = this.app;

    try {
      const result = await mysql.select('banner');

      return helper.response.success(result);
    } catch (error) {
      this.logger.error(error);
      this.ctx.status = 500;
      return helper.response.error('服务器内部错误');
    }
  }
}

module.exports = BannerService;
