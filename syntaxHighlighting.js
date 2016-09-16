"use strict";

let nsh = require("node-syntaxhighlighter");
let expr = new RegExp("`{3}(\\w*)?.*([^]+?)`{3}", "g");

function parse(markDown){
    return markDown.replace( expr, function(match, langName, code){
        if( ! langName || ! code ){
            console.log("nope!");
            return match;
        }
        let lang = getLanguage(langName);
        if( !lang ){
            console.log("nope!");
            return match;
        }
        return nsh.highlight(code, lang);
    });
}

let langs = {};
function getLanguage(langName) {
    if(! langs[langName]){
        langs[langName] = nsh.getLanguage(langName);
    }
    return langs[langName];
}

module.exports = parse;
