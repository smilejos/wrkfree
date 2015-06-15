var gulp = require('gulp');
var webpack = require('gulp-webpack');
var nodemon = require('gulp-nodemon');
var compass = require('gulp-compass');
var minifyCSS = require('gulp-minify-css');
var connect = require('gulp-connect');
var net = require('net');

/**
 * check the runtime environment
 */
var env = process.env.NODE_ENV || 'dev';

/************************************************
 *
 *          Environment Configuration
 *
 ************************************************/

/**
 * paths for the web app client build
 * NOTE: web app client served as an single page application
 */
var paths = {
    main: './client/client.js',
    css: './client/assets/css/*.css',
    sass: './client/assets/scss/*.scss',
    imgs: './client/assets/imgs/*',
    lib: './client/libs/*',
    destDir: './build/protected',
    destCSS: './build/protected/assets/css',
    destImg: './build/protected/assets/imgs',
    destLib: './build/protected/libs'
};

/**
 * paths for the web entry client build
 * NOTE: web entry served as an static entry page
 */
var entryPaths = {
    main: './WebEntry/entry.js',
    html: './WebEntry/*.html',
    css: './WebEntry/assets/css/*.css',
    sass: './WebEntry/assets/scss/*.scss',
    imgs: './WebEntry/assets/imgs/*',
    lib: './WebEntry/js/libs/*',
    destDir: './build/public',
    destCSS: './build/public/assets/css',
    destImg: './build/public/assets/imgs',
    destLib: './build/public/libs'
};

/**
 * configs for gulp to monitor working folder
 */
var watchConfig = [
    './client/**/*',
    './WebEntry/**/*'
];

/**
 * webpack configs for building environment
 */
webpackConfig = {
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    output: {
        filename: 'bundle.js'
    },
    module: {
        loaders: [
            { test: /\.jsx$/, loader: 'jsx-loader'},
            { test: /\.json$/, loader: 'json-loader'}
        ]
    },
    node: {
        // make "fs" module as empty object "{}" 
        // since lokijs will require('fs') on browser environment
        fs: "empty"
    },
    stats: {
        colors: true
    },
    watch: (env === 'dev'),
    keepalive: true
};

/**
 * nodemon configs,
 * monitor when should reload the web server
 */
var nodemonConfig = {
    script: './server/server.js',
    ext: 'js jsx',
    // "ignore" deoesn't work, use "watch" instead
    watch: [
        'server/*',
        'shared/*'
    ]
};

/************************************************
 *
 *          Gulp Tasks
 *
 ************************************************/

/**
 * Gulp Task
 * @Author: Jos Tung
 * @Description: auto build sass file to css
 */
gulp.task('compass', function() {
    gulp.src(paths.sass)
        .pipe(compass({
            css: paths.destCSS,
            sass: 'client/assets/scss',
            image: 'client/assets/images'
        }))
        .pipe(minifyCSS({
            noAdvanced: false,
            keepBreaks: true,
            cache: true // this add-on is gulp only
        }))
        .pipe(gulp.dest(paths.destCSS))
        .pipe(connect.reload());
});

/**
 * Gulp Task
 * @Author: George_Chen
 * @Description: use webpack to build web client app
 */
gulp.task('build', function() {
    return gulp.src(paths.main)
        .pipe(webpack(webpackConfig))
        .pipe(gulp.dest(paths.destDir));
});

/**
 * Gulp Task
 * @Author: George_Chen
 * @Description: task for starting nodemon
 */
gulp.task('nodemon', function() {
    var devPort = 9999;
    // used to monitor web server has started or not
    net.createServer()
        .listen(devPort)
        .on('connection', function(){
            gulp.src(paths.main).pipe(connect.reload());
        });
    return nodemon(nodemonConfig);
});

/**
 * Gulp Task
 * @Author: George_Chen
 * @Description: task for controlling livereload
 */
gulp.task('livereload', function() {
    connect.server({
        root: paths.destDir,
        https: true,
        livereload: true
    });
    // client files changed will also trigger compass
    gulp.watch(watchConfig, ['compass', 'copy', 'reloadNow'])
});

/**
 * Gulp Task
 * @Author: George_Chen
 * @Description: reload task, trigger the livereload immedidately
 */
gulp.task('reloadNow', function() {
    gulp.src(paths.main).pipe(connect.reload());
});

/**
 * Gulp Task
 * @Author: George_Chen
 * @Description: copy files to build folder
 */
gulp.task('copy', function() {
    // for web entry files
    gulp.src(entryPaths.html).pipe(gulp.dest(entryPaths.destDir));
    gulp.src(entryPaths.imgs).pipe(gulp.dest(entryPaths.destImg));
    gulp.src(entryPaths.lib).pipe(gulp.dest(entryPaths.destLib));

    // for web app files
    gulp.src(paths.imgs).pipe(gulp.dest(paths.destImg));
    gulp.src(paths.lib).pipe(gulp.dest(paths.destLib));
});

/************************************************
 *
 *          Regular Tasks
 *
 ************************************************/

gulp.task('prod', ['build', 'compass', 'copy']);

gulp.task('dev', ['build', 'compass', 'copy', 'nodemon', 'livereload']);

gulp.task('default', [env]);
