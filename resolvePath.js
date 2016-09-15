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

    let pathType = getPathType(path);
    return {
        type : pathType,
        orig : path,
        resolved : pathResolvers[pathType](path, repoRoot, context)
    };
}

let pathResolvers = {
    external: function(){
        return null;
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
            return null;
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