var gulp = require('gulp');
var webpack = require('gulp-webpack');
var livereload = require('gulp-livereload');
var nodemon = require('gulp-nodemon');
var compass = require('gulp-compass');
var minifyCSS = require('gulp-minify-css');

/**
 * check the runtime environment
 */
var env = process.env.NODE_ENV || 'dev';

/**
 * path
 */
var paths = {
    main: './client/client.js',
    css: './client/assets/css/*.css',
    sass: './client/assets/scss/*.scss',
    destDir: './build',
    destCSS: './build/assets/css'
};

var watchConfig = [
    './**/*',
    '!./node_modules/**/*',
    '!./build/**/*',
    '!./gulpfile.js',
    '!./server/**/*',
    '!./shared/**/*'
];

webpackConfig = {
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    output: {
      filename: 'bundle.js'
    },
    module: {
        loaders: [
            { test: /\.jsx$/, loader: 'jsx-loader' }
        ]
    },
    stats: {
        colors: true
    },
    watch: true,
    keepalive: true
};

var nodemonConfig = {
    script: './server/server.js',
    ext: 'js jsx',
    // "ignore" deoesn't work, use "watch" instead
    watch: [ 
        'server/*',
        'shared/*'
    ]
};

/**
 * Gulp Task
 * @Author: Jos Tung
 * @Description: auto build sass file to css
 */
gulp.task('compass', function() {
    gulp.src(paths.sass)
        .pipe(compass({
          css: 'build/assets/css',
          sass: 'client/assets/scss',
          image: 'client/assets/images'
        }))
        .pipe(minifyCSS({
                noAdvanced: false,
                keepBreaks: true,
                cache: true // this add-on is gulp only
            }))
        .pipe(gulp.dest(paths.destCSS));
});

gulp.task('build', function() {
    return gulp.src(paths.main)
        .pipe(webpack(webpackConfig))
        .pipe(gulp.dest(paths.destDir));
});

gulp.task('nodemon', function() {
    return nodemon(nodemonConfig)
        .on('restart', function() {
            setTimeout(function(){
                gulp.src('./build/bundle.js').pipe(livereload());
            }, 500);
        }); 
}); 

  
gulp.task('livereload', function() {  
    livereload.listen();  
    var server = livereload();
    // client files changed will also trigger compass
    gulp.watch(watchConfig, ['compass'], function(){
        setTimeout(function(){
            gulp.src('./build/bundle.js').pipe(livereload());
        }, 500)
    });
}); 

/**
 * regular tasks
 */
gulp.task('prod', ['build', 'compass']);

gulp.task('dev', ['build', 'compass', 'nodemon', 'livereload']);

gulp.task('default', [env]);