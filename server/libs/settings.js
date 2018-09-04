"use strict";

const fs = require('fs');

const settings = function loadSettings(settings_file) {
    return JSON.parse(fs.readFileSync(settings_file)); //return our settings from the file
}

module.exports = settings;
