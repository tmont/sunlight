(function(sunlight, document, undefined){

	if (sunlight === undefined || sunlight["registerLanguage"] === undefined) {
		throw "Include sunlight.js before including language files";
	}

	sunlight.registerLanguage("cpp", {
		//http://www.cppreference.com/wiki/keywords/start
		keywords: [
			"and","default","noexcept","template","and_eq","delete","not","this","alignof","double",
			"not_eq","thread_local","asm","dynamic_cast","nullptr","throw","auto","else","operator",
			"true","bitand","enum","or","try","bitor","explicittodo","or_eq","typedef","bool","export",
			"private","typeid","break","externtodo","protected","typename","case","false","public","union",
			"catch","float","register","using","char","for","reinterpret_cast","unsigned","char16_t",
			"friend","return","void","char32_t","goto","short","wchar_t","class","if","signed","virtual",
			"compl","inline","sizeof","volatile","const","int","static","while","constexpr","long",
			"static_assert","xor","const_cast","mutable","static_cast","xor_eq","continue","namespace",
			"struct","decltype","new","switch"
		],
		
		customTokens: {
			constant: {
				values: [
					"EXIT_SUCCESS", "EXIT_FAILURE",
					"SIG_DFL", "SIG_IGN", "SIG_ERR", "SIGABRT", "SIGFPE", "SIGILL", "SIGINT", "SIGSEGV", "SIGTERM"
				],
				boundary: "\\b"
			},
			
			//http://www.cppreference.com/wiki/utility/types/start
			basicType: {
				values: ["ptrdiff_t", "size_t", "nullptr_t", "max_align_t"],
				boundary: "\\b"
			},
			
			ellipsis: {
				values: ["..."],
				boundary: ""
			}
		},

		scopes: {
			string: [ ["\"", "\"", sunlight.util.escapeSequences.concat(["\\\""])] ],
			"char": [ ["'", "'", ["\\\'", "\\\\"]] ],
			comment: [ ["//", "\n", null, true], ["/*", "*/"] ],
			preprocessorDirective: [ ["#", "\n", null, true] ]
		},
		
		customParseRules: [	
		],

		identFirstLetter: /[A-Za-z_]/,
		identAfterFirstLetter: /\w/,

		namedIdentRules: {
			custom: [
				//pointer default declarations, e.g. pointer* myPointer;
				function() {
					var precedes = [[
							sunlight.util.whitespace, 
							{ token: "operator", values: ["*", "**"] }, 
							{ token: "default" },
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
						var token, index = context.index;
						while (token = context.tokens[--index]) {
							if (token.name === "punctuation" && (token.value === ";" || token.value === "{")) {
								return true;
							}
							
							if (token.name === "operator" && token.value === "=") {
								return false;
							}
						}
						
						return false;
					};
				}(),
				
				//casting
				function() {
					var precedes = [
						[sunlight.util.whitespace, { token: "punctuation", values: [")"] }, sunlight.util.whitespace, { token: "ident" }],
						[{ token: "operator", values: ["*", "**"] }, sunlight.util.whitespace, { token: "punctuation", values: [")"] }, sunlight.util.whitespace, { token: "operator", values: ["&"], optional: true }, { token: "ident" }]
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
				}()
			],
			
			follows: [
				[{ token: "keyword", values: ["enum", "struct", "union", "class"] }, sunlight.util.whitespace],
			],
			
			precedes: [
				//normal parameters/declarations
				[{ token: "default" }, { token: "ident" }],
				
				[sunlight.util.whitespace, { token: "operator", values: ["*", "**"] }, { token: "default" }, { token: "ident" }, sunlight.util.whitespace, { token: "operator", values: ["=", ","] }],
				[sunlight.util.whitespace, { token: "operator", values: ["*", "**"] }, { token: "default" }, { token: "operator", values: ["&"] }, sunlight.util.whitespace, { token: "ident" }, sunlight.util.whitespace, { token: "operator", values: ["=", ","] }],
				
				//e.g. "std" in "std::char_traits<CharT>"
				[sunlight.util.whitespace, { token: "operator", values: ["::"] }]
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
}(window["Sunlight"], document));