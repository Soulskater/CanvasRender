/**
 * Created by gmeszaros on 9/8/2014.
 */
var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var minifyCss = require('gulp-minify-css');
var del = require('del');


var paths = {
    scripts: ['src/js/modules/utility/*.js', 'src/js/**/*.js', '!src/js/lib/**/*.js', '!src/js/registerTypes.js']
};

gulp.task('clean', function (cb) {
    // You can use multiple globbing patterns as you would with `gulp.src`
    del(['dist'], cb);
});

//region Live environment

gulp.task('scripts-min', function () {
    return gulp.src(paths.scripts)
        .pipe(sourcemaps.init())
        .pipe(concat('canvasRender.min.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist/'));
});

//endregion Live environment

//region Dev environment

gulp.task('scripts', function () {
    return gulp.src(paths.scripts)
        .pipe(sourcemaps.init())
        .pipe(concat('canvasRender.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist/'));
});

//endregion Dev environment

// Rerun the task when a file changes
gulp.task('watch', function () {
    gulp.watch(paths.scripts, ['scripts']);
});

// Build All
gulp.task('build', ['scripts', 'scripts-min' ]);

gulp.task('dev', ['scripts']);

gulp.task('live', ['scripts-min']);
