'use strict';

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');

gulp.task('lint', function () {
	return 
    gulp.src('./src/**/*.js')
        .src('./test/**/*.js')
    	.pipe(jshint('.jshintrc'))
	.pipe(jshint.reporter('default'));
    });

gulp.task('mocha', function () {
	gulp.src('./test/**/*.js')
	    .pipe(mocha({ reporter: 'list' ,
                          ui: 'tdd'}));
    });

gulp.task('test', ['lint', 'mocha']);
gulp.task('default', ['test']);
