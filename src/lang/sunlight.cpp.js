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
			}
		},

		scopes: {
			string: [ ["\"", "\"", sunlight.util.escapeSequences.concat(["\\\""])] ],
			"char": [ ["'", "'", ["\\\'", "\\\\"]] ],
			comment: [ ["//", "\n", null, true], ["/*", "*/"] ],
			preprocessorDirective: [ ["#", "\n", null, true] ]
		},
		
		customParseRules: [	
			//preprocessor directive
			//http://www.cppreference.com/wiki/preprocessor/start
			// function() {
				// var directives = sunlight.util.createHashMap(["define", "undef", "include", "if", "ifdef", "ifndef", "else", "elif", "line", "error", "pragma", "warning"], "\\b", false);
				// return function(context) {
					// var current = context.reader.current();
					// if (current !== "#") {
						// return null;
					// }
					
					// return null;
				// };
			// }()
		],

		identFirstLetter: /[A-Za-z_]/,
		identAfterFirstLetter: /\w/,

		namedIdentRules: {
			follows: [
				[{ token: "keyword", values: ["enum", "struct", "union", "class"] }, sunlight.util.whitespace],
			],
			
			precedes: [
				[{ token: "default" }, { token: "ident" }],
				
				//e.g. "std" in "std::char_traits<CharT>"
				[sunlight.util.whitespace, { token: "operator", values: ["::"] }],
			]
		},
		
		//http://www.cppreference.com/wiki/language/operator_precedence
		operators: [
			"==", "=",
			"+=", "++", "+",
			"->*", "->", "-=", "--", "-",
			"*=", "*",
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