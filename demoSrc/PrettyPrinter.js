var PrettyPrinter = function(interface,transformerFunction, objectCustomFormattingFunction, propertiesCustomFormattingFunctions,objectCustomTypeFunction,propertiesCustomTypesFunction){
    function getPrettifiedObject(object) {
        return transformerFunction(object);

    }

    function doesInterfaceMatch(object) {
        if(typeof object == "object" && object!==null){
            var matches = 0;
            for(var property in interface){
                if(typeof object[property] !== "undefined"){
                    if(interface[property]){
                        if( object[property]===interface[property]){
                            matches++;
                        }
                    }else{
                        matches++;
                    }
                }
            }
            return Object.keys(interface).length === matches;
        }else{
            return false;
        }
    }
    function getObjectCustomFormattingFucntion(){
        return objectCustomFormattingFunction;
    }
    function getCustomFormattingFunctionForProperty(property){
        if(property && propertiesCustomFormattingFunctions)
            return propertiesCustomFormattingFunctions[property];
    }
    function getObjectCustomType(json){
        if(objectCustomTypeFunction){            
            return objectCustomTypeFunction(json);
        }
    }
    return{
        getPrettifiedObject:getPrettifiedObject,
        doesInterfaceMatch:doesInterfaceMatch,
        getObjectCustomFormattingFucntion:getObjectCustomFormattingFucntion,
        getCustomFormattingFunctionForProperty:getCustomFormattingFunctionForProperty,
        getObjectCustomType:getObjectCustomType
    };
};
//Ast
var interface = {"loc":undefined,"range":undefined,"start":undefined,"end":undefined};
var transformerFunction = function (object) {
    function copyObject(object)
    {
        var copy = {};
        for(property in object){
            copy[property] = object[property];
        }
        return copy;
    }
    var locationString = object.loc.start.line+"/"+object.loc.start.column+" - "+object.loc.end.line+"/"+object.loc.end.column;
    var objectCopy = copyObject(object);
    delete objectCopy.loc;
    delete objectCopy.range;
    delete objectCopy.start;
    delete objectCopy.end;
    return objectCopy;
}
var objectCustomFormattingFunction = function (htmlElement,json) {
    var button = document.createElement("BUTTON");
    button.innerHTML = "Show";
    button.onclick = onButtonClick;
    htmlElement.appendChild(button);
    function onButtonClick(){
        codeEditor.setMarker(json.loc);
    }
}

var prettyPrinterAst = new PrettyPrinter(interface,transformerFunction,objectCustomFormattingFunction);
//Scopes
var interface = {"variables":undefined,"set":undefined,"taints":undefined,"dynamic":undefined};
var transformerFunction = function (object) {
    var prettyObject = {
        variables:object.variables,
        references:object.references,
        parentScope:object.upper,
        childScopes:object.childScopes,
        astNode:object.block
    }
    return prettyObject
}
var prettyPrinterScopes = new PrettyPrinter(interface,transformerFunction);
//Array
var interface = {"getter":undefined,"setter":undefined,"proto":undefined,"properties":undefined,"class":"Array"};
var transformerFunction = function (object) {
    var prettyObject = [];
    //Apparently object.property in case of jsInterpreter is not an array but object with 0-n and length properties
    for(var i=0;i<object.properties.length;i++){
        prettyObject.push(object.properties[i]);
    }
    return prettyObject;
}
var prettyPrinterArray = new PrettyPrinter(interface,transformerFunction);
//Scopes: Variable
var interface = {
    name:undefined,
    identifiers:undefined,
    references:undefined,
    defs:undefined,
    tainted:undefined,
    stack:undefined,
    scope:undefined,};
var transformerFunction = function (object) {
    var prettyObject = {};
    prettyObject.name = object.name;
    return prettyObject;
}

var objectCustomFormattingFunction = function (htmlElement,json) {
    var button = document.createElement("BUTTON");
    button.innerHTML = "Show";
    button.onclick = onButtonClick;
    htmlElement.appendChild(button);
    function onButtonClick(){
        if(json.identifiers[0] && json.identifiers[0].loc){
            codeEditor.setMarker(json.identifiers[0].loc);
        }
    }
}

var objectCustomTypeFunction = function (json) {
    if(json.identifiers[0] && json.identifiers[0].name){
        return json.identifiers[0].name;
    }
}
var prettyPrinterScopesVariable = new PrettyPrinter(interface,transformerFunction,objectCustomFormattingFunction,undefined,objectCustomTypeFunction);