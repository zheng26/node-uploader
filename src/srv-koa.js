const Koa = require('koa');
const Router = require('./router.js');
const App = new Koa();
const SELFCONFIG = require('./config');
const KoaBetterBody  = require('koa-better-body');
const Convert = require('koa-convert');


// filter log
App.use(async (ctx, next) => {
    console.log(`received requestion method: ${ctx.method} url: ${ctx.url}`);
    await next();
});
// body 解析
App.use(Convert(KoaBetterBody()));
// router 绑定
App.use(Router.routes());
// 监听端口
App.listen(SELFCONFIG.srvPort);