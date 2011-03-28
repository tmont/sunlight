(function(sunlight, undefined){

	if (sunlight === undefined || sunlight["registerLanguage"] === undefined) {
		throw "Include sunlight.js before including language files";
	}

	var whitespace = { token: "default", optional: true };
	var phpAnalyzer = sunlight.createAnalyzer();
	phpAnalyzer.enterVariable = function(context) { context.append("<span class=\"sunlight-variable\">"); }
	phpAnalyzer.exitVariable = function(context) { context.append("</span>"); }

	sunlight.registerLanguage(["php"], {
		keywords: [
			//class qualifiers
			"public", "private", "protected", "static", "final", "abstract",
			
			//class extension
			"extends", "implements",

			//member qualifiers
			"const", "var",

			//types
			"class", "interface", "enum", "struct", "event", "delegate",

			//primitives
			"integer", "boolean", "int", "bool", "double", "float", "real", "string",

			//literals
			"null", "true", "false",

			//looping
			"for", "foreach", "do", "while", "as", "in", "endwhile",

			//scoping
			"fixed", "unchecked", "using", "lock", "namespace", "checked", "unsafe",

			//flow control
			"if", "else", "elseif", "try", "catch", "break", "continue", "goto", "case", "throw", "return", "switch", "endif",

			//type comparison
			"instanceof",
			
			//closures
			"use",
			
			//oo
			"self", "parent",

			//other
			"default", "new", "function"
		],

		scopes: {
			//token name => array[opener, closer, escape sequences (optional), zeroWidthCloser? (optional)]
			
			string: [ ["\"", "\"", sunlight.defaultEscapeSequences.concat(["\\\""])], ["'", "'", ["\\\'", "\\\\"]] ],
			comment: [ ["//", "\n", null, true], ["/*", "*/"], ["#", "\n", null, true] ],
			variable: [ ["$", { length: 1, regex: /[^\$A-Za-z0-9_]/ }, null, true] ]
		},

		identFirstLetter: /[A-Za-z_]/,
		identAfterFirstLetter: /\w/,

		namedIdentRules: {
			follows: [
				//extends/implements class names
				[{ token: "ident" }, whitespace, { token: "keyword", values: ["extends", "implements"] }, whitespace],

				[{ token: "keyword", values: ["class", "interface", "abstract", "final", "new"] }, whitespace],
			],
			
			precedes: [
				//static method calls
				[whitespace, { token: "operator", values: ["::"] }],
				
				[{ token: "default" }, { token: "variable" }],
			],

			between: [
				//interface names after implements
				{ opener: { token: "keyword", values: ["implements"] }, closer: { token: "punctuation", values: ["{"] } },
				
				//namespace name
				{ opener: { token: "keyword", values: ["namespace"] }, closer: { token: "punctuation", values: [";"] } },
			]
		},

		operators: [
			//member access
			"::", "->",
			
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
			">>=", ">>",
			"<<=", "<<",

			//inequality
			"<=", "<",
			">=", ">",
			"===", "==", "!=",

			//unary
			"!", "~",

			//other
			"?:", "?", ":", ".", "=>", "="
		],
		
		tokenAnalyzerMap: {
			variable: ["enterVariable", "exitVariable"]
		},
		
		analyzer: phpAnalyzer

	});
}(window["Sunlight"]));