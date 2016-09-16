"use strict";

function atxHeaders(input){
    return input.replace(/^\s*(#+)(.+?)#*$/gm, function (match, hashes, header) {
        let tagName = "h" + hashes.length;
        let tagId = getId(header);
        return `<${tagName} id="${tagId}">${header}</${tagName}>`;
    })
}

function getId(heading){
    return heading.substring(0,20).trim().toLowerCase().replace(/\s+/g, "-");
}

module.exports = atxHeaders;