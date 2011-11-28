(function(sunlight, undefined){

	if (sunlight === undefined || sunlight["registerLanguage"] === undefined) {
		throw "Include sunlight.js before including language files";
	}
	
	function peekSelectorToken(context) {
		//make sure it's not part of a property value
		//basically if we run into "{" before "}" it's bad
		var token, 
			index = context.count(), 
			value = "",
			letter,
			appendToValue = true,
			count = 1,
			peek;
			
		while ((token = context.token(--index)) !== undefined) {
			if (token.name === "punctuation" && token.value === "}") {
				break;
			} else if (token.name === "punctuation" && token.value === "{") {
				return null;
			}
		}
		
		//now check to make sure we run into a { before a ;
		
		peek = context.reader.peek();
		while (peek.length === count) {
			letter = peek.charAt(peek.length - 1);
			if (/[^\w-]$/.test(peek)) {
				appendToValue = false;
				
				if (letter === "{") {
					break;
				}
				
				if (letter === ";") {
					return null;
				}
			}
			
			if (appendToValue) {
				value += letter;
			}
			
			peek = context.reader.peek(++count);
		}
		
		return value;
	}

	sunlight.registerLanguage("less", {
		caseInsensitive: true,

		customParseRules: [
			//unquoted values inside a function call
			function(context) {
				var line, column, value, prevToken;
				if (context.reader.current() === ")") {
					return null;
				}

				prevToken = sunlight.util.getPreviousWhile(context.getAllTokens(), context.count(), function(token) {
					return token.name === "default" || token.name === "comment";
				});

				if (!prevToken || prevToken.token.name !== "punctuation" || prevToken.token.value !== "(") {
					return null;
				}

				prevToken = sunlight.util.getPreviousWhile(context.getAllTokens(), prevToken.index, function(token) {
					return token.name === "default" || token.name === "comment";
				});

				if (!prevToken || prevToken.token.name !== "function" || prevToken.token.value.toLowerCase() !== "url") {
					return null;
				}

				line = context.reader.getLine();
				column = context.reader.getColumn();
				value = /^[^)]*/.exec(context.reader.substring())[0];
				context.reader.read(value.length - 1);
				return context.createToken("unquoted-function-argument", value, line, column);
			},

			//keywords
			function(context) {
				var line, column, value, prevToken;

				if (!/[-A-Za-z]/.test(context.reader.current())) {
					return null;
				}

				//last token must be a ";" or "{"
				prevToken = sunlight.util.getPreviousWhile(context.getAllTokens(), context.count(), function(token) {
					return token.name === "default" || token.name === "comment";
				});

				if (prevToken && prevToken.token.name === "punctuation" && (prevToken.token.value === ";" || prevToken.token.value == "{")) {
					line = context.reader.getLine();
					column = context.reader.getColumn();
					value = /^[A-Za-z-]+/.exec(context.reader.current() + context.reader.peekSubstring())[0];
					context.reader.read(value.length - 1);
					return context.createToken("keyword", value, line, column);
				}

				return null;
			},

			//functions
			function() {
				var functions = sunlight.util.createHashMap([
					"matrix", "translate", "translateX", "translateY", "scaleX", "scaleY", "rotate", "skewX", "skewY", "skew",
					"translate3d", "scaleZ", "translateZ", "rotate3d", "perspective", "url",
					
					//ie filters
					"alpha", "basicimage", "blur", "dropshadow", "engrave", "glow", "light", "maskfilter", "motionblur", "shadow", "wave"
				], "\\b", true);
				
				return function(context) {
					var token = sunlight.util.matchWord(context, functions, "function", true),
						count,
						peek;
					if (token === null) {
						return null;
					}
					
					//the next non-whitespace character must be a "("
					count = token.value.length;
					peek = context.reader.peek(count);
					while (peek.length === count && peek !== context.reader.EOF) {
						if (!/\s$/.test(peek)) {
							if (peek.charAt(peek.length - 1) === "(") {
								//this token really is a function
								context.reader.read(token.value.length - 1);
								return token;
							}
							
							break;
						}
					
						peek = context.reader.peek(++count);
					}
					
					return null;
				};
			}(),
			
			//pseudo classes
			function() {
				var pseudoClasses = sunlight.util.createHashMap([
					//http://www.w3.org/TR/css3-selectors/#selectors
					"root", "nth-child", "nth-last-child", "nth-of-type", "nth-last-of-type", "first-child", "last-child", 
					"first-of-type", "last-of-type", "only-child", "only-of-type", "empty", "link", "visited", "active",
					"hover", "focus", "target", "lang", "enabled", "disabled", "checked", "first-line", "first-letter",
					"before", "after", "not",
					
					//http//www.w3.org/TR/css3-ui/#pseudo-classes
					"read-only", "read-write", "default", "valid", "invalid", "in-range", "out-of-range", "required", "optional"
				], "\\b", true);
				
				return function(context) {
					var previousToken = sunlight.util.getPreviousNonWsToken(context.getAllTokens(), context.count());
					if (!previousToken || previousToken.token.name !== "operator" || previousToken.token.value !== ":") {
						return null;
					}
					
					return sunlight.util.matchWord(context, pseudoClasses, "pseudoClass");
				};
			}(),
			
			//pseudo elements
			function() {
				var pseudoElements = sunlight.util.createHashMap(
					["before", "after", "value", "choices", "repeat-item", "repeat-index", "marker"],
					"\\b",
					true
				);
				
				return function(context) {
					var previousToken = sunlight.util.getPreviousNonWsToken(context.getAllTokens(), context.count());
					if (!previousToken || previousToken.token.name !== "operator" || previousToken.token.value !== "::") {
						return null;
					}
					
					return sunlight.util.matchWord(context, pseudoElements, "pseudoElement");
				};
			}(),
			
			//classes
			function(context) {
				var className,
					line = context.reader.getLine(), 
					column = context.reader.getColumn();
				
				//we can't just make this a scope because we'll get false positives for things like ".png" in url(image.png) (image.png doesn't need to be in quotes)
				//so we detect them the hard way
				
				if (context.reader.current() !== ".") {
					return null;
				}
				
				className = peekSelectorToken(context);
				if (className === null) {
					return null;
				}
				
				context.reader.read(className.length);
				return [
					context.createToken("operator", ".", line, column),
					context.createToken("class", className, line, column + 1)
				];
			},
			
			//element selectors (div, html, body, etc.)
			function(context) {
				var current = context.reader.current(),
					prevToken,
					tagName,
					line = context.reader.getLine(), 
					column = context.reader.getColumn();
				
				if (!/[A-Za-z_]/.test(current)) {
					return null;
				}
				
				prevToken = sunlight.util.getPreviousNonWsToken(context.getAllTokens(), context.count());
				if (prevToken && prevToken.token.name === "operator" && (prevToken.token.value === ":" || prevToken.token.value === "::")) {
					return null;
				}
				
				tagName = peekSelectorToken(context);
				if (tagName === null) {
					return null;
				}
				
				context.reader.read(tagName.length);
				return context.createToken("element", current + tagName, line, column);
			},
			
			//hex color value
			function(context) {
				var peek,
					count = 1,
					value = "#",
					letter,
					validHex = true,
					line = context.reader.getLine(), 
					column = context.reader.getColumn();
				
				if (context.reader.current() !== "#") {
					return null;
				}
				
				//must be between ":" and ";"
				//basically if we run into a "{" before a "} it's bad
				
				peek = context.reader.peek();
				while (peek.length === count) {
					letter = peek.charAt(peek.length - 1);
					if (letter === "}" || letter === ";") {
						break;
					}
					if (letter === "{") {
						return null;
					}
					if (validHex && /[A-Fa-f0-9]/.test(letter)) {
						value += letter;
					} else {
						validHex = false;
					}
					
					peek = context.reader.peek(++count);
				}
				
				context.reader.read(value.length - 1); //-1 because we already read the "#"
				return context.createToken("hexColor", value, line, column);
			}
		],
		
		//same as default, but allows % 
		numberParser: function(context) {
			var current = context.reader.current(), 
				number, 
				line = context.reader.getLine(), 
				column = context.reader.getColumn(),
				allowDecimal = true,
				peek;

			if (!/\d/.test(current)) {
				//is it a decimal followed by a number?
				if (current !== "." || !/\d/.test(context.reader.peek())) {
					return null;
				}

				//decimal without leading zero
				number = current + context.reader.read();
				allowDecimal = false;
			} else {
				number = current;
				if (current === "0" && context.reader.peek() !== ".") {
					//hex or octal
					allowDecimal = false;
				}
			}

			while ((peek = context.reader.peek()) !== context.reader.EOF) {
				if (!/[A-Za-z0-9%]/.test(peek)) {
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
		
		customTokens: {
			rule: {
				values: [
					"@import", "@media", "@font-face", "@phonetic-alphabet", "@hyphenate-resource", "@font-feature-values",
					"@charset", "@namespace", "@page", 
					"@bottom-left-corner", "@bottom-left", "@bottom-center", "@bottom-right", "@bottom-right-corner",
					"@top-left-corner", "@top-left", "@top-center", "@top-right", "@top-right-corner"
				],
				boundary: "\\b"
			},

			microsoftFilterPrefix: {
				values: ["progid:DXImageTransform.Microsoft"],
				boundary: "\\b"
			},
			
			importantFlag: {
				values: ["!important"],
				boundary: "\\b"
			}
		},
		
		scopes: {
			string: [ ["\"", "\"", ["\\\"", "\\\\"]], ["'", "'", ["\\\'", "\\\\"]] ],
			comment: [ ["/*", "*/"] ],
			variable: [ ["@", { length: 1, regex: /[^-\w]/ }, null, true ] ],
			id: [ ["#", { length: 1, regex: /[^-\w]/ }, null, true ] ]
		},
		
		identFirstLetter: /[A-Za-z-]/,
		identAfterFirstLetter: /[\w-]/,

		operators: [
			"::", ":", ">", "+", "~=", "^=", "$=", "|=", "*=", "=", ".", "*"
		]

	});
}(this["Sunlight"]));