"use strict";

let fs = require("fs");
let _ = require("lodash");
let resolvePath = require("./resolvePath");

let mkdirp = require('mkdirp');
let marked = require('marked');

let promisify = require("es6-promisify");
let lstat = promisify(fs.lstat);
let readFile = promisify(fs.readFile);
let writeFile = promisify(fs.writeFile);

let inputOptions = {
    repoRoot: "/repos/waterfall/client",
    indexFileName: "readme.md",
    entry: "sass"
}

let outputOptions = {
    root: "/repos/docs-test",
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
    replicate(path, context, resolvedPath){
        if( this.active <= 5 ){
            this.active++;
            this._replicate(path, context, (err) => {
                this.active--;
                if(err){
                    console.error(err);
                }
                return this.shiftQuue();
            }, resolvedPath);
        }
        else{
            this.quue.push([path, context, resolvedPath]);
        }
    }
    _replicate(path, context, cb, resolvedPath ){
        try{
            resolvedPath = resolvedPath || resolvePath(path, context, this.inputOptions.repoRoot).resolved;
            //console.log(path, context, resolvedPath);
            if(! resolvedPath){
                cb();
                return false;
            }
            if( /\/$/.test(resolvedPath) ){
                resolvedPath += this.inputOptions.indexFileName;
            }
            console.log(resolvedPath);
            if(_.indexOf(this.history, resolvedPath) >= 0){
                cb();
                return false;
            }
            this.history.push(resolvedPath);

            lstat(resolvedPath).then(( stats ) => {
                if(stats.isDirectory()){
                    this._replicate(path, context, cb, resolvedPath + "/" );
                }else if(stats.isFile()){
                    let outputPath = resolvedPath.replace(this.inputOptions.repoRoot, this.outputOptions.root);
                    if(/\.md$/.test(resolvedPath)){
                        readFile(resolvedPath, "utf-8").then((data)=>{
                        
                            //this._multiReplicate(findLinks(data), resolvedPath);
                            data = this._parseMDFile(data, contextForResolved(resolvedPath, this.rootLength));

                            if(/\.md$/i.test(outputPath)){
                                let readMe = /readme\.md$/i;
                                if(/readme\.md$/i.test(outputPath)){
                                    outputPath = outputPath.replace(readMe, "index.html");
                                }
                                outputPath = outputPath.replace(/md$/i, "html");
                            }
                                                    
                            safeWriteFile(outputPath , marked(data) ).then(cb,cb);
                            cb();
                            
                        }, cb);
                    }else{
                        readFile(resolvedPath).then(function(data){
                            safeWriteFile(outputPath ,data).then(cb,cb);
                        }, cb);                        
                    }
                }
            }, cb);
        }catch(e){
            cb(e);
        }
    }
    _multiReplicate(links, sourceResolved){
        var context = contextForResolved(sourceResolved, this.rootLength);
        links.forEach((link)=>{
            this.replicate(link, context);
        });
    }
    shiftQuue(){
        while(this.active <= 5 && this.quue.length > 0){
            //console.log(this.quue);
            let next = this.quue.shift();
            this.replicate.apply(this, next);
        }
    }
    _parseMDFile(data, context){
        let inlineLinks = /\[.+]\((.*?)\)/g;

        let _replaceFunc = (match, filePath)=>{
            let resolved = resolvePath(filePath, context, this.inputOptions.repoRoot);
            if (resolved.type != "external"){
                console.log(resolved.orig, context, resolved);
                this.quue.push([resolved.orig, context , resolved.resolved]);
                if(/\.md$/i.test(resolved.orig)){
                  if(/readme\.md$/i.test(resolved.orig)){
                    return match.replace(/readme\.md(\)?)$/i, "index.html$1");
                  }
                  return match.replace(/\.md(\)?)$/i, ".html$1");
                }
            } 
            return match;
        }

        return data.replace(/\[.+?]\((.*?)\)/g, _replaceFunc).replace(/^\[.+\]\s*:\s*(.*)$/gm, _replaceFunc );
    }
    
}

function contextForResolved(resolved, rootLength){
    resolved = resolved.substring(rootLength);
    return resolved.replace(/\/[^/]*$/, "");
}


function safeWriteFile(path, data){
    return new Promise( function(resolve, reject){
        mkdirp(path.replace(/\/[^/]*$/, ""), function(err){
            if(err){
                reject(err);
            }else{
                writeFile(path, data).then(resolve,reject);
            }
        });
    });
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
function wait () {
   if (replicator.active > 0){
        setTimeout(wait, 1000);
        //replicator.shiftQuue();
    }
        console.log(replicator.active, replicator.history.length);
};
//wait();
   
})()



