var gulp =  require('gulp');
var depgen =  require('./index.js');

gulp.task('default', function () {
    return gulp.src('./index.js')
        .pipe(depgen('./package.json'))
});


gulp.task('dev', function () {
    return gulp.src('./Gulpfile.js')
        .pipe(depgen({
            package:'./package.json',
            isDev:true}))
});

