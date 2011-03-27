(function(sunlight, undefined){

	if (sunlight === undefined || sunlight["registerLanguage"] === undefined) {
		throw "Include sunlight.js before including language files";
	}

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
		
		//[opener, closer, closer escape token]
		stringScopes: [ ["\"", "\"", "\\\""], ["@\"", "\"", "\"\""], ["'", "'", "\'"] ],
		
		//[opener, closer, zeroWidthCloser?]
		commentScopes: [ ["//", "\n", true], ["/*", "*/", false] ],
		
		otherScopes: {
			//pragma
			pragma: ["#", "\n"]
		},
		
		identFirstLetter: /[A-Za-z_]/,
		identAfterFirstLetter: /\w/,
		
		namedIdentRules: {
			follows: [
				//class names
				[{ token: "keyword", value: "class" }],
				
				//extends/implements class names
				[{ token: "namedIdent", value: null }, { token: "operator", value: ":" }],
				[{ token: "ident", value: null }, { token: "punctuation", value: "," }],
				
				//public new int Method() { }
				//new Foo();
				[{ token: "keyword", value: "new" }],
				
				//method/property return values
				[{ token: "keyword", value: "public" }],
				[{ token: "keyword", value: "static" }],
				[{ token: "keyword", value: "protected" }],
				[{ token: "keyword", value: "internal" }],
				[{ token: "keyword", value: "virtual" }],
				[{ token: "keyword", value: "private" }],
				[{ token: "keyword", value: "sealed" }],
				
				//field types
				[{ token: "keyword", value: "readonly" }],
				[{ token: "keyword", value: "const" }],
				
				//special method parameters
				[{ token: "keyword", value: "ref" }],
				[{ token: "keyword", value: "out" }]
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
		
	});
}(window["Sunlight"]));