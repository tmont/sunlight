(function(sunlight, undefined){

	if (sunlight === undefined || sunlight["registerLanguage"] === undefined) {
		throw "Include sunlight.js before including language files";
	}
	
	sunlight.registerLanguage("html", {
		//parse everything
		doNotParse: /(?!x)x/,
		
		scopes: {
			string: [ ["\"", "\""], ["'", "'"] ],
			doctype: [ ["<!doctype", ">"], ["<!DOCTYPE", ">"] ],
			comment: [ ["<!--", "-->"] ],
			cdata: [ ["<![CDATA[", "]]>"] ]
		},
		
		customTokens: {
			xmlOpenTag: { values: ["<?xml"], boundary: "\\b" },
			xmlCloseTag: { values: ["?>"], boundary: "" }
		},
		
		customParseRules: [
			//tag values can't be parsed as anything except an ident, so it must be done manually
			function(context) {
				var current = context.reader.current();
				if (current === ">" || current === "<") {
					//starting or ending a tag
					return null;
				}
				
				var lastToken = context.token(context.count() - 1);
				if (lastToken === undefined) {
					return null;
				}
				
				if (lastToken.name !== "operator" || (lastToken.value !== ">" && lastToken.value !== "/>")) {
					return null;
				}
				
				var getEntity = function() {
					//find semicolon, or whitespace, or < or >
					var count = 2, peek = context.reader.peek(count);
					var line = context.reader.getLine();
					var column = context.reader.getColumn();
					while (peek.length === count) {
						if (peek.charAt(peek.length - 1) === ";") {
							return context.createToken("entity", context.reader.read(count), line, column);
						}
						
						if (!/[A-Za-z0-9]$/.test(peek)) {
							break;
						}
						
						peek = context.reader.peek(++count);
					}
					
					return null;
				};
				
				//read until <
				var value = context.reader.current();
				var line = context.reader.getLine();
				var column = context.reader.getColumn();
				var peek, entity, tokens = [];
				while ((peek = context.reader.peek()) !== context.reader.EOF) {
					if (peek === "<") {
						break;
					}
					
					if (peek === "&" && (entity = getEntity())) {
						//might be an entity
						tokens.push(context.createToken("content", value, line, column));
						tokens.push(entity);
						line = context.reader.getLine();
						column = context.reader.getColumn();
						value = "";
					} else {
						value += context.reader.read();
					}
				}
				
				if (value !== "") {
					tokens.push(context.createToken("content", value, line, column));
				}
				
				return tokens;
			}
		],
		
		identFirstLetter: /[A-Za-z_]/,
		identAfterFirstLetter: /[\w-]/, //include the colon so namespaces work and stuff, e.g. foo:attribute="foo"

		//these are considered attributes
		namedIdentRules: {
			precedes: [
				[sunlight.util.whitespace, { token: "operator", values: ["=", ":"] }]
			]
		},

		operators: [
			"=", "/>", "</", "<", ">", ":"
		]
	});
}(this["Sunlight"]));