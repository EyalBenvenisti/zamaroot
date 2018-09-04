"use strict";
const http = require('http');
const settings = require('./server/libs/settings');
const routes = require('./server/routes');

const settings_file = './server/resources/settings.json';

//create our server
http.createServer((req, res) => {

    if (req.url.match(/\.(html|css|js|png|jpg|woff2|map)$/)) { //for static files
        routes.publicContent(req, res);
    } else if (req.url === '/') { //for main page
        routes.home(req, res);
    } else { //for all other pages
        routes.notFound(req, res);
    }
}).listen(settings(settings_file).server_port, () => console.log('Server started'))  //get server_port from the settings.json