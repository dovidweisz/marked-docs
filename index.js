"use strict";

let fs = require("fs");
let _ = require("lodash");
let resolvePath = require("./resolvePath");

let inputOptions = {
    repoRoot: "/repos/waterfall/client",
    indexFileName: "readme.md",
    entry: "sass"
}

let outputOptions = {
    root: "/repos/docs-test/",
    ext: "html",
    indexName: "index"
}

class Replicator{
    constructor(inputOptions, outputOptions){
        this.inputOptions = inputOptions;
        this.outputOptions = outputOptions;
        this.quue = [];
        this.history = [];
        this.active = 0;
        this.rootLength = this.inputOptions.repoRoot.length + 1;
    }
    replicate(path, context){
        if( this.active < 5 ){
            this.active++;
            this._replicate(path, context, () => {
                this.active--;
                this.shiftQuue();
        console.log("active", this.active);
            });
       // console.log("active", this.active);
        }
        else{
            this.quue.push([path, context]);
        }
    }
    _replicate(path, context, cb){
        var resolvedPath = resolvePath(path, context, this.inputOptions.repoRoot);
        console.log(path, context, resolvedPath);
        if(! resolvedPath){
            cb();
            return false;
        }
        if( /\/$/.test(resolvedPath) ){
            resolvedPath += this.inputOptions.indexFileName;
        }
        if(_.indexOf(this.history, resolvedPath) >= 0){
            cb();
            return false;
        }
        if(/\.md$/.test(resolvedPath)){
            fs.readFile(resolvedPath, (err, data) => {
                if (err){
                    cb( err);
                } else {
                    this._multiReplicate(findLinks(data), resolvedPath);
                    //console.log(findLinks(data));
                    cb();
                }
                
            });
        }
        cb();
        
    }
    _multiReplicate(links, sourceResolved){
        var context = contextForResolved(sourceResolved, this.rootLength);
        links.forEach((link)=>{
            this.replicate(link, context);
        });
    }
    shiftQuue(){
        while(this.active < 5 && this.quue.length > 0){
            let next = this.quue.shift();
            this.replicate.apply(this, next);
        }
    }
    
}

function contextForResolved(resolved, rootLength){
    resolved = resolved.substring(rootLength);
    return resolved.replace(/\/[^/]*$/, "");
}

function findLinks(data){
    let inlineLinks = /\[.+]\((.*?)\)/g;
    let result;
    let rv = [];
    while((result = inlineLinks.exec(data)) !== null ){
        rv.push(result[1]);
    }
    return rv;
}



(function(){
    var //root = "/c/sdfdf/sdf",
        context = "aaaa/bbbbb/cccc/ddddd";

//     console.log(resolvePath("//fsdfsdf")); 
    
//    console.log(resolvePath("/shmigegi/mishgegi", context));
//    console.log(resolvePath("./shmigegi/mishgegi", context));
//    console.log(resolvePath("../../shmigegi", context)); 
//    console.log(resolvePath("shmigegi/mishgegi", context)); 
var replicator = new Replicator(inputOptions, outputOptions);
replicator.replicate(inputOptions.indexFileName, inputOptions.entry);

   
})()