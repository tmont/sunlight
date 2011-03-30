(function(sunlight, undefined){

	if (sunlight === undefined || sunlight["registerLanguage"] === undefined) {
		throw "Include sunlight.js before including language files";
	}

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
				[{ token: "ident" }, sunlight.helpers.whitespace, { token: "keyword", values: ["extends", "implements"] }, sunlight.helpers.whitespace],
				
				//method/property return values
				//new: public new Foo Method() { } and new Foo();
				//class/interface names
				[{ token: "keyword", values: ["class", "interface", "enum", "public", "private", "protected", "static", "final", "new"] }, sunlight.helpers.whitespace]
			],

			precedes: [
				//casting
				[sunlight.helpers.whitespace, { token: "punctuation", values: [")"] }, sunlight.helpers.whitespace, { token: "ident" }],
				[sunlight.helpers.whitespace, { token: "punctuation", values: [")"] }, sunlight.helpers.whitespace, { token: "keyword", values: ["this"] }],
				
				//arrays
				[sunlight.helpers.whitespace, { token: "punctuation", values: ["["] }, sunlight.helpers.whitespace, { token: "punctuation", values: ["]"] }], //in method parameters
				[sunlight.helpers.whitespace, { token: "punctuation", values: ["["] }, sunlight.helpers.whitespace, { token: "number" }, sunlight.helpers.whitespace, { token: "punctuation", values: ["]"] }], //declaration with integer
				[sunlight.helpers.whitespace, { token: "punctuation", values: ["["] }, sunlight.helpers.whitespace, { token: "ident" }, sunlight.helpers.whitespace, { token: "punctuation", values: ["]"] }], //declaration with variable

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
			"?", ":", ".", "="
		]
	});
}(window["Sunlight"]));