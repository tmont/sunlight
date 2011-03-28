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
			custom: [
				//extends/implements/type constraints
				function(context) {
					//between ":" and "{" but not case statements
					
					//look backward for a ":" not preceded by a "case"
					var index = context.index, token, foundColon = false;
					while ((token = context.tokens[--index]) !== undefined) {
						if (token.name === "punctuation" && token.value === "{") {
							return false;
						}
						
						if (token.name === "keyword" && token.value === "case") {
							return false;
						}
						
						if (token.name === "keyword" && (token.value === "class" || token.value === "where")) {
							//the "class" keyword for classes
							//or the "where" keyword for generic methods/classes with type constraints
							
							//if "class" is used as a type constraint, then ignore it
							var nextToken = context.tokens[index + 1].name === "default" ? context.tokens[index + 2] : context.tokens[index + 1];
							if (nextToken.name === "punctuation" && nextToken.value === ",") {
								continue;
							}
							
							break;
						}
						
						if (token.name === "operator" && token.value === ":") {
							//make sure there isn't a case preceding it
							foundColon = true;
						}
					}
					
					if (!foundColon) {
						return false;
					}
					
					return context.append("<span class=\"sunlight-named-ident\">") || true;
				},
				
				//generic params
				function(context) {
					//between < and > and preceded by an ident
					var index = context.index, token;
					
					//look for "<" preceded by an ident
					while ((token = context.tokens[--index]) !== undefined) {
						
					}
					
					return false;
				}
			],
			
			follows: [
				//method/property return values
				//special method parameters
				//new: public new Foo Method() { } and new Foo();
				//class/interface/event/struct/delegate names
				[{ token: "keyword", values: ["class", "interface", "event", "struct", "enum", "delegate", "public", "private", "protected", "internal", "static", "virtual", "sealed", "new", "ref", "out", "params"] }, whitespace],

				//typeof/default
				[{ token: "keyword", values: ["typeof", "default"] }, whitespace, { token: "punctuation", values: ["("] }, whitespace ]
			],

			precedes: [
				//casting
				[whitespace, { token: "punctuation", values: [")"] }, whitespace, { token: "ident" }],
				[whitespace, { token: "punctuation", values: [")"] }, whitespace, { token: "keyword", values: ["this"] }],

				//assignment: Object o = new object();
				//method parameters: public int Foo(Foo foo, Bar b, Object o) { }
				[{ token: "default" }, { token: "ident" }]
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
			"??", "?", "::", ":", ".", "=>", "="
		],
		
		tokenAnalyzerMap: {
			pragma: ["enterPragma", "exitPragma"]
		},
		
		analyzer: cSharpAnalyzer

	});
}(window["Sunlight"]));