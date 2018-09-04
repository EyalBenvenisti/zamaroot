(function() {
    'use strict';
//our modules
    var gulp = require('gulp');
    var sass = require('gulp-sass');
    var autoprefixer = require('gulp-autoprefixer');

//all paths we use
    var paths = {
        src: {
            html: 'source/**/*.html',
            css: 'source/sass/**/*.scss',
            css_vendors: 'source/css/**/*.*',
            img: 'source/images/**/*.*',
            js: 'source/js/**/*.js'
        },
        dest: {
            html: 'public',
            css: 'public/css',
            images: 'public/images',
            js: 'public/js'
        }
    };
//all tasks we can do
    gulp.task('startWork', function() {
        //first load resources
        gulp.run('htmlMove');
        gulp.run('cssCreate');
        gulp.run('cssVendorsMove');
        gulp.run('jsMove');
        gulp.run('imgMove');

        //all watchers
        gulp.watch(paths.src.html, function() {
            gulp.run('htmlMove');
        });

        gulp.watch(paths.src.css, function() {
            gulp.run('cssCreate');
        });

        gulp.watch(paths.src.css_vendors, function() {
            gulp.run('cssVendorsMove');
        });

        gulp.watch(paths.src.js, function() {
            gulp.run('jsMove');
        });

        gulp.watch(paths.src.img, function() {
            gulp.run('imgMove');
        });
    });

    gulp.task('htmlMove', function() {
        gulp.src(paths.src.html)
            .pipe(gulp.dest(paths.dest.html))
    });

    gulp.task('cssCreate', function() {
        gulp.src(paths.src.css)
            .pipe(sass())
            .pipe(autoprefixer('last 2 versions'))
            .pipe(gulp.dest(paths.dest.css));
    });

    gulp.task('cssVendorsMove', function() {
        gulp.src(paths.src.css_vendors)
            .pipe(gulp.dest(paths.dest.css))
    });

    gulp.task('jsMove', function() {
        gulp.src(paths.src.js)
            .pipe(gulp.dest(paths.dest.js))
    });

    gulp.task('imgMove', function() {
        gulp.src(paths.src.img)
            .pipe(gulp.dest(paths.dest.images))
    });
})();
