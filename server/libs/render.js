"use strict";

const fs = require('fs');
const path = require('path');

function render(templateName, data, done) {
    console.log(templateName);
    console.log(data);

    //load our template index.html
    var template;
    try {
        template = fs.readFileSync(templateName, 'utf-8');
    } catch (err) {
        done (err);
    }

    //if we didn't get JSON with working hours in the parameter data  just show template
    if (!data) return done(null, template);

    //replace all variables with the data from JSON
    const html = template.replace(/{{([^{}]*)}}/g, (placeholder, property) => {
                        const match = data[property];
                        return match || placeholder;
                    });

    done(null, html);
}

module.exports = render;
