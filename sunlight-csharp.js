(function(sunlight, undefined){

	if (sunlight === undefined || sunlight["registerLanguage"] === undefined) {
		throw "Include sunlight.js before including language files";
	}

	var whitespace = { token: "default", optional: true };
	var cSharpAnalyzer = sunlight.createAnalyzer();
	cSharpAnalyzer.enterPragma = function(context) { context.append("<span class=\"sunlight-pragma\">"); };
	cSharpAnalyzer.exitPragma = function(context) { context.append("</span>"); };

	sunlight.registerLanguage(["c#", "csharp"], {
		keywords: [
			//class qualifiers
			"public", "private", "protected", "internal", "static", "sealed", "abstract", "partial",

			//method qualifiers
			"virtual", "override", "new", "implicit", "explicit", "extern", "override", "operator",

			//member qualifiers
			"const", "readonly", "volatile",

			//types
			"class", "interface", "enum", "struct", "event", "delegate",

			//primitives
			"int", "bool", "double", "float", "char", "byte", "sbyte", "uint", "long", "ulong", "char", "decimal", "short", "ushort",

			//literals
			"null", "true", "false",

			//aliases
			"string", "object", "void",

			//looping
			"for", "foreach", "do", "while",

			//scoping
			"fixed", "unchecked", "using", "lock", "namespace", "checked", "unsafe",

			//flow control
			"if", "else", "try", "catch", "finally", "break", "continue", "goto", "case", "throw", "return", "switch", "yield return", "yield break",

			//parameter qualifiers
			"in", "out", "ref", "params",

			//type comparison
			"as", "is", "typeof",

			//other
			"this", "sizeof", "stackalloc", "var", "default",

			//contextual keywords
				//property stuff
				"get", "set", "value",

				//linq
				"from", "select", "where", "groupby", "orderby"
		],

		scopes: {
			//token name => array[opener, closer, escape token (optional), zeroWidthCloser? (optional)]
			
			//escape token is either a hard-coded string or an object with keys length and regex, e.g. { length: 2, regex: /\d;/ }
			
			string: [ ["\"", "\"", sunlight.defaultEscapeSequences.concat(["\\\""])], ["@\"", "\"", ["\"\""]], ["'", "'", ["\'", "\\\\"]] ],
			comment: [ ["//", "\n", null, true], ["/*", "*/"] ],
			pragma: [ ["#", "\n", null, true] ]
		},

		identFirstLetter: /[A-Za-z_@]/,
		identAfterFirstLetter: /\w/,

		namedIdentRules: {
			follows: [
				//extends/implements class names
				[{ token: "ident" }, whitespace, { token: "operator", values: [":"] }, whitespace],
				//[{ token: "ident" }, whitespace, { token: "punctuation", values: [","] }, whitespace],

				//generic classes
				[{ token: "operator", values: [">", ">>"] }, whitespace, { token: "operator", values: [":"] }, whitespace ],

				// //where T : class, IDisposable
				[{ token: "keyword", values: ["class", "event", "struct", "delegate"] }, whitespace, { token: "punctuation", values: [","] }, whitespace],

				//method/property return values
				//special method parameters
				//field types
				//new: public new int Method() { } and new Foo();
				//class/interface/event/struct/delegate names
				[{ token: "keyword", values: ["class", "interface", "event", "struct", "enum", "delegate", "public", "private", "protected", "internal", "static", "virtual", "sealed", "new", "readonly", "const", "ref", "out", "params"] }, whitespace],

				//typeof
				[{ token: "keyword", values: ["typeof"] }, whitespace, { token: "punctuation", values: ["("] }, whitespace ]
			],

			precedes: [
				//casting
				[whitespace, { token: "punctuation", values: [")"] }, whitespace, { token: "ident" }],
				[whitespace, { token: "punctuation", values: [")"] }, whitespace, { token: "keyword", values: ["this"] }],

				//assignment: Object o = new object();
				//method parameters: public int Foo(Foo foo, Bar b, Object o) { }
				[{ token: "default" }, { token: "ident" }]
			],

			between: [
				//classes in extends/implements
				{ opener: { token: "operator", values: [":"] }, closer: { token: "punctuation", values: ["{"] } },
				{ opener: { token: "keyword", values: ["class"] }, closer: { token: "punctuation", values: ["{"] } },

				//generic type params
				{ opener: { token: "operator", values: ["<", "<<"] }, closer: { token: "operator", values: [">", ">>"] } }
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
			">>=", ">>",
			"<<=", "<<",

			//inequality
			"<=", "<",
			">=", ">",
			"==", "!=",

			//unary
			"!", "~",

			//other
			"??", "?", ":", ".", "=>", "="
		],
		
		tokenAnalyzerMap: {
			pragma: ["enterPragma", "exitPragma"]
		},
		
		analyzer: cSharpAnalyzer

	});
}(window["Sunlight"]));