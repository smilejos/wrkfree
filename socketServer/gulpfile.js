'use strict';
var gulp = require('gulp');
var spawn = require('child_process').spawn;

/**
 * the Server process reference
 */
var Server;

/**
 * configs for gulp to monitor working folder
 */
var watchConfig = [
    './store/**/*',
    './worker/**/*',
    'server.js'
];

/**
 * task to start or restart current server process
 */
gulp.task('restart', function() {
    if (Server) {
        process.kill(Server.pid);
    }
    Server = spawn('node', ['server.js']);
    Server.stdout.on('data', function(data) {
        console.log('' + data);
    });
    Server.on('close', function(code) {
        console.log('Server process exited with code ' + code);
        console.log('---------------server restarting----------------');
    });
});

/************************************************
 *
 *          Regular Tasks
 *
 ************************************************/

gulp.task('default', ['restart'], function() {
    return gulp.watch(watchConfig, ['restart']);
});
