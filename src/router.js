const Router = require('koa-router')();
const Fs = require('fs');
const Path = require('path');
const SELFCONFIG = require('./config');

function commonHead(ctx) {
    ctx.response.set({
        'Access-Control-Allow-Methods': 'GET, POST',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Origin'
    })
}

function optionHandle(ctx, next) {
    console.log('this is optionHandle function');
    commonHead(ctx);
    ctx.response.body = '';
}

function uploadHandle(ctx, next) {
    console.log('this is uploadHandle function', ctx.request.files[0]);
    let tmpPath = Path.resolve(SELFCONFIG.static, '.', ctx.request.query.name);
    const file = ctx.request.files[0];
    const reader = Fs.createReadStream(file.path);
    const stream = Fs.createWriteStream(tmpPath);
    reader.pipe(stream);
    commonHead(ctx);
    ctx.response.type = 'json';
    ctx.response.body = {
        code: 0,
        fid: 'xx'
    }
}

Router.options('/', optionHandle);
Router.post('/', uploadHandle);

module.exports = Router;