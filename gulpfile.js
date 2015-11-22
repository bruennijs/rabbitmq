var gulp = require('gulp');
var ts = require('gulp-typescript');
//var merge = require('merge2');  // Require separate installation

gulp.task('ts', function() {
    var tsResult = gulp.src('**/*.ts')
        .pipe(ts({
            "module": "commonjs",
            "target": "es5",
            "noImplicitAny": false,
            "removeComments": true
        }));

    return tsResult.js.pipe(gulp.dest('release/js'));

    //return merge([
    //    tsResult.dts.pipe(gulp.dest('release/definitions')),
    //    tsResult.js.pipe(gulp.dest('release/js'))
    //]);
});

gulp.task("default", ["ts"]);