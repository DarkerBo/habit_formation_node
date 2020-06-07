# 习惯养成系统（后端部分）

### 前言

本项目基于 Egg.js 框架实现，主要用于给前端部分提供接口、数据库存储信息等提供支持。

[前端项目地址猛戳这里](https://github.com/DarkerBo/habit_formation)



### 技术栈

- [x] **主要开发框架：** Egg.js
- [x] **数据库：** MySQL
- [x] **认证用户信息：** JSON Web Token
- [x] **安全：** XSS  CSRF 等 



### 项目主要结构

```
├── app             
│   └── controller  // 控制层
│   └── extend      // 扩展
│   └── middleware  // 中间件
│   └── public      // 存储公共资源，如图片资源
│   └── schedule    // 定时任务
│   └── service     // 业务层
│   └── router      // 路由
├── config          // 项目配置，如MySQL配置等
├── logs            // 运行日志
├── test            // 单元测试
```



### 注意事项

由于当初做该项目时间比较紧，因此在代码中直接使用了SQL语句，这不是一个好的操作数据库的方式。若要在Egg中进行数据库操作，建议使用官网推荐的 Sequelize。



### 感谢

***

* [Egg.js 官方网站](https://eggjs.org/zh-cn/intro/)



