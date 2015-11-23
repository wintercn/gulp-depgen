# Auto dependency generator for package.json


## sample

A "Hello world" for this might like this:

    var depgen =  require('depgen');

    gulp.task('default', function () {
        return gulp.src('./index.js')
            .pipe(depgen('./package.json'))
    });

"depgen" receives js files as input. 

There is no output but, instead, "depgen" receives string-typed argument, which allow you to bind a "package.json" file.

## configs

* package: the path to "package.json"
* isDev = false: use devDependencies if is set to true
* checkVersion = true: check the latest version over internet
* ignoreExisting = false: will ignore existing dependencies if is set to true
* forceUpdate = true: will overwite existing dependencies with its latest version
