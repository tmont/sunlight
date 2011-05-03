(function(sunlight, undefined){

	if (sunlight === undefined || sunlight["registerLanguage"] === undefined) {
		throw "Include sunlight.js before including language files";
	}
	
	sunlight.registerLanguage("objective-c", {
		keywords: [
			//c++ keywords
			"and","default","noexcept","template","and_eq","delete","not","this","alignof","double",
			"not_eq","thread_local","asm","dynamic_cast","nullptr","throw","auto","else","operator",
			"true","bitand","enum","or","try","bitor","explicittodo","or_eq","typedef","bool","export",
			"private","typeid","break","externtodo","protected","typename","case","false","public","union",
			"catch","float","register","using","char","for","reinterpret_cast","unsigned","char16_t",
			"friend","return","void","char32_t","goto","short","wchar_t","class","if","signed","virtual",
			"compl","inline","sizeof","volatile","const","int","static","while","constexpr","long",
			"static_assert","xor","const_cast","mutable","static_cast","xor_eq","continue","namespace",
			"struct","decltype","new","switch",
			
			//objective c keywords
			"id", "self", "nil", "super", "in", "out", "inout", "bycopy", "byval", "oneway",
			
			"SEL", "BOOL", "YES", "NO",
			
			"@interface", "@implementation", "@end", "@class",
			"@private", "@public", "@package", "@protected",
			"@protocol", "@optional", "@required",
			"@property", "@synthesize", "@dynamic",
			"@selector",
			"@try", "@catch", "@finally", "@throw",
			"@synchronized",
			"@encode",
			
			"__attribute__", 
			
			//these seem to be conditional, somehow...
			"__weak", "__strong"
		],
		
		customTokens: {
			constant: {
				values: [
					"EXIT_SUCCESS", "EXIT_FAILURE",
					"SIG_DFL", "SIG_IGN", "SIG_ERR", "SIGABRT", "SIGFPE", "SIGILL", "SIGINT", "SIGSEGV", "SIGTERM"
				],
				boundary: "\\b"
			},
			
			builtinMessage: {
				values: [
					"init", "alloc", "class", "release", "dealloc", "autorelease"
				],
				boundary: "\\b"
			}
		},

		scopes: {
			string: [ ["\"", "\"", sunlight.util.escapeSequences.concat(["\\\""])], ["@\"", "\""] ],
			"char": [ ["'", "'", ["\\\'", "\\\\"]] ],
			comment: [ ["//", "\n", null, true], ["/*", "*/"] ],
			preprocessorDirective: [ ["#", "\n", null, true] ]
		},
		
		customParseRules: [
			//@property attributes
			function() {
				var attributes = sunlight.util.createHashMap([
					"getter", "setter", 
					"readonly", "readwrite",
					"assign", "retain", "copy",
					"nonatomic"
				], "\\b");
				
				return function(context) {
					var token = sunlight.util.matchWord(context, attributes, "keyword", true);
					if (!token) {
						return null;
					}
					
					//must be inside () after @property
					
					//look backward for "("
					//if we find a ";" before a "(" then that's no good
					var prevToken, index = context.count();
					while (prevToken = context.token(--index)) {
						if (prevToken.name === "punctuation") {
							if (prevToken.value === "(") {
								//previous token must be @property
								prevToken = sunlight.util.getPreviousNonWsToken(context.getAllTokens(), index);
								if (!prevToken || prevToken.name !== "keyword" || prevToken.value !== "@property") {
									return null;
								}
								
								token.line = context.reader.getLine();
								token.column = context.reader.getColumn();
								context.reader.read(token.value.length - 1);
								return token;
							} else if (prevToken.value === ";") {
								return null;
							}
						}
					}
					
					return null;
				};
			}()
		],

		identFirstLetter: /[A-Za-z_]/,
		identAfterFirstLetter: /\w/,

		
		//inside <> (protocols)
		//after classname in () (categories)
		
		namedIdentRules: {
			custom: [
				//pointer default declarations, e.g. pointer* myPointer;
				function() {
					var precedes = [[
							sunlight.util.whitespace,
							{ token: "operator", values: ["*", "**"] }, 
							sunlight.util.whitespace,
							{ token: "ident" }, 
							sunlight.util.whitespace, 
							{ token: "punctuation", values: [";"] }
						], [
							//function parameters
							{ token: "default" },
							{ token: "operator", values: ["&"] },
							sunlight.util.whitespace,
							{ token: "ident" }
							
						]
					];
					
					return function(context) {
						//basically, can't be on the right hand side of an equals sign
						//so we traverse the tokens backward, and if we run into a "=" before a ";" or a "{", it's no good
						
						var precedesIsSatisfied = function(tokens) {
							for (var i = 0; i < precedes.length; i++) {
								if (sunlight.util.createProceduralRule(context.index + 1, 1, precedes[i], false)(tokens)) {
									return true;
								}
							}
							
							return false;
						}(context.tokens);
						
						if (!precedesIsSatisfied) {
							return false;
						}
						
						//make sure we're not on the left side of the equals sign
						//objc addition: okay if part of a @property statement
						var isPartOfProperty = false, foundEquals = false;
						var token, index = context.index;
						while (token = context.tokens[--index]) {
							if (token.name === "punctuation" && (token.value === ";" || token.value === "{")) {
								return isPartOfProperty || !foundEquals;
							}
							
							if (token.name === "operator" && token.value === "=") {
								foundEquals = true;
							} else if (token.name === "keyword" && token.value === "@property") {
								isPartOfProperty = true;
							}
						}
						
						return false;
					};
				}(),
				
				//casting
				function() {
					var precedes = [
						[sunlight.util.whitespace, { token: "punctuation", values: [")"] }, sunlight.util.whitespace, { token: "ident" }],
						[
							sunlight.util.whitespace, 
							{ token: "operator", values: ["*", "**"] }, 
							sunlight.util.whitespace, 
							{ token: "punctuation", values: [")"] }, 
							sunlight.util.whitespace, 
							{ token: "operator", values: ["&"], optional: true }, 
							{ token: "ident" }
						]
					];
				
					return function(context) {
						var precedesIsSatisfied = function(tokens) {
							for (var i = 0; i < precedes.length; i++) {
								if (sunlight.util.createProceduralRule(context.index + 1, 1, precedes[i], false)(tokens)) {
									return true;
								}
							}
							
							return false;
						}(context.tokens);
						
						if (!precedesIsSatisfied) {
							return false;
						}
						
						//make sure the previous tokens are "(" and then not a keyword
						//this'll make sure that things like "if (foo) doSomething();" won't color "foo"
						
						var token, index = context.index;
						while (token = context.tokens[--index]) {
							if (token.name === "punctuation" && token.value === "(") {
								var prevToken = sunlight.util.getPreviousNonWsToken(context.tokens, index);
								if (prevToken && prevToken.name === "keyword") {
									return false;
								}
								
								return true;
							}
						}
						
						return false;
					};
				}(),
				
				//generic definitions/params between "<" and ">"
				function(context) {
					//between < and > and preceded by an ident and not preceded by "class"
					var index = context.index, token;
					
					//if the previous token is a keyword, then we don't care about it
					var prevToken = sunlight.util.getPreviousNonWsToken(context.tokens, context.index);
					if (!prevToken || prevToken.name === "keyword") {
						return false;
					}
					
					//look for "<" preceded by an ident but not "class"
					//if we run into ">" before "," or "<" then it's a big fail
					var foundIdent = false, bracketCountLeft = [0, 0], bracketCountRight = [0, 0];
					while ((token = context.tokens[--index]) !== undefined) {
						if (token.name === "operator") {
							switch (token.value) {
								case "<":
								case "<<":
									bracketCountLeft[0] += token.value.length;
									continue;
								case ">":
								case ">>":
									if (bracketCountLeft[0] === 0) {
										return false;
									}
									
									bracketCountLeft[1] += token.value.length;
									continue;
								case ".":
									//allows generic method invocations, like "Foo" in "foo.Resolve<Foo>()"
									continue;
							}
						}
						
						if (
							//(token.name === "keyword" && sunlight.util.contains(acceptableKeywords, token.value))
							token.name === "default"
							|| (token.name === "punctuation" && token.value === ",")
						) {
							continue;
						}
						
						if (token.name === "ident" || (token.name === "keyword" && token.value === "id")) {
							foundIdent = true;
							continue;
						}
						
						//anything else means we're no longer in a generic definition
						break;
					}
					
					if (!foundIdent || bracketCountLeft[0] === 0) {
						//not inside a generic definition
						return false;
					}
						console.dir(context.tokens[context.index]);
					
					
					//now look forward to make sure the generic definition is closed
					//this avoids false positives like "foo < bar"
					index = context.index;
					while ((token = context.tokens[++index]) !== undefined) {
						if (token.name === "operator" && (token.value === ">" || token.value === ">>")) {
							return true;
						}
						
						if (
							//(token.name === "keyword" && sunlight.util.contains(acceptableKeywords, token.value))
							(token.name === "operator" && sunlight.util.contains(["<", "<<", ">", ">>"], token.value))
							|| (token.name === "punctuation" && token.value === ",")
							|| token.name === "ident"
							|| token.name === "default"
						) {
							continue;
						}
						
						return false;
					}
					
					return false;
				}
			],
			
			follows: [
				[{ token: "keyword", values: ["@interface", "@protocol", "@implementation"] }, { token: "default" }]
			],
			
			precedes: [
				//normal parameters/declarations
				[{ token: "default" }, { token: "ident" }],
				
				[sunlight.util.whitespace, { token: "operator", values: ["*", "**"] }, { token: "default" }, { token: "ident" }, sunlight.util.whitespace, { token: "operator", values: ["=", ","] }],
				[sunlight.util.whitespace, { token: "operator", values: ["*", "**"] }, { token: "default" }, { token: "operator", values: ["&"] }, sunlight.util.whitespace, { token: "ident" }, sunlight.util.whitespace, { token: "operator", values: ["=", ","] }],
			]
		},
		
		//http://www.cppreference.com/wiki/language/operator_precedence
		operators: [
			"==", "=",
			"+=", "++", "+",
			"->*", "->", "-=", "--", "-",
			"**", "*=", "*", //added ** for double pointer convenience
			"/=", "/",
			"%=", "%",
			"!=", "!",
			">>=", ">>", ">=", ">",
			"<<=", "<<", "<=", "<",
			"&=", "&&", "&",
			"|=", "||", "|",
			"~",
			"^=", "^",
			".*", ".",
			"?",
			"::", ":",
			","
		]
		
	});
}(this["Sunlight"]));