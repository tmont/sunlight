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
			"if", "else", "try", "catch", "finally", "break", "continue", "goto", "case", "throw", "return", "yield return", "yield break",
			
			//parameter qualifiers
			"in", "out", "ref", "params", 
			
			//type comparison
			"as", "is", "typeof", 
			
			//other
			"this", "sizeof", "stackalloc", "var",
			
			//contextual keywords
			"get", "set", "value"
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
		
		operators: [
			//arithmetic
			"+", "+=", "++",
			"-", "-=", "--",
			"*", "*=", 
			"/", "/=",
			"%", "%=",
			
			//bitwise
			"|", "|=",
			"&", "&=",
			"^", "^=",
			">>", ">>=",
			"<<", "<<=",
			
			//unary
			"!", "~",
			
			//boolean
			"&&", "||",
			
			//inequality
			"<", "<=",
			">", ">=",
			"==", "!=",
			
			//other
			"??", "?", ":", "."
		],
		
	});
}(window["Sunlight"]));