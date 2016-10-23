(function(sunlight, undefined){

	if (sunlight === undefined || sunlight["registerLanguage"] === undefined) {
		throw "Include sunlight.js before including language files";
	}

	sunlight.registerLanguage("pony", {
		keywords: [
		  "actor", "addressof", "as", "be", "break", "class", "compiler_intrinsic", "consume", "continue", "do", "else", "elseif", "embed", "end", "error", "for", "fun", "if", "ifdef", "in", "interface", "is", "isnt", "lambda", "let", "match", "new", "not", "object", "primitive", "recover", "repeat", "return", "struct", "then", "this", "trait", "try", "type", "until", "use", "var", "where", "while", "with"
		],

		scopes: {
			longString: [
				["\"\"\"", "\"\"\"", sunlight.util.escapeSequences.concat(["\\\""])],
				["'''", "'''", sunlight.util.escapeSequences.concat(["\\'"])]
			],
			string: [ ["\"", "\"", sunlight.util.escapeSequences.concat(["\\\""])] ],
			comment: [ ["//", "\n", null, true], ["/*", "*/"] ]
		},

		customTokens: {
            binops: {
				values: ["or", "and", "isnt"],
				boundary: " "
            },
			booleans: {
				values: ["true", "false"],
				boundary: ""
			}
		},

		customParseRules: [],

		identFirstLetter: /[@A-Za-z_]/,
		identAfterFirstLetter: /\w/,

		namedIdentRules: {
			follows: [
				//class names
				//function names
				[{ token: "keyword", values: ["actor", "be", "class", "fun", "lambda", "new", "use"] }, sunlight.util.whitespace]
			]
		},

		operators: [
			"!", "->", "^", "@", "&", "->", "=>", "~", "?", "'", "<:"
		],

		contextItems: {
			heredocQueue: []
		}
	});
}(this["Sunlight"]));