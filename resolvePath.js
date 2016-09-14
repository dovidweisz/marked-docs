"use strict";

let _ = require("lodash");
let pathTests = {
    external : /^(https?:)?\/\//,
    root : /^\//,
    sameDir : /^\.\//,
    parentDir : /^\.\.\//
}
function resolvePath(path, context, repoRoot){
    path = path.trim();
    //console.log(getPathType(path));
    return pathResolvers[getPathType(path)](path, repoRoot, context);
}

let pathResolvers = {
    external: function(){
        return false;
    },
    root : function(path, repoRoot){
        return repoRoot + path;
    },
    sameDir : function(path, repoRoot, context){
        return repoRoot + "/" + context + path.replace( pathTests.sameDir, "/" );
    },
    parentDir : function(path, repoRoot, context){
        let finder = /^[\.\/]*/
        let result = finder.exec(path);
        let dirsUp = parseInt(result[0].length / 3);
        //console.log("dirsUp", dirsUp, "(\\/[^\\/]+){" + dirsUp + "}$");
        let replacer = new RegExp("(\\/[^\\/]+){" + dirsUp + "}$");
        if( ! replacer.test(context) ){
            return false;
        }
        return repoRoot + "/" + context.replace(replacer, "/") + path.replace(finder, "");
    },
    relative: function(path, repoRoot, context){
        return repoRoot + "/" + context + "/" + path;
    }
}

function getPathType(path){
    var pathType;
    let found = _.some(pathTests, function(test, key){
        if(test.test(path)){
            pathType = key;
            return true;
        }
        return false;
    });
    if( !found ){
        pathType = "relative";
    }
    return pathType;
}

module.exports = resolvePath;