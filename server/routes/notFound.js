"use strict";

const fs = require('fs');
const path = require('path');

function notFound(req, res) {

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');

    //read the file from the disk
    const stream = fs.createReadStream(path.resolve('public', 'error.html'));
    stream.pipe(res);
}

module.exports = notFound;