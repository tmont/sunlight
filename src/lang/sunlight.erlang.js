(function(sunlight, undefined){

	if (sunlight === undefined || sunlight["registerLanguage"] === undefined) {
		throw "Include sunlight.js before including language files";
	}
	
	sunlight.registerLanguage("erlang", {
		//http://www.haskell.org/haskellwiki/Keywords
		keywords: [
			"after","andalso","and","band","begin","bnot","bor","bsl","bsr","bxor","case","catch",
			"cond","div","end","fun","if","let","not","of","orelse","or","query","receive","rem",
			"try","when","xor",
			
			"true", "false"
		],
		
		customParseRules: [
			//atom/function/userDefinedFunction detection
			function(context) {
				if (!/[A-Za-z_]/.test(context.reader.current())) {
					return null;
				}
				
				var line = context.reader.getLine(), column = context.reader.getColumn();
				
				//read the ident (they can have letters, numbers, underscores and @-signs in them)
				var peek, count = 0;
				while (peek = context.reader.peek(++count)) {
					if (!/[\w@]$/.test(peek)) {
						break;
					}
				}
				
				ident = context.reader.current() + peek.substring(0, peek.length - 1);
				
				//if the next non-whitespace character is "(", then it's a function
				var isFunction = false;
				count--;
				//console.log(ident + ": " + count);
				while (peek = context.reader.peek(++count)) {
					if (!/\s$/.test(peek)) {
						if (/\($/.test(peek)) {
							isFunction = true;
						}
						
						break;
					}
					
					console.log(ident + ": " + count + " " + peek);
				}
				
				if (!isFunction && !/^[A-Z_]/.test(ident)) {
					//a little inefficient because reading the ident will have to happen again, but it might be a keyword or something
					return null;
				}
				
				context.reader.read(ident.length - 1);
				count = 1;
				
				if (isFunction) {
					//is it a function declaration? (preceded by -> operator)
					var parenCount = 1, letter;
					while (peek = context.reader.peek(++count)) {
						letter = peek.charAt(peek.length - 1);
						
						if (parenCount === 0) {
							//the next thing is a bunch of whitespace followed by ->, or fail
							while (peek = context.reader.peek(++count)) {
								if (!/\s$/.test(peek)) {
									if (/->$/.test(context.reader.peek(count + 1))) {
										//function declaration
										return context.createToken("userDefinedFunction", ident, line, column);
									}
									
									break;
								}
							}
							
							break;
						}
						
						if (letter === "(") {
							parenCount++;
						} else if (letter === ")") {
							parenCount--;
						}
					}
					
					//just a regular function call
					return context.createToken("function", ident, line, column);
				}
				
				return context.createToken("atom", ident, line, column);
			}
		],
		
		customTokens: {
			moduleAttribute: {
				values: [
					"-module", "-export", "-import", "-compile", "-vsn", "-behaviour", "-record",
					"-include", "-define", "-file", "-type", "-spec", "on_load"
				],
				boundary: "\\b"
			},
			
			macroDirective: {
				values: [
					"-undef", "-ifdef", "-ifndef", "-else", "-endif"
				],
				boundary: "\\b"
			}
		},
		
		scopes: {
			string: [ ["\"", "\"", sunlight.util.escapeSequences.concat(["\\\""])] ],
			quotedAtom: [ ["'", "'", ["\\'", "\\\\"]] ],
			comment: [ ["%", "\n", null, true] ],
			"char": [ ["$", { regex: /[^\w\\]/, length: 1 }, null, true] ],
			macro: [ ["?", { regex: /[^\w?]/, length: 1 }, null, true] ]
		},
		
		identFirstLetter: /[A-Za-z_]/,
		identAfterFirstLetter: /[\w@]/,

		namedIdentRules: {
			precedes: [
				[{ token: "operator", values: [":"] }]
			]
		},
		
		contextItems: {
		},

		operators: [
			"<-", "<", 
			"||",
			"=:=", "=/=", "==", "=<", "=",
			"*",
			"<<", ",",
			">=", ">>", ">", 
			":",
			"#",
			"!",
			"++", "+",
			"--", "-",
			"/=", "/"
			
		]
	});
}(this["Sunlight"]));