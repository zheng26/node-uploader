const Http = require('http');
const Url = require('url');
const QueryString = require('querystring');
const Util = require('util');
const Fs = require('fs');
const Path = require('path');
const SELFCONFIG = require('./config');
const Formidable = require('formidable');

// 临时存放目录信息
let catalogTmp = '';
// 加密库
let Crypto;

function headConfig() {
    return {
        'Access-Control-Allow-Methods': 'GET, POST',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Origin'
    }
}

function calcMD5() {

}

function fileCheck() {

}

/**
 * 当nodejs version below 8.0.0 不存在 util.promisify是用
 * @param fn
 * @returns {function(...[*]=)}
 */
function selfPromisify(fn) {
    return (...args) => {
        return new Promise((resolve, reject) => {
            fn(...args, (err, data) => {
                if (err) {
                    reject(data);
                } else {
                    resolve(data);
                }
            });
        });
    }
}

function fileW(path, dataInfo, option) {
    let tmpPath = Path.resolve(SELFCONFIG.static, path);
    return Util.promisify(Fs.writeFile)(tmpPath, dataInfo, option);
}

/**
 * 文件读取， 对fs.readFile 进行封装
 * @param path
 * @param option
 * @returns {*}
 */
function fileR(path, option) {
    let tmpPath = Path.resolve(SELFCONFIG.static, path);
    return Util.promisify(Fs.readFile)(tmpPath, option);
}

/**
 * 相对于SELFCONFIG.static路径的文件读取
 * @param path
 * @param flags
 * @returns {Promise}
 */
function fileOpen(path, flags = 'w+') {
    let tmpPath = Path.resolve(SELFCONFIG.static, path);
    return Util.promisify(Fs.open)(tmpPath, flags);
}

function findFile(md5) {
    // 如果存在临时目录信息
    if (catalogTmp) {
        return Promise.resolve(catalogTmp[md5] || '');
    }
    let fdTmp = '';
    // 不存在的情况下，读入目录信息
    return fileOpen(SELFCONFIG.catalog)
        .then((data) => {
            console.log('find the catalog.json', data);
            fdTmp = data;
            return Util.promisify(Fs.readFile)(fdTmp)
        })
        .then((data) => {
            if (data.length) {
                try {
                    catalogTmp = JSON.parse(data.toString());
                    console.log('this is catalog content :', dataTmp);
                    return catalogTmp[md5];
                } catch (e) {
                    console.error('json parse buffer data error', data.toString(), e);
                }
            } else {
                console.log('file not found');
            }
        })
        .catch((err) => {
            console.error('find the findFile error', err);
            return;
        })
        .then((data) => {
            console.log('start close catalog');
            Fs.close(fdTmp, (err) => {
                console.error('close catalog file error', err);
            });
            return data;
        })
}

/**
 * GET 处理
 * @param {*} req 
 * @param {*} res 
 */
function getFn(req, res) {

}

/**
 * OPTIONS 处理
 * @param {*} req 
 * @param {*} res 
 */
function optionFn(req, res) {
    res.writeHead(200, headConfig());
    res.end();
}

/**
 * POST 处理
 * @param {*} req 
 * @param {*} res 
 */
function postFn(req, res) {
    let params = Url.parse(decodeURIComponent(req.url), true).query;
    let formTmp = new Formidable.IncomingForm();
    formTmp.keepExtensions = true;
    formTmp.encoding = 'binary';
    formTmp.uploadDir = SELFCONFIG.static;
  
    formTmp.parse(req, (err, fields, files) => {
        console.log('this is formTmp parse cb', files);
        res.writeHead(200, headConfig());
        if(err){
            console.error('post parse body data received error: ', err);
            let dataTmp = {
                code: 1,
                msg: err
            };
            res.end(JSON.stringify(dataTmp));
        } else {
            Util.promisify(Fs.rename)(files.file.path, Path.resolve(SELFCONFIG.static, params.name))
            .then( err=>{
                let resData = {
                    code: 0,
                    data: {
                        id: params.md5
                    }
                };
                res.end(JSON.stringify(resData));
            })
        }
    });
    // let post = '';
    // req.on('data', (chunk) => {
    //     post += chunk;
    // });
    // req.on('end', () => {
    //     let postData = QueryString.parse(post);
    //     res.writeHead(200, headConfig());
    //     findFile(params.md5)
    //         .then((data) => {
    //             // md5未作校验
    //             if (data) {
    //                 console.log('the file already exited');
    //             } else {
    //                 let curFilePath = Path.resolve(SELFCONFIG.static, '.', params.name);
    //                 if (!catalogTmp) {
    //                     catalogTmp = {};
    //                 }
    //                 catalogTmp[params.md5] = {
    //                     curFile: curFilePath
    //                 };
    //                 return fileW(curFilePath, post, {encoding : 'binary'});
    //             }
    //         })
    //         .then(() => {
    //             let resData = {
    //                 code: 0,
    //                 data: {
    //                     id: params.md5
    //                 }
    //             };
    //             res.end(JSON.stringify(resData))
    //         })
    //         .catch((e) => {
    //             let objTmp = {
    //                 code: 2,
    //                 msg: e
    //             };
    //             res.end(JSON.stringify(objTmp));
    //             // todo 记录到日志里
    //         })
    // })
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
    // 版本的处理
    if (!Util.promisify) {
        Util.promisify = selfPromisify;
    }
    // 引入加密库
    try {
        Crypto = require('crypto');
    } catch (e) {
        console.error(e);
    }
    if (!Fs.existsSync(SELFCONFIG.static)) {
        console.log('static catalog create', SELFCONFIG.static);
        Fs.mkdirSync(SELFCONFIG.static);
    }
    srvStart();
}

init();

