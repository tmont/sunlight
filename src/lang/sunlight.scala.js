(function(sunlight, undefined){

	if (sunlight === undefined || sunlight["registerLanguage"] === undefined) {
		throw "Include sunlight.js before including language files";
	}
	
	if (!sunlight.isRegistered("xml")) {
		throw "Scala requires the XML language to be registered";
	}

	sunlight.registerLanguage("scala", {
		keywords: [
			"abstract","case","catch","class","def","do","else","extends","false","final","finally","forSome","for",
			"if","implicit","import","lazy","match","new","null","object","override","package","private","protected",
			"return","sealed","super","this","throw","trait","try","true","type","val","var","while","with","yield"
		],
		
		embeddedLanguages: {
			xml: {
				switchTo: function(context) {
					if (context.reader.current() !== "<" || !/[\w!?]/.test(context.reader.peek())) {
						return false;
					}
					
					if (context.defaultData.text !== "") {
						//preceded by whitespace
						return true;
					}
					
					var prevToken = context.token(context.count() - 1);
					return prevToken && prevToken.name === "punctuation" && sunlight.util.contains(["(", "{"], prevToken.value);
				},
				
				switchBack: function(context) {
					var prevToken = context.token(context.count() - 1);
					if (!prevToken) {
						return false;
					}
					
					if (prevToken.name === "tagName") {
						if (!context.items.literalXmlOpenTag) {
							context.items.literalXmlOpenTag = prevToken.value;
						}
					} else if (prevToken.name === "operator") {
						switch (prevToken.value) {
							case "<":
								context.items.literalXmlNestingLevel++;
								break;
							case "</":
							case "/>":
								context.items.literalXmlNestingLevel--;
								break;
						}
					}
					
					if (context.items.literalXmlOpenTag && context.items.literalXmlNestingLevel === 0 && (prevToken.value === ">" || prevToken.value === "/>")) {
						return true;
					}
					
					return false;
				}
			}
		},
		
		scopes: {
			string: [ ["\"", "\"", ["\\\\", "\\\""]], ["\"\"\"", "\"\"\""] ],
			"char": [ ["'", "'", ["\\\\", "\\'"]] ],
			quotedIdent: [ ["`", "`", ["\\`", "\\\\"]] ],
			comment: [ ["//", "\n", null, true], ["/*", "*/"] ],
			annotation: [ ["@", { length: 1, regex: /[\s\(]/ }, null, true] ]
		},
		
		identFirstLetter: /[A-Za-z]/,
		identAfterFirstLetter: /\w/,
		
		customParseRules: [
			//case classes: can't distinguish between a case class and a function call so we need to keep track of them
			function(context) {
				if (context.defaultData.text === "") {
					return false;
				}
				
				if (!/[A-Za-z]/.test(context.reader.current())) {
					return false;
				}
				
				var matches = sunlight.util.createProceduralRule(context.count() - 1, -1, [{ token: "keyword", values: ["case"] }, { token: "default" }, { token: "keyword", values: ["class"] }])(context.getAllTokens());
				if (!matches) {
					return false;
				}
				
				//this is a case class definition, read the class name
				var peek, className = context.reader.current(), line = context.reader.getLine(), column = context.reader.getColumn();
				while (peek = context.reader.peek()) {
					if (!/\w/.test(peek)) {
						break;
					}
					
					className += context.reader.read();
				}
				
				context.items.caseClasses.push(className);
				
				return context.createToken("ident", className, line, column);
			}
		],

		namedIdentRules: {
			custom: [	
				//user-defined case classes
				function(context) {
					return sunlight.util.contains(context.items.caseClasses, context.tokens[context.index].value);
				}
				
			],
			
			follows: [
				[{ token: "keyword", values: ["class", "object", "extends", "new", "type", "trait"] }, { token: "default" }],
				[{ token: "operator", values: [":"] }, sunlight.util.whitespace],
				[{ token: "operator", values: ["#"] }]
			],
			
			precedes: [
				//[{ token: "punctuation", values: ["["] }, sunlight.util.whitespace]
			]
		},
		
		contextItems: {
			literalXmlOpenTag: null,
			literalXmlNestingLevel: 0,
			caseClasses: []
		},

		operators: [
			"::", "@", "#", ":<", "%>", ":>", "->", "<=", "=", ":", "_"
		]

	});
	
	sunlight.globalOptions.enableScalaXmlInterpolation = false;
	
	sunlight.bind("beforeHighlight", function(context) {
		if (context.language.name === "scala") {
			this.options.enableScalaXmlInterpolation = true;
		}
	});
	sunlight.bind("afterHighlight", function(context) {
		this.options.enableScalaXmlInterpolation = false;
	});
	
}(this["Sunlight"]));