(function(sunlight, undefined){

	if (sunlight === undefined || sunlight["registerLanguage"] === undefined) {
		throw "Include sunlight.js before including language files";
	}

	var whitespace = { token: "default", optional: true };
	var javaAnalyzer = sunlight.createAnalyzer();
	javaAnalyzer.enterAnnotation = function(context) { context.append("<span class=\"sunlight-annotation\">"); };
	javaAnalyzer.exitAnnotation = function(context) { context.append("</span>"); };

	sunlight.registerLanguage(["java"], {
		keywords: [
			//http://download.oracle.com/javase/tutorial/java/nutsandbolts/_keywords.html
			"abstract", "assert", "boolean", "break", "byte", "case", "catch", "char", "class", "const",
			"continue", "default", "do", "double", "else", "enum", "extends", "final", "finally", "float",
			"for", "goto", "if", "implements", "import", "instanceof", "int", "interface", "long", "native",
			"new", "package", "private", "protected", "public", "return", "short", "static", "strictfp" /* wtf? */, "super",
			"switch", "synchronized", "this", "throw", "throws", "transient", "try", "void", "volatile", "while",
			
			//literals
			"null", "false", "true"
		],
		
		scopes: {
			//token name => array[opener, closer, escape token (optional), zeroWidthCloser? (optional)]
			//escape token is either a hard-coded string or an object with keys length and regex, e.g. { length: 2, regex: /\d;/ }
			
			string: [ ["\"", "\"", sunlight.defaultEscapeSequences.concat(["\\\""])], ["'", "'", ["\'", "\\\\"]] ],
			comment: [ ["//", "\n", null, true], ["/*", "*/"] ],
			annotation: [ ["@", { length: 1, regex: /\B/ }, null, true] ],
		},

		identFirstLetter: /[A-Za-z_]/,
		identAfterFirstLetter: /\w/,

		namedIdentRules: {
			follows: [
				[{ token: "ident" }, whitespace, { token: "keyword", values: ["extends", "implements"] }, whitespace],
				
				//method/property return values
				//new: public new Foo Method() { } and new Foo();
				//class/interface names
				[{ token: "keyword", values: ["class", "interface", "enum", "public", "private", "protected", "static", "final", "new"] }, whitespace]
			],

			precedes: [
				//casting
				[whitespace, { token: "punctuation", values: [")"] }, whitespace, { token: "ident" }],
				[whitespace, { token: "punctuation", values: [")"] }, whitespace, { token: "keyword", values: ["this"] }],
				
				//arrays
				[whitespace, { token: "punctuation", values: ["["] }, whitespace, { token: "punctuation", values: ["]"] }], //in method parameters
				[whitespace, { token: "punctuation", values: ["["] }, whitespace, { token: "number" }, whitespace, { token: "punctuation", values: ["]"] }], //declaration with integer
				[whitespace, { token: "punctuation", values: ["["] }, whitespace, { token: "ident" }, whitespace, { token: "punctuation", values: ["]"] }], //declaration with variable

				//assignment: Object o = new object();
				//method parameters: public int Foo(Foo foo, Bar b, Object o) { }
				[{ token: "default" }, { token: "ident" }]
			],
			
			between: [
				{ opener: { token: "keyword", values: ["implements"] }, closer: { token: "punctuation", values: ["{"] } }
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
			"==", "!=",

			//unary
			"!", "~",

			//other
			"?", "::", ":", ".", "="
		],
		
		tokenAnalyzerMap: {
			annotation: ["enterAnnotation", "exitAnnotation"]
		},
		
		analyzer: javaAnalyzer

	});
}(window["Sunlight"]));