(function(sunlight, undefined){

	if (sunlight === undefined || sunlight["registerLanguage"] === undefined) {
		throw "Include sunlight.js before including language files";
	}
	
	var whitespace = { token: "default", optional: true };

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
				[{ token: "keyword", values: ["class"] }, whitespace],
				
				//extends/implements class names
				[{ token: "ident" }, whitespace, { token: "operator", values: [":"] }, whitespace],
				//[{ token: "ident" }, whitespace, { token: "punctuation", values: [","] }, whitespace],
				
				//generic classes
				[{ token: "operator", values: [">", ">>"] }, whitespace, { token: "operator", values: [":"] }, whitespace ],
				
				// //where T : class, IDisposable
				[{ token: "keyword", values: ["class", "event", "struct", "delegate"] }, whitespace, { token: "punctuation", values: [","] }, whitespace],
				
				//public new int Method() { }
				//new Foo();
				[{ token: "keyword", values: ["new"] }, whitespace],
				
				//method/property return values
				[{ token: "keyword", values: ["public", "private", "protected", "internal", "static", "virtual", "sealed"] }, whitespace],
				
				//field types
				[{ token: "keyword", values: ["readonly", "const"] }, whitespace],
				
				//special method parameters
				[{ token: "keyword", values: ["ref", "out", "params"] }, whitespace]
			],
			
			precedes: [
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
			"??", "?", ":", ".", "=>", "="
		],
		
	});
}(window["Sunlight"]));