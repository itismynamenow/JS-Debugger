var PrettyPrinter = function(interface,transformerFunction, objectCustomFormattingFunction, propertiesCustomFormattingFunctions){
    function getPrettifiedObject(object) {
        return transformerFunction(object);

    }

    function doesInterfaceMatch(object) {
        if(typeof object == "object" && object!==null){
            var matches = 0;
            for(var i=0;i<interface.length;i++){
                if(typeof object[interface[i]] !== "undefined"){
                    matches++;
                }
            }
            return interface.length === matches;
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
    return{
        getPrettifiedObject:getPrettifiedObject,
        doesInterfaceMatch:doesInterfaceMatch,
        getObjectCustomFormattingFucntion:getObjectCustomFormattingFucntion,
        getCustomFormattingFunctionForProperty:getCustomFormattingFunctionForProperty
    };
};

var interface = ["loc","range","start","end"];
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

var interface = ["variables","set","taints","dynamic"];
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