const Path = require('path');

let config = {
    srvUrl: '0.0.0.0',
    srvPort: '9993',
    static: Path.resolve(__dirname, '../static'),
    catalog: 'catalog.json'
}

module.exports = config;