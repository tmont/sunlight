(function(sunlight, undefined){

	if (sunlight === undefined || sunlight["registerLanguage"] === undefined) {
		throw "Include sunlight.js before including language files";
	}

	sunlight.registerLanguage("vb", {
		//http://msdn.microsoft.com/en-us/library/dd409611.aspx
		keywords: [
			"AddHandler","AddressOf","Alias","AndAlso","And","As","Boolean","ByRef","Byte","ByVal","Call","Case","Catch",
			"CBool","CByte","CChar","CDate","CDbl","CDec","Char","CInt","Class","CLng","CObj","Const","Continue","CSByte",
			"CShort","CSng","CStr","CType","CUInt","CULng","CUShort","Date","Decimal","Declare","Default","Delegate","Dim",
			"DirectCast","Double","Do","Each","ElseIf","Else","EndStatement","EndIf","End","Enum","Erase","Error","Event",
			"Exit","False","Finally","ForEach","For","Friend","Function","GetType","GetXMLNamespace","Get","Global","GoSub",
			"GoTo","Handles","If","Implements","Imports","Inherits","Integer","Interface","In","IsNot","Is","Let","Lib",
			"Like","Long","Loop","Me","Module","Mod","MustInherit","MustOverride","MyBase","MyClass","Namespace","Narrowing",
			"New","Next","Nothing","NotInheritable","NotOverridable","Not","Object","Of","On","Operator","Option","Optional",
			"OrElse","Or","Out","Overloads","Overridable","Overrides","ParamArray","Partial","Private","Property","Protected",
			"Public","RaiseEvent","ReadOnly","ReDim","RemoveHandler","Resume","Return","SByte","Select","Set","Shadows",
			"Shared","Short","Single","Static","Step","Stop","String","Structure","Sub","SyncLock","Then","Throw","To","True",
			"TryCast","Try","TypeOf","UInteger","ULong","UShort","Using","Variant","Wend","When","While","Widening",
			"WithEvents","With","WriteOnly","Xor"
		],
		
		customTokens: {
			reservedWord: {
				values: [
					"Aggregate","Ansi","Assembly","Auto","Binary","Compare","Custom","Distinct","Equals","Explicit","From","Group By","Group Join",
					"Into","IsFalse","IsTrue","Join","Key","Mid","Off","Order By","Preserve","Skip","Skip While","Strict","Take While","Take","Text",
					"Unicode","Until","Where"
				],
				boundary: "\\b"
			}
		},

		scopes: {
			string: [ ["\"", "\"", sunlight.util.escapeSequences.concat(["\\\""])] ],
			comment: [ ["'", "\n", null, true], ["REM", "\n", null, true]  ],
			compilerDirective: [ ["#", "\n", null, true] ]
		},
		
		customParseRules: [
			//handles New/GetType contextual keywords
			//e.g. prevents "New" in "SomeClass.New()" from being a keyword
			function() {
				var hashmap = sunlight.util.createHashMap(["New", "GetType"], "\\b");
				return function(context) {
					var token = sunlight.util.matchWord(context, hashmap, "keyword");
					if (!token) {
						return null;
					}
					
					//if the previous non-ws token is the "." operator then it's an ident, not a keyword
					//or if it's a subprocedure name
					var prevToken = sunlight.util.getPreviousNonWsToken(context.getAllTokens(), context.count());
					if (prevToken && ((prevToken.name === "operator" && prevToken.value === ".") || (prevToken.name === "keyword" && prevToken.value === "Sub"))) {
						token.name = "ident";
					}
					
					return token;
				};
			}()
		],

		identFirstLetter: /[A-Za-z_]/,
		identAfterFirstLetter: /\w/,

		namedIdentRules: {
			custom: [
				//implemented interfaces
				function(context) {
					//if previous non-ws token was a "." then it's an implemented method
					var prevToken = sunlight.util.getPreviousNonWsToken(context.tokens, context.index);
					if (prevToken && prevToken.name === "operator" && prevToken.value === ".") {
						return false;
					}
					
					//look backward for "Implements"
					var token, index = context.index;
					while (token = context.tokens[--index]) {
						if (token.name === "keyword") {
							switch (token.value) {
								case "Class":
								case "New":
									break;
								case "Implements":
									return true;
								default:
									return false;
							}
						} else if (token.name === "default" && token.value.indexOf("\n") >= 0) {
							//apparently they must be on the same line...?
							return false;
						}
					}
					
					return false;
				},
				
				//type constraints: "As {ident, ident, ...}"
				function(context) {
					//look backward for "As {"
					var token, index = context.index;
					var isValid = function() {
						while (token = context.tokens[--index]) {
							if (token.name === "punctuation") {
								switch (token.value) {
									case "(":
									case ")":
										return false;
									case "{":
										//previous non-ws token should be keyword "As"
										token = sunlight.util.getPreviousNonWsToken(context.tokens, index);
										if (!token || token.name !== "keyword" || token.value !== "As") {
											return false;
										}
										
										return true;
								}
							} else if (token.name === "keyword" && sunlight.util.contains(["Public", "Protected", "Friend", "Private", "End"], token.value)) {
								return false;
							}
						}
						
						return false;
					}();
					
					if (!isValid) {
						return false;
					}
					
					//"}" before )
					index = context.index;
					while (token = context.tokens[++index]) {
						if (token.name === "punctuation") {
							switch (token.value) {
								case "}":
									return true;
								case "(":
								case ")":
								case ";":
									return false;
							}
						}
					}
					
					return false;
				}
			],
			
			follows: [
				[{ token: "keyword", values: ["Of", "As", "Class", "Implements", "Inherits", "New", "AddressOf", "Interface", "Structure", "Event", "Module", "Enum"] }, { token: "default" } ]
			],
			
			precedes: [
			],

			between: [
			]
		},
		
		numberParser: function(context) {
			var current = context.reader.current(), number, line = context.reader.getLine(), column = context.reader.getColumn();

			var allowDecimal = true, peek;
			if (current === "&" && /[Hh][A-Fa-f0-9]/.test(context.reader.peek(2))) {
				number = current + context.reader.read(2);
				allowDecimal = false;
			} else if (/\d/.test(current)) {
				number = current;
			} else {
				//is it a decimal followed by a number?
				if (current !== "." || !/\d/.test(context.reader.peek())) {
					return null;
				}

				//decimal without leading zero
				number = current + context.reader.read();
				allowDecimal = false;
			}

			var peek;
			while ((peek = context.reader.peek()) !== context.reader.EOF) {
				if (!/[A-Za-z0-9]/.test(peek)) {
					if (peek === "." && allowDecimal && /\d$/.test(context.reader.peek(2))) {
						number += context.reader.read();
						allowDecimal = false;
						continue;
					}
					
					break;
				}

				number += context.reader.read();
			}

			return context.createToken("number", number, line, column);
		},
		
		operators: [
			".",
			"=",
			"&=",
			"&",
			"*=",
			"*",
			"/=",
			"/",
			"\\=",
			"\\",
			"^=",
			"^",
			"+=",
			"+",
			"-=",
			"-",
			">>=",
			">>",
			"<<=",
			"<<",
		]
	});
}(window["Sunlight"]));