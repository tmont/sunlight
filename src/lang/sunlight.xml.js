(function(sunlight, undefined){

	if (sunlight === undefined || sunlight["registerLanguage"] === undefined) {
		throw "Include sunlight.js before including language files";
	}

	sunlight.registerLanguage("xml", {
		//doNotParse: /(?!x)x/,
		caseInsenstive: true,
		
		scopes: {
			string: [ ["\"", "\""], ["'", "'"] ],
			comment: [ ["<!--", "-->"] ],
			cdata: [ ["<![CDATA[", "]]>"] ],
			doctype: [ ["<!DOCTYPE", ">"] ]
		},
		
		punctuation: /(?!x)x/,
		
		customTokens: {
			xmlOpenTag: { values: ["<?xml"], boundary: "\\b" },
			xmlCloseTag: { values: ["?>"], boundary: "" }
		},
		
		customParseRules: [
			//tag names
			function(context) {
				var current = context.reader.current();
				if (!/[A-Za-z_]/.test(current)) {
					return null;
				}
				
				var prevToken = context.token(context.count() - 1);
				if (prevToken.name !== "operator" || !sunlight.util.contains(["<", "</"], prevToken.value)) {
					return null;
				}
				
				//read the tag name
				var peek, tagName = current, line = context.reader.getLine(), column = context.reader.getColumn();
				while (peek = context.reader.peek()) {
					if (!/[\w-]/.test(peek)) {
						break;
					}
					
					tagName += context.reader.read();
				}
				
				return context.createToken("tagName", tagName, line, column);
			},
			
			//attributes
			function(context) {
				var current = context.reader.current();
				if (!/[A-Za-z_]/.test(current)) {
					return null;
				}
				
				//must be between < and >
				
				//look backward for a tag name
				var token, index = context.count();
				while (token = context.token(--index)) {
					if (token.name === "operator") {
						if (token.value === ">" || token.value === "/>" || token.value === "</") {
							return null;
						}
					}
					
					if (token.name === "tagName" || token.name === "xmlOpenTag") {
						break;
					}
				}
				
				if (!token) {
					return null;
				}
				
				//look forward for >
				var peek = context.reader.peek(), count = 1, attribute;
				while (peek.length === count) {
					if (/<$/.test(peek)) {
						return null;
					}
					
					if (/>$/.test(peek)) {
						var line = context.reader.getLine(), column = context.reader.getColumn();
						attribute = attribute || current + peek.substring(0, peek.length - 1);
						context.reader.read(attribute.length - 1);
						return context.createToken("attribute", attribute, line, column);
					}
					
					if (!attribute && /[=\s:]$/.test(peek)) {
						attribute = current + peek.substring(0, peek.length - 1);
					}
					
					peek = context.reader.peek(++count);
				}
				
				return null;
			},
			
			//entities
			function(context) {
				var current = context.reader.current();
				if (current !== "&") {
					return null;
				}
				
				//find semicolon, or whitespace, or < or >
				var count = 1, peek = context.reader.peek(count);
				var line = context.reader.getLine(), column = context.reader.getColumn();
				while (peek.length === count) {
					if (peek.charAt(peek.length - 1) === ";") {
						return context.createToken("entity", current + context.reader.read(count), line, column);
					}
					
					if (!/[A-Za-z0-9]$/.test(peek)) {
						break;
					}
					
					peek = context.reader.peek(++count);
				}
				
				return null;
			}
		],
		
		embeddedLanguages: {
			scala: {
				switchTo: function(context) {
					if (!context.options.enableScalaXmlInterpolation) {
						return false;
					}
					
					if (context.reader.current() === "{") {
						//context.items.scalaBracketNestingLevel = 1;
						return true;
					}
					
					return false;
				},
				
				switchBack: function(context) {
					var prevToken = context.token(context.count() - 1);
					
					if (prevToken.name === "punctuation") {
						if (prevToken.value === "{") {
							context.items.scalaBracketNestingLevel++;
						} else if (prevToken.value === "}") {
							context.items.scalaBracketNestingLevel--;
							if (context.items.scalaBracketNestingLevel === 0) {
								return true;
							}
						}
					}
					
					return false;
				}
			}
		},
		
		contextItems: {
			scalaBracketNestingLevel: 0
		},

		operators: [
			"=", "/>", "</", "<", ">", ":"
		]

	});
}(this["Sunlight"]));