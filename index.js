var babel = require("babel-core");
var crequire = require("crequire");
var fs = require('fs');
var npm = require('npm');
var through = require('through2');
var Version = require('./version');
var colors = require('colors');

//console.log(process.moduleLoadList);
function loadNpm(config) {
    return new Promise(function(resolve, reject){
        npm.load(config, resolve);
    })
}

function checkVersion(pack) {
    return new Promise(function(resolve, reject){
        
        npm.commands.view([pack, 'version'],function(err, version){
            try {
                if(err) {
                    reject(err);
                } else {
                    resolve({
                        name: pack,
                        version: Object.keys(version)[0]
                    });
                }
            } catch(e) {
            
                reject(e);
            }
        })
            

    })
}

function readJson(fileName) {
    return new Promise(function(resolve, reject){
        fs.readFile(fileName, function(err, file){
            if(err) {
                reject(err)
            } else {
                try {
                    resolve(JSON.parse(file.toString('utf8')))
                } catch(e) {
                    reject(e);
                }
            }
        });
    })
}

module.exports = function(config){
    return through.obj(function(file, enc, cb) {

        if (file.isNull()) {
            // return empty file
            cb(null, file);
        }

        if(typeof config === 'string') {
            config = {
                package:config
            };
        }
        
        if(!('isDev' in config))
            config.isDev = false;
        if(!('checkVersion' in config))
            config.checkVersion = true;
        if(!('ignoreExisting' in config))
            config.ignoreExisting = false;
        if(!('forceUpdate' in config))
            config.forceUpdate = true;
        if(!('prefix' in config))
            config.prefix = '^';
        
        var packages = crequire(file.contents.toString()).map(item=>item.path)        
            .concat(babel.transform(file.contents).ast.program.body
                .filter(item=>item.type === 'ImportDeclaration')
                .map(item=>item.source.extra.rawValue))
            .filter(item=>item.indexOf('/') === -1);
        
        var packageJSON;
        var depProperty;
        
        Promise.all( [
            readJson(config.package), 
            loadNpm({
                //registry:'http://registry.npm.taobao.org',  // for Chinese users
                loglevel:'error'
            })
        ]).then(function(rets){
            packageJSON = rets[0];
            depProperty = config.isDev ? 'devDependencies' : 'dependencies';
            if(!packageJSON[depProperty])
                packageJSON[depProperty] = {};
            
            packages = packages.filter(packname => {
                if(!packageJSON[depProperty][packname] || !config.ignoreExisting)
                    return true;
            })
            return Promise.all(packages.map(pack=>config.checkVersion ? checkVersion(pack) : {name:pack, version:'*'}));
        }).then(function(packInfos){      
            packInfos.forEach(function(packInfo){
                if(packageJSON[depProperty][packInfo.name]) {
                    
                    var oldVersion = new Version(packageJSON[depProperty][packInfo.name].replace(/^[\^\~]/, ''));
                    var newVersion = new Version(packInfo.version);

                    if(oldVersion.lt(newVersion.toString())) {
                        if(!config.forceUpdate) {
                            console.warn(('Warning: ' + packInfo.name + ' is older than latest!').yellow)
                        } else {
                            console.log(('Info: Overriding ' + packInfo.name + ' ' + oldVersion.toString() + '->' + newVersion.toString()))
                            packageJSON[depProperty][packInfo.name] = config.prefix + packInfo.version;
                        }
                    }
                } else {
                    packageJSON[depProperty][packInfo.name] = config.prefix + packInfo.version;
                }
            });
            
            fs.writeFile(config.package, JSON.stringify(packageJSON, null, '  ') + '\n', function(err, file){
                cb(null, file);
            });
        }).catch(function(e){
            console.error(e)
        });
        
 
    });

}
