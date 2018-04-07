var Debugger = function(){

    //Check if Interpreter.js is present
    if(!Interpreter){
        logError("constructor","Interpreter.js was not found")
    }

    /**
     * Not finished I think.Adds only properties that are functions
     * @param obj object that you want to add
     * @param name string that you will use to refer to added object in code
     */
    Interpreter.prototype.addObjectToGlobalScope = function(obj, name){
        this.setProperty(this.global, name, this.createObjectProto(obj));
        for (let prop in obj) {
            if(typeof (obj[prop]) ==  "function")
            {
                this.setProperty(
                    this.global.properties[name], prop,
                    this.createNativeFunction(obj[prop], false),
                    Interpreter.VARIABLE_DESCRIPTOR);
            }

        }

    };

    var self = this;
    var interpreter;
    var breakpoints = new Set([]);
    var breakpointsEnabled = true;
    var executionBegun = false;
    var objectsAddedToGlobalScope = [];
    var highlightingFunction;
    var scopeDisplayFunction;
    var callStackDisplayFunction;
    var statusDisplayFunction;
    var astDisplayFunction;
    var scopesDisplayFunction;
    var temporaryDisabledBreakpoint = -1;
    var code;
    var codeWasSet = false;
    var lastExecutedNode;
    var lastScope;
    var currentStatus = "Debugger just created";

    function addObjectToGlobalScope(object,objectName){
        objectsAddedToGlobalScope.push({'object':object,'objectName':objectName})
    }

    function injectAddedObjectsIntoGlobalScope(){
        for(var i=0;i<objectsAddedToGlobalScope.length;i++){
            interpreter.addObjectToGlobalScope(objectsAddedToGlobalScope[i].object,objectsAddedToGlobalScope[i].objectName);
        }
    }

    function setCode(codeString){
        try{
            interpreter = new Interpreter(codeString);
            code=codeString;
            codeWasSet = true;
            executionBegun = false;
            currentStatus = "Code was just set succesfully. Press step or run. Set breakpoint at some lines if needed. Explore AST if you want.";
            cleanDisplay();
            displayAst();

            var scopeManager = escope.analyze(interpreter.ast,{sourceType:"script",ecmaVersion:5});
            var currentScope = scopeManager.acquire(interpreter.ast);
            displayScopes(scopeManager.scopes);
        }
        catch(error){
            console.error(error);
            currentStatus = "Code was not set due to error. Fix error and restart";
        }
        displayStatus();
    }

    function setBreakpoint(lineNumber){
        breakpoints.add(lineNumber);
    }

    function unsetBreakpoint(lineNumber){
        breakpoints.delete(lineNumber);
    }

    function disableBreakpoints(){
        breakpointsEnabled = false;
    }

    function enableBreakpoints(){
        breakpointsEnabled = true;
    }

    // setWatchpoint(){
    //
    // }
    //
    // unsetWatchpoint(){
    //
    // }

    function run(){
        executionStartProcedures();
        while (!interpreter.paused) {
            if (interpreter.stateStack.length > 0) {
                var loc = interpreter.stateStack[interpreter.stateStack.length - 1].node.loc
            }

            //Check if node that we execute next is on line with breakpoint
            if(loc && loc.start && loc.start.line-1 !== temporaryDisabledBreakpoint && breakpoints.has(loc.start.line-1)){
                temporaryDisabledBreakpoint = loc.start.line-1;
                currentStatus = "Breakpoint encountered on line:"+temporaryDisabledBreakpoint+" execution paused. Press step or run to continue";
                displayStatus();
                display();
                break;
            }

            if(loc && loc.start && loc.start.line-1 !== temporaryDisabledBreakpoint){
                temporaryDisabledBreakpoint = -1;
            }

            //Check if are any steps left
            if(!interpreterStep()){
                break;
            }
        }
    }

    function stop(){

    }

    function resume(){
        run();
    }

    function restart(){
        if(codeWasSet){
            cleanDisplay();
            setCode(code);
            executionBegun = false;
        }
    }

    function executionStartProcedures(){
        if(!executionBegun){
            injectAddedObjectsIntoGlobalScope();
            executionBegun = true;
        }
    }

    function stepIn(){
        executionStartProcedures();
        currentStatus = "Step was performed. Execution stopped. Press run or step";
        displayStatus()
        interpreterStep();
        display();
    }

    function stepOver(){
        executionStartProcedures();
    }

    function stepOut(){
        executionStartProcedures();
    }

    function interpreterStep(){
        var result;
        lastExecutedNode = interpreter.stateStack[interpreter.stateStack.length - 1].node;
        lastScope = getScope();
        try{
            result = interpreter.step();
            if(!result){
                currentStatus = "No more steps left. Execution is over. See console for output. See scope for state of global scope. Press restart to continue";
                displayStatus();
                displayScope();
            }
        }
        catch(error){
            if(lastExecutedNode && lastExecutedNode.loc){
                error['location'] = 
                "See highlighted code between (line:"+lastExecutedNode.loc.start.line+
                " | column:"+lastExecutedNode.loc.start.column+
                ") and (line:"+lastExecutedNode.loc.end.line+
                " | column:"+lastExecutedNode.loc.end.column+")";
            }
            if(scopeDisplayFunction){
                error.message +=". See last scope in scope section.";
            }
            highlightCode(lastExecutedNode);
            displayScope(lastScope)
            console.error(error);
            currentStatus = "Error during execution. Fix it and press restart";
            displayStatus();
        }
        return result;
    }

    function setStepOptions(){

    }

    function getScope(){
        if(executionBegun)
        {
            return interpreter.getScope().properties;
        }else{
            logError("getScope","code execution has not started yet");
            return null;
        }
    }

    function getCallStack(){
        if(executionBegun)
        {
            var callStack = [];
            //stateStack contains stack scopes for all ast nodes so scopes repeate over and over again
            //to make call stack I think we need to select only non repeating scopes (this can be wrong though)
            for(var i=0;i<interpreter.stateStack.length;i++){
                if(callStack.length == 0 || callStack[callStack.length-1] != interpreter.stateStack[i].scope.properties){
                    callStack.push(interpreter.stateStack[i].scope.properties);
                }
            }
            return callStack;
        }else{
            logError("getCallStack","code execution has not started yet");
            return null;
        }
    }

    function setCallbackForCodeHighlighting(callback){
        highlightingFunction = callback;
    }

    function setCallbackForScopeDisplay(callback){
        scopeDisplayFunction = callback;
    }

    function setCallbackForCallStackDisplay(callback){
        callStackDisplayFunction = callback;
    }

    function setCallbackForStatusChange(callback){
        statusDisplayFunction = callback;
    }

    function setCallbackForAstDisplay(callback){
        astDisplayFunction = callback;
    }

    function setCallbackForScopesDisplay(callback){
        scopesDisplayFunction = callback;
    }

    function display() {
        highlightCode(interpreter.stateStack[interpreter.stateStack.length - 1].node);
        displayScope();
        displayCallStack();
    }

    function cleanDisplay(){
        if(scopeDisplayFunction){
            scopeDisplayFunction({});
        }
        if(callStackDisplayFunction){
            callStackDisplayFunction({});
        }
        if(astDisplayFunction){
            astDisplayFunction({});
        }
        if(highlightingFunction){
            highlightingFunction({start:{column:0,line:1},end:{column:1,line:1}});
        }
    }

    function highlightCode(node){
        if(highlightingFunction){
            highlightingFunction(node.loc);
        }
    }

    function displayScope(scope){
        if(scopeDisplayFunction){
            if(scope){
                scopeDisplayFunction(scope);
            }else{
                scopeDisplayFunction(getScope());
            }
        }
    }

    function displayCallStack() {
        if(callStackDisplayFunction){
            callStackDisplayFunction(getCallStack());
        }
    }

    function displayStatus(){
        if(statusDisplayFunction){
            statusDisplayFunction(currentStatus);
        }
    }

    function displayAst(){
        if(astDisplayFunction){
            astDisplayFunction(interpreter.ast);
        }
    }

    function displayScopes(scopes){
        if(scopesDisplayFunction){
            scopesDisplayFunction(scopes);
        }
    }


    function logError(location, message){
        console.error("In Debugger::"+location+"() '"+message+"'");
    }

    function getAst(){
        if(codeWasSet){
            return interpreter
        }
        else{
            return null;
        }
    }

    return{
        addObjectToGlobalScope:addObjectToGlobalScope,
        setCode:setCode,
        disableBreakpoints:disableBreakpoints,
        enableBreakpoints:enableBreakpoints,
        getCallStack:getCallStack,
        getScope:getScope,
        run:run,
        restart:restart,
        stepIn:stepIn,
        setBreakpoint:setBreakpoint,
        unsetBreakpoint:unsetBreakpoint,
        setCallbackForCodeHighlighting:setCallbackForCodeHighlighting,
        setCallbackForCallStackDisplay:setCallbackForCallStackDisplay,
        setCallbackForScopeDisplay:setCallbackForScopeDisplay,
        setCallbackForStatusChange:setCallbackForStatusChange,
        setCallbackForAstDisplay:setCallbackForAstDisplay,
        setCallbackForScopesDisplay:setCallbackForScopesDisplay
    }
}