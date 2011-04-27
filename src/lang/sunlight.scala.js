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
					
					//preceded by whitespace
					if (context.defaultData.text !== "") {
						return true;
					}
					
					var prevToken = context.token(context.count() - 1);
					if (!prevToken) {
						return true;
					}
					
					if (prevToken && prevToken.name === "punctuation" && sunlight.util.contains(["(", "{"], prevToken.value)) {
						return true;
					}
					
					return false;
				},
				
				switchBack: function(context) {
					var prevToken = context.token(context.count() - 1);
					if (!prevToken) {
						return false;
					}
					
					if (prevToken.name === "ident") {
						if (!context.items.literalXmlOpenTag) {
							context.items.literalXmlOpenTag = prevToken.value;
						}
					}
					
					switch (prevToken.value) {
						case "<":
							context.items.literalXmlNestingLevel++;
							break;
						case "</":
						case "/>":
							context.items.literalXmlNestingLevel--;
							break;
							
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
			comment: [ ["//", "\n", null, true], ["/*", "*/"] ]
		},
		
		customTokens: {
		},
		
		customParseRules: [
		],
		
		identFirstLetter: /[A-Za-z]/,
		identAfterFirstLetter: /[\w-]/,

		namedIdentRules: {
			follows: [
				[{ token: "keyword", values: ["class"] }, { token: "default" }],
				[{ token: "ident" }, sunlight.util.whitespace, { token: "operator", values: [":"] }, sunlight.util.whitespace],
			]
		},
		
		contextItems: {
			literalXmlOpenTag: null,
			literalXmlNestingLevel: 0
		},

		operators: [
			"@", "#", ":<", "%>", ":>", "->", "<=", "=", ":", "_"
		]

	});
	
	sunlight.globalOptions.enableScalaXmlInterpolation = true;
	
}(this["Sunlight"]));