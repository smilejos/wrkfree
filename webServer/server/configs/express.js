'use strict';
/************************************************
 *
 *          Express Configuration
 *
 ************************************************/

var CookieParser = require('cookie-parser');
var BodyParser = require('body-parser');
var Passport = require('passport');
var Session = require('express-session');
var RedisStore = require('connect-redis')(Session);

/************************************************
 *
 *          Express Configuration
 *
 ************************************************/

module.exports = function(server) {
    // ref: static file issue on the order of app.use
    // http://stackoverflow.com/questions/12734129/node-js-passport-deserializing-users-returns-20-indentical-users
    server.use(BodyParser.json());

    server.use(BodyParser.urlencoded({
        extended: true
    }));

    server.use(CookieParser());

    server.use(Session({
        key: 'sid',
        cookie: {
            httpOnly: false,
            secure: false
        },
        store: new RedisStore({
            host: '127.0.0.1',
            port: 6379,
            ttl: 604800, //redis session ttl in seconds (one week)
            prefix: 'sess:'
        }),
        secret: 'letsrock@theworld',
        resave: true,
        saveUninitialized: true
    }));

    server.use(Passport.initialize());

    server.use(Passport.session());
};
