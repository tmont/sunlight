(function(sunlight, undefined){

	if (sunlight === undefined || sunlight["registerLanguage"] === undefined) {
		throw "Include sunlight.js before including language files";
	}

	var whitespace = { token: "default", optional: true };
	var jsAnalyzer = sunlight.createAnalyzer();
	jsAnalyzer.enterReservedWord = function(context) { context.append("<span class=\"sunlight-reserved-word\">"); };
	jsAnalyzer.exitReservedWord = function(context) { context.append("</span>"); };
	jsAnalyzer.enterRegex = function(context) { context.append("<span class=\"sunlight-regex\">"); };
	jsAnalyzer.exitRegex = function(context) { context.append("</span>"); };
	jsAnalyzer.enterGlobalVariable = function(context) { context.append("<span class=\"sunlight-global-variable\">"); };
	jsAnalyzer.exitGlobalVariable = function(context) { context.append("</span>"); };
	jsAnalyzer.enterGlobalFunction = function(context) { context.append("<span class=\"sunlight-global-function\">"); };
	jsAnalyzer.exitGlobalFunction = function(context) { context.append("</span>"); };
	jsAnalyzer.enterGlobalObject = function(context) { context.append("<span class=\"sunlight-global-object\">"); };
	jsAnalyzer.exitGlobalObject = function(context) { context.append("</span>"); };
	jsAnalyzer.enterWindowFunction = function(context) { context.append("<span class=\"sunlight-window-function\">"); };
	jsAnalyzer.exitWindowFunction = function(context) { context.append("</span>"); };
	
	sunlight.registerLanguage(["js", "javascript"], {
		keywords: [
			//keywords
			"break", "case", "catch", "continue", "default", "delete", "do", 
			"else",	"finally", "for", "function", "if", "in", "instanceof",
			"new", "return", "switch", "this", "throw", "try", "typeof", 
			"var", "void", "while", "with",
			
			//literals
			"true", "false", "null"
		],
		
		customTokens: {
			reservedWord: [
				"abstract", "boolean", "byte", "char", "class", "const", "debugger", "double",
				"enum", "export", "extends", "final", "float", "goto", "implements", "import",
				"int", "interface", "long", "native", "package", "private", "protected", "public",
				"short", "static", "super", "synchronized", "throws", "transient", "volatile"
			],
			
			globalVariable: ["window", "document", "NaN", "Infinity", "undefined"],
			
			globalFunction: [
				"encodeURI", "encodeURIComponent", 
				"decodeURI", "decodeURIComponent",
				"parseInt", "parseFloat",
				"isNaN",
				"isFinite",
				"eval"
			],
			
			windowFunction: [
				"confirm", "alert", "prompt",
				"clearInterval", "clearTimeout",
				"setInterval", "setTimeout",
				
				/*
				"scrollBy", "scollTo",
				"resizeBy", "resizeTo",
				"moveBy", "moveTo",
				"print", "close", "open",
				"blur"
				*/
			],
			
			globalObject: [
				"Math", "JSON",
				"XMLHttpRequest", "XDomainRequest", "ActiveXObject",
				"Boolean", "Date", "Array", "Image", "Function", "Object", "Number", "RegExp", "String"
			]
		},

		scopes: {
			string: [ ["\"", "\"", sunlight.defaultEscapeSequences.concat(["\\\""])], ["'", "'", sunlight.defaultEscapeSequences.concat(["\\\'", "\\\\"])] ],
			comment: [ ["//", "\n", null, true], ["/*", "*/"] ],
			regex: [ ["/", "/", ["\\/", "\\\\"]] ]
		},
		
		identFirstLetter: /[$A-Za-z_]/,
		identAfterFirstLetter: /[\w\$]/,

		namedIdentRules: {
			follows: [
				[{ token: "keyword", values: ["function"] }, whitespace]
			]
		},

		operators: [
			//arithmetic
			"++", "+=", "+",
			"--", "-=", "-",
			      "*=", "*",
			      "/=", "/",
			      "%=", "%",

			//boolean
			"&&", "||",

			//bitwise
			"|=",   "|",
			"&=",   "&",
			"^=",   "^",
			">>>=", ">>>", ">>=", ">>",
			"<<=", "<<",

			//inequality
			"<=", "<",
			">=", ">",
			"===", "==", "!==", "!=",

			//unary
			"!", "~",

			//other
			"?", ":", ".", "="
		],
		
		tokenAnalyzerMap: {
			reservedWord: ["enterReservedWord", "exitReservedWord"],
			regex: ["enterRegex", "exitRegex"],
			globalObject: ["enterGlobalObject", "exitGlobalObject"],
			globalFunction: ["enterGlobalFunction", "exitGlobalFunction"],
			windowFunction: ["enterWindowFunction", "exitWindowFunction"],
			globalVariable: ["enterGlobalVariable", "exitGlobalVariable"]
		},
		
		analyzer: jsAnalyzer

	});
}(window["Sunlight"]));