/*
 * Description: Holiday.js Node.JS service.
 * Returns either list of holidays dates in JSON or checks whether the date is a holiday
 * Author:      Lyre
 * Date:        2016-05-20
 * Version:     1.0
 */
var Express = require("express");
var App = Express();
var Moment = require("moment");
var ExceptionHeader = "Holiday.js service error: ";

/*
 * Main listener
 */
var Server = App.listen(8081, function () {
    var port = Server.address().port;
    console.log("Holiday.js service listening at port %s.", port);
});

/*
 * GET Holidays by year
 */
App.get("/Holidays/:yearFrom/:yearTo", function (req, res, next) {
    if (req.params.yearFrom === "IsValid" && Moment(req.params.yearTo, "YYYY-MM-DD").isValid()) {
        next();
    }

    if (isNaN(req.params.yearFrom) || isNaN(req.params.yearTo)) {
        throw (ExceptionHeader + "One or more parameter(s) are not number(s).");
    }

    var yearFrom = parseInt(req.params.yearFrom);
    var yearTo = parseInt(req.params.yearTo);

    // Validation
    if (yearFrom > yearTo) {
        throw (ExceptionHeader + "Starting year value is larger than ending year value.");
    }

    if (yearFrom < 1500 || yearTo > 3000) {
        throw (ExceptionHeader + "Incorrect parameters.");
    }

    var result = [];
    for (var i = yearFrom; i <= yearTo; i++) {
        result = result.concat(GetHolidaysByYear(i));
    }

    res.contentType("application/json");
    res.send(JSON.stringify(result));
});

/*
 * GET Holidays by interval
 */
App.get("/Holidays/:year", function (req, res) {
    if (isNaN(req.params.year)) {
        throw (ExceptionHeader + "One or more parameter(s) are not number(s).");
    }

    var year = parseInt(req.params.year);

    // Validation
    if (year < 1500 || year > 3000) {
        throw (ExceptionHeader + "Incorrect parameters.");
    }

    res.contentType("application/json");
    res.send(JSON.stringify(GetHolidaysByYear(year)));
});

/*
 * GET IsValidHoliday
 */
App.get("/Holidays/IsValid/:date", function (req, res) {
    if (!Moment(req.params.date, "YYYY-MM-DD").isValid()) {
        throw (ExceptionHeader + "Incorrect date format. Acceptable format: YYYY-MM-DD.");
    }

    var date = Moment(req.params.date);

    var result = false;

    if (GetHolidaysByYear(date.year()).indexOf(date.format("YYYY-MM-DD").toString()) >= 0) {
        result = true;
    }

    res.contentType("application/json");
    res.send(JSON.stringify(result));
});

/*
 * Helper functions
 */
var GetHolidaysByYear = function (year) {
    var holidays = [];

    // Easter
    var easter = GetEasterDatesByYear(year);

    // Holiday formation
    holidays = holidays.concat(GetStaticHolidaysByYear(year));
    holidays.push(GetFirstSundayByYearAndMonth(year, 5));
    holidays.push(GetFirstSundayByYearAndMonth(year, 6));
    holidays.push(easter);
    holidays.push(Moment(easter).add(1, 'day'));

    holidays.sort(function (a, b) {
        return new Date(a).getTime() - new Date(b).getTime();
    });

    // Moment.js magic
    var result = holidays.map(function (obj) {
        return Moment(obj).format("YYYY-MM-DD");
    });

    return result;
};

var GetStaticHolidaysByYear = function (year) {
    var staticDays = [];

    staticDays[0] = new Date(year + "-01-01");
    staticDays[1] = new Date(year + "-02-16");
    staticDays[2] = new Date(year + "-03-11");
    staticDays[3] = new Date(year + "-05-01");
    staticDays[4] = new Date(year + "-06-24");
    staticDays[5] = new Date(year + "-07-06");
    staticDays[6] = new Date(year + "-08-15");
    staticDays[7] = new Date(year + "-11-01");
    staticDays[8] = new Date(year + "-12-24");
    staticDays[9] = new Date(year + "-12-25");
    staticDays[10] = new Date(year + "-12-26");

    return staticDays;
};

var GetFirstSundayByYearAndMonth = function (year, month) {
    var date = Moment(new Date(year + "-" + month + "-01"));

    // If first day of May or June is Sunday, no need to bother Moment.js
    if (date.weekday() === 0) {
        return date;
    }

    return Moment(new Date(year + "-" + month + "-01")).weekday(7); // Getting next sunday
};

/*
 * Easter calculation algorithm
 */
var GetEasterDatesByYear = function (year) {
    var g = year % 19;
    var c = Math.floor(year / 100);
    var h = (c - Math.floor(c / 4) - Math.floor((8 * c + 13) / 25) + 19 * g + 15) % 30;
    var i = h - Math.floor(h / 28) * (1 - Math.floor(h / 28) * Math.floor((29 / (h + 1))) * Math.floor(((21 - g) / 11)));

    var day = i - (year + Math.floor(year / 4) + i + 2 - c + Math.floor(c / 4)) % 7 + 28;
    var month = 3;

    if (day > 31) {
        month++;
        day -= 31;
    }

    return new Date(year + "-" + month + "-" + day);
};
