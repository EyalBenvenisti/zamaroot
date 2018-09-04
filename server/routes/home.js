"use strict";

const working_hours = require('../libs/working_hours');
const render = require('../libs/render');

const xlsx_file = './server/resources/work_hours_2.xlsx';

function home(req, res) {
    working_hours.getWorkingHours(xlsx_file, (error, hours_data) => {
        if (error) throw error;

        render('./server/views/index.html', hours_data, (error, html) => {
            if (error) throw error;

            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html');
            res.end(html);
        });
    });
}

module.exports = home;