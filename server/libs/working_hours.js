"use strict";

const fs = require('fs');
const xlsx = require('xlsx');
const moment = require('moment');
const moment_timezone = require('moment-timezone');
const settings = require('./settings'); //we use settings for some messages' templates
const settings_file = './server/resources/settings.json';

function getWorkingHours(filePath, done) {
    const workbook = xlsx.readFile(filePath);

    function to_json(workbook) {  //convert our xlsx file to json
        var schedule_json = {};

        //set the default timezone (because it's timezone of the events)
        moment.tz.setDefault("Israel");

        //put current date and time in our new json file
        var current_date = moment();
        schedule_json.currentDate = moment.tz(current_date, "Israel").format('DD.MM.YYYY');
        schedule_json.currentTime = moment.tz(current_date, "Israel").format('HH:mm');

        //add json for Pool working hours for today
        var pool_schedule_json = xlsx.utils.sheet_to_json(workbook.Sheets['Pool']);

        for (var i = 0, len = pool_schedule_json.length; i < len; i++) {
            var schedule_date = moment.tz(pool_schedule_json[i].Date, "Israel").format('DD.MM.YYYY');
            var isExist = false;  //If the current day exists in our xlsx file or "See you next year"
            if (schedule_date === schedule_json.currentDate) {
                var pool_morning_start = pool_schedule_json[i].Morning ? pool_schedule_json[i].Morning.substr(0, 5) : '';
                var pool_morning_end = pool_schedule_json[i].Morning ? pool_schedule_json[i].Morning.substr(8, 5) : '';
                var pool_evening_start = pool_schedule_json[i].Night ? pool_schedule_json[i].Night.substr(0, 5) : '';
                var pool_evening_end = pool_schedule_json[i].Night ? pool_schedule_json[i].Night.substr(8, 5) : '';

                //put special message from the xslx file
                schedule_json.poolSpecialMessage = pool_schedule_json[i]['Secondry Message (if exists)'] ? pool_schedule_json[i]['Secondry Message (if exists)'] : ' ';
                schedule_json.poolSpecialMessageBackground = pool_schedule_json[i]['Secondry Message (if exists)'] ? 'black-background' : 'clear-background';
                //put value for the holiday marker
                if (pool_schedule_json[i].Morning || pool_schedule_json[i].Night) {
                    schedule_json.poolHolidayMarker = 0;
                    var beforeOpenMessage = pool_schedule_json[i]['Message before it open'];
                    var ifOpenMessage = pool_schedule_json[i]['Message If open'];
                } else {
                    schedule_json.poolHolidayMarker = 1; // if Morning and Night are empty, today is holiday
                    var ifFound = false; //we didn't find next working day
                }

//put values for the next opening day and time
                //at first time we look for next opening time today
                if (schedule_json.currentTime < pool_morning_start) {
                    //today in the morning
                    schedule_json.poolNextDate = schedule_json.currentDate;
                    schedule_json.poolNextDay = moment.tz(current_date, "Israel").format('dddd');
                    schedule_json.poolNextOpeningTime = pool_morning_start;
                    ifFound = true;
                } else if (pool_morning_end < schedule_json.currentTime && schedule_json.currentTime < pool_evening_start) {
                    //today in the evening
                    schedule_json.poolNextDate = schedule_json.currentDate;
                    schedule_json.poolNextDay = moment.tz(current_date, "Israel").format('dddd');
                    schedule_json.poolNextOpeningTime = pool_evening_start;
                    ifFound = true;
                } else {
                    //if it's not today we should look fot opening time tomorrow
                    var k = 1;
                    while (!ifFound) {
                        if (pool_schedule_json[i + k].Morning || pool_schedule_json[i + k].Night) {
                            schedule_json.poolNextDate = moment.tz(pool_schedule_json[i + k].Date, "Israel").format('DD.MM.YYYY');
                            schedule_json.poolNextDay = moment.tz(pool_schedule_json[i + k].Date, "Israel").format('dddd');
                            schedule_json.poolNextOpeningTime = pool_schedule_json[i + k].Morning ? pool_schedule_json[i + k].Morning.substr(0, 5) : pool_schedule_json[i + k].Night.substr(0, 5);
                            ifFound = true; //we found next opening time
                            break;
                        } else {
                            k++;
                        }
                    }
                }

                if ((pool_morning_start < schedule_json.currentTime && schedule_json.currentTime< pool_morning_end) || (pool_evening_start < schedule_json.currentTime && schedule_json.currentTime < pool_evening_end)) {
                    schedule_json.poolStatus = settings(settings_file).pool_open_status;
                    schedule_json.poolStatusImage = 'images/content/waves.png';
                    schedule_json.poolStatusBackground = 'open-background';

                    var pool_close_time = schedule_json.currentTime < pool_morning_end ? pool_morning_end : pool_evening_end;
                    schedule_json.poolCloseTime = pool_close_time;
                    schedule_json.poolStatusInfo = ifOpenMessage.replace('[poolCloseTime]', schedule_json.poolCloseTime);
                } else {
                    schedule_json.poolStatus = settings(settings_file).pool_closed_status;
                    schedule_json.poolStatusImage = 'images/content/no-waves.png';
                    schedule_json.poolStatusBackground = 'closed-background';

                    var poolWeekdayIndex = moment.weekdays().indexOf(schedule_json.poolNextDay);
                    moment.locale("he");
                    var poolNextDayHebrew = moment.weekdays(true, poolWeekdayIndex);
                    moment.locale("en");
                    
                    beforeOpenMessage = beforeOpenMessage.replace('[poolNextDay]', poolNextDayHebrew);
                    beforeOpenMessage = beforeOpenMessage.replace('[poolNextOpeningTime]', schedule_json.poolNextOpeningTime);
                    schedule_json.poolStatusInfo = beforeOpenMessage;
                }
                isExist = true;
                break;
            }

            if (!isExist) {
                //We should say that pool is closed and we'll see next year
                schedule_json.poolStatus = settings(settings_file).pool_closed_status;
                schedule_json.poolStatusImage = 'images/content/no-waves.png';
                schedule_json.poolStatusBackground = 'closed-background';
                schedule_json.poolStatusInfo = settings(settings_file).pool_next_year;
                schedule_json.poolSpecialMessage = ' ';
                schedule_json.poolSpecialMessageBackground = 'clear-background';
            }
        }

        //add json for Gym working hours for today
        var gym_schedule_json = xlsx.utils.sheet_to_json(workbook.Sheets['GYM ALL YEAR']);
        var gym_holidays_schedule_json = xlsx.utils.sheet_to_json(workbook.Sheets['GYM Holidays']);

        //look for status messages templates
        for (var i = 0, len = gym_schedule_json.length; i < len; i++) {
            if (gym_schedule_json[i].Day === moment().format('dddd')) {
                var beforeOpenMessage = gym_schedule_json[i]['MSG: When Close'];
                var ifOpenMessage = gym_schedule_json[i]['MSG: During Open Hours'];
            }
        }

        //at first we look for today in holidays
        var ifHolidayFound = false; //we didn't find holiday for today on the third sheet
        for (var i = 0, len = gym_holidays_schedule_json.length; i < len; i++) {
            schedule_date = moment.tz(gym_holidays_schedule_json[i].Date, "Israel").format('DD.MM.YYYY');

            if (schedule_date === schedule_json.currentDate) { //we found current day between holidays
                var gym_morning_start = gym_holidays_schedule_json[i].Morning ? gym_holidays_schedule_json[i].Morning.substr(0, 5) : '';
                var gym_morning_end = gym_holidays_schedule_json[i].Morning ? gym_holidays_schedule_json[i].Morning.substr(8, 5) : '';
                var gym_evening_start = gym_holidays_schedule_json[i].Night ? gym_holidays_schedule_json[i].Night.substr(0, 5) : '';
                var gym_evening_end = gym_holidays_schedule_json[i].Night ? gym_holidays_schedule_json[i].Night.substr(8, 5) : '';
                console.log('gym_morning_start: ' + gym_morning_start);
                console.log('gym_morning_end: ' + gym_morning_end);
                console.log('gym_evening_start: ' + gym_evening_start);
                console.log('gym_evening_end: ' + gym_evening_end);

                //put special message from the xslx file
                schedule_json.gymSpecialMessage = gym_holidays_schedule_json[i]['Special Message (if exists)'] ? gym_holidays_schedule_json[i]['Special Message (if exists)'] : ' ';
                schedule_json.gymSpecialMessageBackground = gym_holidays_schedule_json[i]['Special Message (if exists)'] ? 'black-background' : 'clear-background';
                //put value for the holiday marker, because we found it on the page with holidays
                schedule_json.gymHolidayMarker = 1;

                //put values for the next opening day and time
                ifFound = false; //we didn't find next opening day
                //at first time we look for next opening time today
                if (schedule_json.currentTime < gym_morning_start) {
                    //today in the morning
                    schedule_json.gymNextDate = schedule_json.currentDate;
                    schedule_json.gymNextDay = moment.tz(current_date, "Israel").format('dddd');
                    schedule_json.gymNextOpeningTime = gym_morning_start;
                    ifFound = true;
                } else if (gym_morning_end < schedule_json.currentTime && schedule_json.currentTime < gym_evening_start) {
                    //today in the evening
                    schedule_json.gymNextDate = schedule_json.currentDate;
                    schedule_json.gymNextDay = moment.tz(current_date, "Israel").format('dddd');
                    schedule_json.gymNextOpeningTime = gym_evening_start;
                    ifFound = true;
                } else {
                    var nextDay = moment.tz(moment().add(1, 'd'), "Israel").format('DD.MM.YYYY');
                    var nextHolidayDay = moment.tz(gym_holidays_schedule_json[i + 1].Date, 'UTC').format('DD.MM.YYYY');
                    console.log('nextDay: ' + nextDay);
                    console.log('nextHolidayDay: ' + nextHolidayDay);

                    if (nextHolidayDay === nextDay) {
                        //if next holiday is the next day
                        if (gym_holidays_schedule_json[i + 1].Morning || gym_holidays_schedule_json[i + 1].Night) { //if we have working hours for it
                            schedule_json.gymNextDate = moment.tz(gym_holidays_schedule_json[i + 1].Date, "Israel").format('DD.MM.YYYY');
                            schedule_json.gymNextDay = moment.tz(gym_holidays_schedule_json[i + 1].Date, "Israel").format('dddd');
                            schedule_json.gymNextOpeningTime = gym_holidays_schedule_json[i + 1].Morning ? gym_holidays_schedule_json[i + 1].Morning.substr(0, 5) : gym_holidays_schedule_json[i + 1].Night.substr(0, 5);
                            ifFound = true; //we found next opening day between holidays
                            break;
                        }
                    } else { //we didn't find next day between holidays, so we should look for it on the second sheet
                        for (var j = 0, len = gym_schedule_json.length; j < len; i++) {
                            console.log('gym_schedule_json[i].Day: ' + gym_schedule_json[i].Day);
                            console.log('Next day: ' + moment.tz(moment().add(1, 'd'), "Israel").format('dddd'));

                            if (gym_schedule_json[i].Day === moment.tz(moment().add(1, 'd'), "Israel").format('dddd')) {
                                schedule_json.gymNextDate = nextDay;
                                schedule_json.gymNextDay = moment.tz(moment().add(1, 'd'), "Israel").format('dddd');
                                schedule_json.gymNextOpeningTime = gym_schedule_json[i].Morning ? gym_schedule_json[i].Morning.substr(0, 5) : gym_schedule_json[i].Evening.substr(0, 5);
                                ifFound = true; //we found next opening day between holidays
                                break;
                            }
                        }
                    }
                }

                //if we found today at this sheet we don't need to look for it on the second sheet
                ifHolidayFound = true;
                break;
            }
        }

        if (!ifHolidayFound) {
            //if we didn't find today in holidays sheet, we should look for a record with a weekday for today and get data there
            for (var i = 0, len = gym_schedule_json.length; i < len; i++) {
                console.log('gym_schedule_json[i].Day: ' + gym_schedule_json[i].Day);
                console.log('Today: ' + moment().format('dddd'));
                if (gym_schedule_json[i].Day === moment().format('dddd')) {
                    //put value for the holiday marker
                    if (gym_schedule_json[i].Morning || gym_schedule_json[i].Evening) {
                        schedule_json.gymHolidayMarker = 0;
                    } else {
                        schedule_json.gymHolidayMarker = 1;
                        var ifFound = false;
                    }

                    console.log('gym_schedule_json[i].Morning: ' + gym_schedule_json[i].Morning);
                    console.log('gym_schedule_json[i].Evening: ' + gym_schedule_json[i].Evening);

                    var gym_morning_start = gym_schedule_json[i].Morning ? gym_schedule_json[i].Morning.substr(0, 5) : '';
                    var gym_morning_end = gym_schedule_json[i].Morning ? gym_schedule_json[i].Morning.substr(8, 5) : '';
                    var gym_evening_start = gym_schedule_json[i].Evening ? gym_schedule_json[i].Evening.substr(0, 5) : '';
                    var gym_evening_end = gym_schedule_json[i].Evening ? gym_schedule_json[i].Evening.substr(8, 5) : '';
                    console.log('gym_morning_start: ' + gym_morning_start);
                    console.log('gym_morning_end: ' + gym_morning_end);
                    console.log('gym_evening_start: ' + gym_evening_start);
                    console.log('gym_evening_end: ' + gym_evening_end);

                    //put special message from the xslx file
                    schedule_json.gymSpecialMessage = gym_schedule_json[i]['Special Message if exists'] ? gym_schedule_json[i]['Special Message if exists'] : ' ';
                    schedule_json.gymSpecialMessageBackground = gym_schedule_json[i]['Special Message if exists'] ? 'black-background' : 'clear-background';

                    //put values for the next opening day and time
                    ifFound = false;        //we didn't find next opening day
                    //at first time we look for next opening time today
                    if (schedule_json.currentTime < gym_morning_start) {
                        //today in the morning
                        schedule_json.gymNextDate = schedule_json.currentDate;
                        schedule_json.gymNextDay = moment.tz(current_date, "Israel").format('dddd');
                        schedule_json.gymNextOpeningTime = gym_morning_start;
                        ifFound = true;
                    } else if (gym_morning_end < schedule_json.currentTime && schedule_json.currentTime < gym_evening_start) {
                        //today in the evening
                        schedule_json.gymNextDate = schedule_json.currentDate;
                        schedule_json.gymNextDay = moment.tz(current_date, "Israel").format('dddd');
                        schedule_json.gymNextOpeningTime = gym_evening_start;
                        ifFound = true;
                    } else {
                        //we should look for next day opening time
                        //at first we look between holidays
                        for (var j = 0, len = gym_holidays_schedule_json.length; j < len; j++) {
                            schedule_date = moment.tz(gym_holidays_schedule_json[j].Date, "Israel").format('DD.MM.YYYY');

                            if (schedule_date === nextDay) {
                                //we found next day between holidays
                                if (gym_holidays_schedule_json[j].Morning || gym_holidays_schedule_json[j].Night) {
                                    //if we have working hours for it
                                    schedule_json.gymNextDate = nextDay;
                                    schedule_json.gymNextDay = moment.tz(moment().add(1, 'd'), "Israel").format('dddd');
                                    schedule_json.gymNextOpeningTime = gym_holidays_schedule_json[j].Morning ? gym_holidays_schedule_json[j].Morning.substr(0, 5) : gym_holidays_schedule_json[j].Night.substr(0, 5);
                                    ifFound = true; //we found next opening day between holidays
                                    break;
                                } else {
                                    nextDay = moment.tz(moment().add(2, 'd'), "Israel").format('DD.MM.YYYY');
                                }
                            }
                        }
                        //we didn't find next time between holidays and then we look for between general days
                        var k = 1;
                        while (!ifFound) {
                            if (i + k < 7) {
                                if (gym_schedule_json[i + k].Morning || gym_schedule_json[i + k].Evening) {
                                    schedule_json.gymNextDate = moment.tz(moment().add(1, 'd'), "Israel").format('DD.MM.YYYY');
                                    schedule_json.gymNextDay = moment.tz(moment().add(1, 'd'), "Israel").format('dddd');
                                    schedule_json.gymNextOpeningTime = gym_schedule_json[i + k].Morning ? gym_schedule_json[i + k].Morning.substr(0, 5) : gym_schedule_json[i + k].Evening.substr(0, 5);
                                    ifFound = true;
                                    break;
                                } else {
                                    k++;
                                }
                            } else {
                                if (gym_schedule_json[i + k - 7].Morning || gym_schedule_json[i + k - 7].Evening) {
                                    schedule_json.gymNextDate = moment.tz(moment().add(1, 'd'), "Israel").format('DD.MM.YYYY');
                                    schedule_json.gymNextDay = moment.tz(moment().add(1, 'd'), "Israel").format('dddd');
                                    schedule_json.gymNextOpeningTime = gym_schedule_json[i + k - 7].Morning ? gym_schedule_json[i + k - 7].Morning.substr(0, 5) : gym_schedule_json[i + k - 7].Evening.substr(0, 5);
                                    ifFound = true;
                                    break;
                                } else {
                                    k++;

                                }
                            }
                        }
                    }

                    break;
                }
            }
        }
        //and finally calculate infromation about current status of the gym
        if ((gym_morning_start < schedule_json.currentTime && schedule_json.currentTime < gym_morning_end) || (gym_evening_start < schedule_json.currentTime && schedule_json.currentTime < gym_evening_end)) {
            schedule_json.gymStatus = settings(settings_file).gym_open_status;
            schedule_json.gymStatusImage = 'images/content/gym.png';
            schedule_json.gymStatusBackground = 'open-background';

            var gym_close_time = schedule_json.currentTime < gym_morning_end ? gym_morning_end : gym_evening_end;
            schedule_json.gymStatusInfo = ifOpenMessage.replace('[gymCloseTime]', gym_close_time);
        } else {
            schedule_json.gymStatus = settings(settings_file).gym_closed_status;
            schedule_json.gymStatusImage = 'images/content/no-gym.png';
            schedule_json.gymStatusBackground = 'closed-background';
            
            var gymWeekdayIndex = moment.weekdays().indexOf(schedule_json.gymNextDay);
            moment.locale("he");
            var gymNextDayHebrew = moment.weekdays(true, gymWeekdayIndex);
            moment.locale("en");
            
            beforeOpenMessage = beforeOpenMessage.replace('[gymNextDay]', gymNextDayHebrew);
            beforeOpenMessage = beforeOpenMessage.replace('[gymNextOpeningTime]', schedule_json.gymNextOpeningTime);
            schedule_json.gymStatusInfo = beforeOpenMessage;
        }

        return schedule_json;
    }

    try {
        var result = to_json(workbook);
    } catch (error) {
        done(error);
    }

    if (result.Responce === 'False') return done(new Error('File with data not found!'));

    done(null, result);
}

module.exports = {
    getWorkingHours
};