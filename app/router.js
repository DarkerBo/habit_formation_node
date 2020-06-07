'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;

  // user路由配置
  router.post('/user/login', controller.user.login);
  router.post('/user/register', controller.user.register);
  router.get('/user/getUserInfo', controller.user.getUserInfo);
  router.get('/user/getUserList', controller.user.getUserList);
  router.post('/user/modifyUserInfo', controller.user.modifyUserInfo);
  router.post('/user/modifyPassword', controller.user.modifyPassword);
  router.get('/user/getNicknameLegal', controller.user.getNicknameLegal);
  router.post('/user/freezeOrThawUser', controller.user.freezeOrThawUser);

  // habit路由配置
  router.post('/habit/createOrEditHabit', controller.habit.createOrEditHabit);
  router.get('/habit/getHabitDetail', controller.habit.getHabitDetail);
  router.get('/habit/getHabitInfo', controller.habit.getHabitInfo);
  router.get('/habit/getHabitList', controller.habit.getHabitList);
  router.post('/habit/deleteHabit', controller.habit.deleteHabit);
  router.post('/habit/changeUserHabitStatus', controller.habit.changeUserHabitStatus);
  router.post('/habit/addSuperintendent', controller.habit.addSuperintendent);

  // clock路由配置
  router.post('/clock/createOrEditClock', controller.clock.createOrEditClock);
  router.get('/clock/getClockInfo', controller.clock.getClockInfo);
  router.get('/clock/getClockList', controller.clock.getClockList);
  router.get('/clock/getTodayIsClock', controller.clock.getTodayIsClock);
  router.get('/clock/getTodayIsClockList', controller.clock.getTodayIsClockList);

  // message路由配置
  router.post('/message/createOrEditMessage', controller.message.createOrEditMessage);
  router.get('/message/getMessageInfo', controller.message.getMessageInfo);
  router.get('/message/getSystemMessageInfo', controller.message.getSystemMessageInfo);
  router.get('/message/getMessageDetail', controller.message.getMessageDetail);
  router.post('/message/modifyMessageInfo', controller.message.modifyMessageInfo);
  router.post('/message/deleteMessage', controller.message.deleteMessage);
  router.post('/message/changeMessageRead', controller.message.changeMessageRead);
  router.post('/message/createMessageDetail', controller.message.createMessageDetail);
  router.get('/message/getMessageDetailInfo', controller.message.getMessageDetailInfo);
  router.get('/message/getMessageDetailList', controller.message.getMessageDetailList);

  // log路由配置
  router.post('/log/createLog', controller.log.createLog);
  router.get('/log/getLogInfo', controller.log.getLogInfo);
  router.get('/log/getLogList', controller.log.getLogList);
  router.get('/log/getLogDetail', controller.log.getLogDetail);
  router.post('/log/deleteLog', controller.log.deleteLog);
  router.post('/log/changeLogTopping', controller.log.changeLogTopping);
  router.post('/log/changeLogPrivate', controller.log.changeLogPrivate);
  router.post('/log/createLogComment', controller.log.createLogComment);
  router.get('/log/getLogCommentList', controller.log.getLogCommentList);
  router.post('/log/changeLogCommentStatus', controller.log.changeLogCommentStatus);
  router.get('/log/getLogCommentBySort', controller.log.getLogCommentBySort);
  router.post('/log/deleteLogComment', controller.log.deleteLogComment);
  router.post('/log/createLogLike', controller.log.createLogLike);
  router.get('/log/getLogLikeList', controller.log.getLogLikeList);
  router.post('/log/deleteLogLike', controller.log.deleteLogLike);

  // banner路由配置
  router.post('/banner/createOrEditBanner', controller.banner.createOrEditBanner);
  router.get('/banner/getBannerInfo', controller.banner.getBannerInfo);
};
