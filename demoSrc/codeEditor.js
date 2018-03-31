var CodeEditor = function (parentHtmlElement,initialCode,initialWidth,initialHeight)
{
        //Set defaults
        var defaultInitialCode = "Add JS code here";
        var defaultWidth = "100%";
        var defaultHeight = "100%";

        //Check arguments
        initialCode = undefinedCheck(initialCode, defaultInitialCode);
        initialWidth = undefinedCheck(initialWidth, defaultWidth);
        initialHeight = undefinedCheck(initialHeight, defaultHeight);
        parentHtmlElement = domCheck(parentHtmlElement) ? parentHtmlElement : document.body;

        //Make corresponding html element (textatea)
        this.editorCodeMirror = document.createElement("TEXTAREA");
        parentHtmlElement.appendChild(this.editorCodeMirror);

        //Set all settings for CodeMirror
        var codeMirrorSettings = {
            value: initialCode,
            mode:  "javascript",
            lineNumbers: true,
            styleActiveLine: true,
            matchBrackets: true,
            comment: true,
            theme: "rubyblue",
            lint: true,
            styleSelectedText: true,
            highlightSelectionMatches: {showToken: /\w/, annotateScrollbar: true},
            gutters: ["CodeMirror-linenumbers", "breakpoints","CodeMirror-lint-markers"]
        }

        //Create CodeMirror instance and set size
        editor = CodeMirror.fromTextArea(this.editorCodeMirror,codeMirrorSettings)
        editor.setSize(initialWidth,initialHeight);
        editor.setOption('lint', { options: { asi: true }});
        editor.setValue(initialCode);

        var breakpointSetCallback;
        var breakpointUnsetCallback;
        editor.on("gutterClick", function(cm, n) {
            var info = cm.lineInfo(n);
            var breakpointExists = info.gutterMarkers;
            if(breakpointExists){
                if(breakpointUnsetCallback){
                    breakpointUnsetCallback(n);
                }

            }else{
                if(breakpointSetCallback){
                    breakpointSetCallback(n);
                }
            }
            cm.setGutterMarker(n, "breakpoints", info.gutterMarkers ? null : makeMarker());
        });

        function makeMarker() {
            var marker = document.createElement("div");
            marker.style.color = "#822";
            marker.innerHTML = "●";
            return marker;
        }
        markersCursor = [];


    function setMarker(loc) {
        if(loc && loc.start){
            markersCursor.forEach(marker => marker.clear());
            markersCursor = [];
            markersCursor.push(editor.markText({line: loc.start.line-1, ch: loc.start.column}, {line: loc.end.line-1, ch: loc.end.column}, {className: "styled-background"}));
        }
    }

    function getText(){
        return editor.getValue();
    }

    function setBreakpointSetCallback(callback){
        breakpointSetCallback = callback;
    }

    function setBreakpointUnsetCallback(callback){
        breakpointUnsetCallback = callback;
    }

    function undefinedCheck(value,defaultValue){
        if(typeof defaultValue === "undefined"){
            //No default value given. Check if value is undefined and return result
            return typeof value === "undefined"
        }
        else{
            //Check if value is undefined and return value or defaultValue
            return (typeof value === "undefined") ? defaultValue : value;
        }
    }

    function domCheck(node){
        return node instanceof HTMLElement;
    }

    return{
        setMarker:setMarker,
        getText:getText,
        setBreakpointSetCallback:setBreakpointSetCallback,
        setBreakpointUnsetCallback:setBreakpointUnsetCallback
    }
}

















































