(function(sunlight, undefined){

	if (sunlight === undefined || sunlight["registerLanguage"] === undefined) {
		throw "Include sunlight.js before including language files";
	}

	var whitespace = { token: "default", optional: true };
	var jsAnalyzer = sunlight.createAnalyzer();
	jsAnalyzer.enterReservedWord = function(context) { context.append("<span class=\"sunlight-reserved-word\">"); };
	jsAnalyzer.exitReservedWord = function(context) { context.append("</span>"); };
	jsAnalyzer.enterRegexLiteral = function(context) { context.append("<span class=\"sunlight-regex-literal\">"); };
	jsAnalyzer.exitRegexLiteral = function(context) { context.append("</span>"); };
	jsAnalyzer.enterGlobalVariable = function(context) { context.append("<span class=\"sunlight-global-variable\">"); };
	jsAnalyzer.exitGlobalVariable = function(context) { context.append("</span>"); };
	jsAnalyzer.enterGlobalFunction = function(context) { context.append("<span class=\"sunlight-global-function\">"); };
	jsAnalyzer.exitGlobalFunction = function(context) { context.append("</span>"); };
	jsAnalyzer.enterGlobalObject = function(context) { context.append("<span class=\"sunlight-global-object\">"); };
	jsAnalyzer.exitGlobalObject = function(context) { context.append("</span>"); };
	
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
			
			globalVariable: ["NaN", "Infinity"],
			
			globalFunction: [
				"encodeURI", "encodeURIComponent", 
				"decodeURI", "decodeURIComponent",
				"parseInt", "parseFloat",
				"isNaN",
				"isFinite",
				"eval"
			],
			
			globalObject: [
				"Math", "JSON",
				"XMLHttpRequest", "XDomainRequest", "ActiveXObject",
				"Boolean", "Date", "Array", "Image", "Function", "Object", "Number", "RegExp", "String"
			]
		},

		scopes: {
			string: [ ["\"", "\"", sunlight.defaultEscapeSequences.concat(["\\\""])], ["'", "'", sunlight.defaultEscapeSequences.concat(["\\\'", "\\\\"])] ],
			comment: [ ["//", "\n", null, true], ["/*", "*/"] ]
		},
		
		customParseRules: [
			//regex literal
			function(context) {
				var peek = context.reader.peek();
				if (context.reader.current() !== "/" || peek === "/" || peek === "*") {
					//doesn't start with a / or starts with // (comment) or /* (multi line comment)
					return null;
				}
				
				var isValid = function() {
					var previousNonWsToken = context.token(context.count() - 1);
					var previousToken = null;
					if (context.defaultData.text !== "") {
						previousToken = context.createToken("default", context.defaultData.text); 
					}
					
					if (!previousToken) {
						previousToken = previousNonWsToken;
					}
					
					//first token of the string
					if (previousToken === undefined) {
						return true;
					}
					
					//since JavaScript doesn't require statement terminators, if the previous token was whitespace and contained a newline, then we're good
					if (previousToken.name === "default" && previousToken.value.indexOf("\n") > -1) {
						return true;
					}
					
					//valid operator
					if (previousNonWsToken.name === "operator" && sunlight.helpers.contains(["<", "<=", ">=", "==", "===", "!==", "!=", "="], previousNonWsToken.value)) {
						return true;
					}
					
					return previousNonWsToken.name === "punctuation";
				}();
				
				if (!isValid) {
					return null;
				}
				
				//read the regex literal
				var regexLiteral = "/";
				var line = context.reader.getLine();
				var column = context.reader.getColumn();
				var peek2, next;
				
				while (context.reader.peek() !== context.reader.EOF) {
					peek2 = context.reader.peek(2);
					if (peek2 === "\\/" || peek2 === "\\\\") {
						//escaped backslash or escaped forward slash
						regexLiteral += context.reader.read(2);
						continue;
					}
					
					regexLiteral += (next = context.reader.read());
					if (next === "/") {
						break;
					}
				}
				
				//read the regex modifiers
				//only "g", "i" and "m" are allowed, but for the sake of simplicity we'll just say any alphabetical character is valid
				while (context.reader.peek() !== context.reader.EOF) {
					if (!/[A-Za-z]/.test(context.reader.peek())) {
						break;
					}
					
					regexLiteral += context.reader.read();
				}
				
				return context.createToken("regexLiteral", regexLiteral, line, column);
			}
		],
		
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
			regexLiteral: ["enterRegexLiteral", "exitRegexLiteral"],
			globalObject: ["enterGlobalObject", "exitGlobalObject"],
			globalFunction: ["enterGlobalFunction", "exitGlobalFunction"],
			globalVariable: ["enterGlobalVariable", "exitGlobalVariable"]
		},
		
		analyzer: jsAnalyzer

	});
}(window["Sunlight"]));