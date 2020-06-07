'use strict';

const Subscription = require('egg').Subscription;

class AllDaySubscription extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      // 每天0点执行一次
      cron: '0 0 0 * * ?',
      type: 'all', // 指定所有的 worker 都需要执行
    };
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {
    // 每天0点根据打卡记录和约定完成次数来改变习惯的状态
    await this.ctx.service.habit.changeHabitStatus();

    // 获取状态时进行中和今天要做的习惯
    const habitList = await this.ctx.service.habit.getProcessTodayHabit();

    // 分别为今天要打卡的习惯分别生成一条未打卡的记录
    for (const item of habitList) {
      const req = { status: '0', user_id: item.user_id, habit_id: item.id };
      await this.ctx.service.clock.createOrEditClock(req);
    }
  }
}

module.exports = AllDaySubscription;
