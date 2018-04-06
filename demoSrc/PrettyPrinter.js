var PrettyPrinter = function(interface,transformerFunction, objectCustomFormattingFunction, propertiesCustomFormattingFunctions){
    function getPrettifiedObject(object) {
        return transformerFunction(object);

    }

    function doesInterfaceMatch(object) {
        if(typeof object !== "undefined"){
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