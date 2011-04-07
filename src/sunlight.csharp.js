(function(sunlight, undefined){

	if (sunlight === undefined || sunlight["registerLanguage"] === undefined) {
		throw "Include sunlight.js before including language files";
	}

	var primitives = ["int", "bool", "double", "float", "char", "byte", "sbyte", "uint", "long", "ulong", "char", "decimal", "short", "ushort"];
	//things that are allowed inside a generic type definition
	var acceptableKeywords = primitives.concat(["in", "out", "string", "object"]);
	
	sunlight.registerLanguage("csharp", {
		keywords: primitives.concat([
			//this is also contextual (must be first thing in the file or something), but it's never used so i don't really care
			"extern alias",
			
			//class qualifiers
			"public", "private", "protected", "internal", "static", "sealed", "abstract", "partial",

			//method qualifiers
			"virtual", "override", "new", "implicit", "explicit", "extern", "override", "operator",

			//member qualifiers
			"const", "readonly", "volatile",

			//types
			"class", "interface", "enum", "struct", "event", "delegate",

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
				//get, set and value are handled by customParseRules below

				//linq
				"from", "select", "where", "groupby", "orderby"
		]),
		
		customParseRules: [
			//xml doc comments
			function(context) {
				if (context.reader.current() !== "/" || context.reader.peek(2) !== "//") {
					return null;
				}
				
				var metaName = "xmlDocCommentMeta"; //tags and the "///" starting token
				var contentName = "xmlDocCommentContent"; //actual comments (words and stuff)
				var tokens = [context.createToken(metaName, "///", context.reader.getLine(), context.reader.getColumn())];
				var peek, current = { line: 0, column: 0, value: "", name: null };
				context.reader.read(2);
				
				while ((peek = context.reader.peek()) !== context.reader.EOF) {
					if (peek === "<" && current.name !== metaName) {
						//push the current token
						if (current.value !== "") {
							tokens.push(context.createToken(current.name, current.value, current.line, current.column));
						}
						
						//amd create a token for the tag
						current.line = context.reader.getLine();
						current.column = context.reader.getColumn();
						current.name = metaName;
						current.value = context.reader.read();
						continue;
					}
					
					if (peek === ">" && current.name === metaName) {
						//close the tag
						current.value += context.reader.read();
						tokens.push(context.createToken(current.name, current.value, current.line, current.column));
						current.name = null;
						current.value = "";
						continue;
					}
					
					if (peek === "\n") {
						break;
					}
					
					if (current.name === null) {
						current.name = contentName;
						current.line = context.reader.getLine();
						current.column = context.reader.getColumn();
					}
					
					current.value += context.reader.read();
				}
				
				if (current.name === contentName) {
					tokens.push(context.createToken(current.name, current.value, current.line, current.column));
				}
				
				return tokens.length > 0 ? tokens : null;
			},
			
			//get/set contextual keyword
			function(context) {
				if (!/^(get|set)\b/.test(context.reader.current() + context.reader.peek(3))) {
					return null;
				}
				
				var rule = sunlight.util.createProceduralRule(context.count() - 1, -1, [
					{ token: "punctuation", values: ["}", "{"] },
					sunlight.util.whitespace,
					{ token: "keyword", values: ["public", "private", "protected", "internal"], optional: true }
				]);
				
				if (!rule(context.getAllTokens())) {
					return null;
				}
				
				//now we need to look ahead and verify that the next non-sunlight.util.whitespace token is "{"
				var count = "get".length, peek = context.reader.peek(count), current, allGoodYo = false;
				while (peek.length === count) {
					if (!/\s$/.test(peek)) {
						if (peek.charAt(peek.length - 1) !== "{") {
							return null;
						}
						
						allGoodYo = true;
						break;
					}
					
					peek = context.reader.peek(++count);
				}
				
				if (!allGoodYo) {
					return null;
				}
				
				var line = context.reader.getLine();
				var column = context.reader.getColumn();
				var value = context.reader.current() + context.reader.read(2); //we already read the first letter
				return context.createToken("keyword", value, line, column);
			},
			
			//value contextual keyword
			function(context) {
				if (!/^value\b/.test(context.reader.current() + context.reader.peek(5))) {
					return null;
				}
			
				//comes after "set" but not after the closing "}" (we'll have to count them to make sure scoping is correct)
				//can't be on the left side of an assignment
				
				//first check equals because that's easy
				var count = "value".length, peek = context.reader.peek(count), current, allGoodYo;
				while (peek.length === count) {
					if (!/\s$/.test(peek)) {
						var peekPlus1 = context.reader.peek(count + 1);
						if (peek.charAt(peek.length - 1) === "=" && peekPlus1.charAt(peekPlus1.length - 1) !== "=") {
							//"value" is on the left side of an assignment, so this is not the droid we're looking for
							return null;
						}
						
						allGoodYo = true;
						break;
					}
					
					peek = context.reader.peek(++count);
				}
				
				if (!allGoodYo) {
					//EOF FTL
					return null;
				}
				
				//now go backward until we run into a "set" keyword, keeping track of all brackets along the way
				var token, index = context.count() -1;
				var bracketCount = [0, 0]; //open, close
				tokenLoop: while ((token = context.token(index--)) !== undefined) {
					if (token.name === "punctuation") {
						if (token.value === "{") {
							bracketCount[0]++;
						} else if (token.value === "}") {
							bracketCount[1]++;
						}
					} else if (token.name === "keyword") {
						switch (token.value) {
							case "set":
								//yay!
								break tokenLoop;
							case "class":
							case "public":
							case "private":
							case "protected":
							case "internal":
								//easiest way to detect we're out of scope so we can stop looking
								return null;
						}
					}
				}
				
				if (token === undefined) {
					//EOF FTL
					return null;
				}
				
				//examine the bracket count and make sure we're in the correct scope
				if (bracketCount[1] >= bracketCount[0]) {
					//nope
					return null;
				}
				
				var line = context.reader.getLine();
				var column = context.reader.getColumn();
				context.reader.read(4); //already read the "v" in "value"
				
				return context.createToken("keyword", "value", line, column);
			}
		],
		
		scopes: {
			string: [ ["\"", "\"", sunlight.util.escapeSequences.concat(["\\\""])], ["@\"", "\"", ["\"\""]], ["'", "'", ["\'", "\\\\"]] ],
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
					
					return true;
				},
				
				//generic definitions/params between "<" and ">"
				function(context) {
					//between < and > and preceded by an ident and not preceded by "class"
					var index = context.index, token;
					
					//look for "<" preceded by an ident but not "class"
					var foundGenericOpener = false, foundIdent = false;
					while ((token = context.tokens[--index]) !== undefined) {
						if (token.name === "keyword" && token.value === "class") {
							//this must be a generic class type definition, e.g. Foo<T>, and we don't want to color the "T"
							return false;
						}
						
						if (
							(token.name === "keyword" && sunlight.util.contains(acceptableKeywords, token.value))
							|| (token.name === "operator" && (token.value === ">" || token.value === ">>"))
							|| token.name === "default"
							|| (token.name === "punctuation" && token.value === ",")
						) {
							continue;
						}
						
						if (token.name === "operator" && (token.value === "<" || token.value === "<<")) {
							foundGenericOpener = true;
							continue;
						}
						
						if (token.name === "ident") {
							foundIdent = true;
							continue;
						}
						
						//anything else means we're no longer in a generic definition
						break;
					}
					
					if (!foundGenericOpener || !foundIdent) {
						return false;
					}
					
					//now look forward to make sure the generic definition is closed
					//this avoids false positives like "foo < bar"
					index = context.index;
					while ((token = context.tokens[++index]) !== undefined) {
						if (token.name === "operator" && (token.value === ">" || token.value === ">>")) {
							return true;
						}
						
						if (
							(token.name === "keyword" && sunlight.util.contains(acceptableKeywords, token.value))
							|| (token.name === "operator" && sunlight.util.contains(["<", "<<", ">", ">>"], token.value))
							|| (token.name === "punctuation" && token.value === ",")
							|| token.name === "ident"
							|| token.name === "default"
						) {
							continue;
						}
						
						return false;
					}
					
					return false;
				},
				
				//generic declarations and return values (generic preceding an ident)
				function(context) {
					//this finds "Foo" in "Foo<Bar> foo"
					
					//if it's preceded by an ident or a primitive/alias keyword then it's no good (i.e. a generic method definition like "public void Foo<T>")
					var token = sunlight.util.getPreviousNonWsToken(context.tokens, context.index);
					if (token !== undefined) {
						if (token.name === "ident" || (token.name === "keyword" && sunlight.util.contains(primitives.concat(["string", "object", "void"]), token.value))) {
							return false;
						}
					}
					
					//need to look ahead and verify that this ident precedes a generic definition, and then non-optional whitespace and then an ident
					
					var index = context.index, bracketCount = [0, 0], token; //open (<), close (>)
					while ((token = context.tokens[++index]) !== undefined) {
						if (token.name === "operator") {
							switch (token.value) {
								case "<":
									bracketCount[0]++;
									break;
								case "<<":
									bracketCount[0] += 2;
									break;
								case ">":
									bracketCount[1]++;
									break;
								case ">>":
									bracketCount[1] += 2;
									break;
								default:
									return false;
							}
							
							//if bracket counts match, get the f out
							if (bracketCount[0] === bracketCount[1]) {
								break;
							}
							
							continue;
						}
						
						if (
							token.name === "default"
							|| token.name === "ident"
							|| (token.name === "keyword" && sunlight.util.contains(acceptableKeywords, token.value))
							|| (token.name === "punctuation" && token.value === ",")
						) {
							continue;
						}
						
						return false;
					}
					
					//verify bracket count
					if (bracketCount[0] !== bracketCount[1]) {
						//mismatched generics, could be something scary
						return false;
					}
					
					//next token should be optional whitespace followed by an ident
					token = context.tokens[++index];
					if (token === undefined && token.name !== "default" && token.name !== "ident") {
						console.log(token);
						return false;
					}
					
					if (token.name === "default") {
						token = context.tokens[++index];
						if (token === undefined || token.name !== "ident") {
							return false;
						}
					}
					
					return true;
				},
				
				//using aliases, e.g. "Foo" in "using Foo = System.Linq.Enumerable;"
				function(context) {
					//previous non-ws token must be "using" and next non-ws token must be "="
					var prevToken = sunlight.util.getPreviousNonWsToken(context.tokens, context.index);
					if (prevToken === undefined || prevToken.name !== "keyword" || prevToken.value !== "using") {
						return false;
					}
					
					var nextToken = sunlight.util.getNextNonWsToken(context.tokens, context.index);
					if (nextToken === undefined || nextToken.name !== "operator" || nextToken.value !== "=") {
						return false;
					}
					
					return true;
				},
				
				//attributes (friggin' attributes...)
				function(context) {
					//if the next token is an equals sign, this is a named parameter (or something else not inside of an attribute)
					var token = sunlight.util.getNextNonWsToken(context.tokens, context.index);
					if (token !== undefined && token.name === "operator" && token.value === "=") {
						return false;
					}
					
					//this is annoyingly complicated
					//we need to verify that we're between [], but not in something like "new string[foo]" for instance
					
					//first, verify that we're inside an opening bracket
					var index = context.index, bracketCount = [0, 0], foundComma = false;
					while ((token = context.tokens[--index]) !== undefined) {
						if (token.name === "punctuation") {
							if (token.value === "[") {
								bracketCount[0]++;
								continue;
							}
							
							if (token.value === "]") {
								bracketCount[1]++;
								continue;
							}
							
							if (token.value === ",") {
								foundComma = true;
							}
							
							//exit rules
							if (token.value === "{" || token.value === "}" || token.value === ";") {
								break;
							}
						} else if (token.name === "ident" && bracketCount[1] === 0 && !foundComma) {
							//prevents false positives like "new Integer[initialArrayLength]" but not things like "[FirstAttribute, SecondAttribute]"
							return false;
						}
					}
					
					if (bracketCount[0] === 0 || bracketCount[0] === bracketCount[1]) {
						//if no brackets were found OR...
						//all the found brackets are closed, so this ident is actually outside of the brackets
						//duh.
						return false;
					}
					
					//next, verify we're inside a closing bracket
					index = context.index;
					var indexOfLastBracket = -1;
					while ((token = context.tokens[++index]) !== undefined) {
						if (token.name === "punctuation") {
							if (token.value === "[") {
								bracketCount[0]++;
								continue;
							}
							if (token.value === "]") {
								indexOfLastBracket = index;
								bracketCount[1]++;
								continue;
							}
							
							//some early exit rules
							if (token.value === "{" || token.value === "}" || token.value === ";") {
								break;
							}
						}
					}
					
					if (indexOfLastBracket < 0 || bracketCount[0] !== bracketCount[1]) {
						return false;
					}
					
					//next token after the last closing bracket should be either a keyword or an ident
					token = sunlight.util.getNextNonWsToken(context.tokens, indexOfLastBracket);
					if (token !== undefined && (token.name === "keyword" || token.name === "ident")) {
						return true;
					}
					
					return false;
				}
			],
			
			follows: [
				//method/property return values
				//special method parameters
				//new: public new Foo Method() { } and new Foo();
				//class/interface/event/struct/delegate names
				[{ token: "keyword", values: ["class", "interface", "event", "struct", "enum", "delegate", "public", "private", "protected", "internal", "static", "virtual", "sealed", "new", "params"] }, sunlight.util.whitespace],

				//typeof/default
				[{ token: "keyword", values: ["typeof", "default"] }, sunlight.util.whitespace, { token: "punctuation", values: ["("] }, sunlight.util.whitespace ],
				
				//casting using "as"
				[{ token: "keyword", values: ["as"] }, sunlight.util.whitespace ]
			],

			precedes: [
				//casting
				[sunlight.util.whitespace, { token: "punctuation", values: [")"] }, sunlight.util.whitespace, { token: "ident" }],
				[sunlight.util.whitespace, { token: "punctuation", values: [")"] }, sunlight.util.whitespace, { token: "keyword", values: ["this"] }],
				
				//arrays
				[sunlight.util.whitespace, { token: "punctuation", values: ["["] }, sunlight.util.whitespace, { token: "punctuation", values: ["]"] }], //in method parameters
				[sunlight.util.whitespace, { token: "punctuation", values: ["["] }, sunlight.util.whitespace, { token: "number" }, sunlight.util.whitespace, { token: "punctuation", values: ["]"] }], //declaration with integer
				[sunlight.util.whitespace, { token: "punctuation", values: ["["] }, sunlight.util.whitespace, { token: "ident" }, sunlight.util.whitespace, { token: "punctuation", values: ["]"] }], //declaration with variable

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
		]
	});
}(window["Sunlight"]));