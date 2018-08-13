const Koa = require('koa');
const Router = require('koa-router');
const App = new Koa();
// let router = new Router;
// router.post('/upload', (ctx, next)=>{

// })
// App.use(Router.post(''));
// App.listen(9993);

const Http = require('http');
const Url = require('url');
const QueryString = require('querystring');
const Util = require('util');
const Fs = require('fs');
const Path = require('path');

const SELFCONFIG = require('./config');

function headConfig() {
    return {
        'Access-Control-Allow-Methods': 'GET, POST',
        'Access-Control-Allow-Origin' : '*',
        'Access-Control-Allow-Headers': 'Origin'
    }
}

function fileCheck() {

}

/**
 * 相对于SELFCONFIG.static路径的文件读取
 * @param {*} path 
 */
function fileR(path, flags = 'w+') {
    let tmpPath = Path.resolve(SELFCONFIG.static, path);
    return new Promise( (resolve, reject) => {
        Fs.open(tmpPath, flags, (err, fs) =>{
            if(!err){
                resolve(fs);
            } else {
                reject(err);
            }
        })
    })
}

function findFile(md5){
    return fileR(SELFCONFIG.catalog)
    .then( (data) => {
        console.log('find the catalog.json', data);
        return Util.promisify(Fs.readFile)(data)
    })
    .then( (data)=>{
        if(data.length){
            try{
                let dataTmp = JSON.parse(data.toString());
                console.log('this is catalog content :', dataTmp);
                return dataTmp[md5];
            }catch(e){
                console.error('json parse buffer data error', data.toString(), e);
            }
        } else {
            console.log('file not found');
        }
    })
    .catch((err)=>{
        console.error('find the findFile error', err);
    })
}

/**
 * GET 处理
 * @param {*} req 
 * @param {*} res 
 */
function getFn(req, res){

}

/**
 * OPTIONS 处理
 * @param {*} req 
 * @param {*} res 
 */
function optionFn(req, res){
    res.writeHead(200, headConfig());
    res.end();
}

/**
 * POST 处理
 * @param {*} req 
 * @param {*} res 
 */
function postFn(req, res){
    let params = Url.parse(req.url, true).query;
    let post = '';
    req.on('data', (chunk) => {
        post += chunk;
    });
    req.on('end', ()=>{
        let postData = QueryString.parse(post);
        res.writeHead(200, headConfig());
        findFile(params.md5)
        .then((data)=>{
            
        })
        .catch((e)=>{
            let objTmp = {
               code: 2,
               msg: e
            }
            res.end(Util.inspect(objTmp));
            // todo 记录到日志里
        })
    })
}

function srvStart() {
    Http.createServer((request, response) => {
        let methodTmp = request.method;
        console.log(methodTmp);
        switch (methodTmp) {
            case 'POST':
                postFn(request, response);
                break;
            case 'OPTIONS':
                optionFn(request, response);
                break;
            case 'GET':
                getFn(request, response);
                break;
        }
        
    }).listen(SELFCONFIG.srvPort, SELFCONFIG.srvUrl);
}

function init() {
    if(!Fs.existsSync(SELFCONFIG.static)){
        console.log('static catalog create', SELFCONFIG.static);
        Fs.mkdirSync(SELFCONFIG.static);
    }
    srvStart();
}

init();

