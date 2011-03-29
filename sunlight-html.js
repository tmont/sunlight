(function(sunlight, undefined){

	if (sunlight === undefined || sunlight["registerLanguage"] === undefined) {
		throw "Include sunlight.js before including language files";
	}

	var whitespace = { token: "default", optional: true };
	
	var htmlAnalyzer = sunlight.createAnalyzer();
	htmlAnalyzer.enterCdata = sunlight.enterAnalysis("cdata");
	htmlAnalyzer.exitCdata = sunlight.exitAnalysis;
	htmlAnalyzer.enterContent = sunlight.enterAnalysis("content");
	htmlAnalyzer.exitContent = sunlight.exitAnalysis;
	htmlAnalyzer.enterDoctype = sunlight.enterAnalysis("doctype");
	htmlAnalyzer.exitDoctype = sunlight.exitAnalysis;
	
	sunlight.registerLanguage(["html"], {
		scopes: {
			string: [ ["\"", "\""], ["'", "'"] ],
			doctype: [ ["<!doctype", ">"], ["<!DOCTYPE", ">"] ],
			comment: [ ["<!--", "-->"] ],
			cdata: [ ["<![CDATA[", "]]>"] ]
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
				
				//read until <
				var value = context.reader.current();
				var line = context.reader.getLine();
				var column = context.reader.getColumn();
				var peek;
				while ((peek = context.reader.peek()) !== context.reader.EOF) {
					if (peek === "<") {
						break;
					}
					
					value += context.reader.read();
				}
				
				return context.createToken("content", value, line, column);
			}
		],
		
		identFirstLetter: /[A-Za-z_]/,
		identAfterFirstLetter: /[\w:-]/, //colon so namespaces work and stuff, e.g. foo:attribute="foo"

		//these are considered attributes
		namedIdentRules: {
			precedes: [
				[whitespace, { token: "operator", values: ["="] }]
			]
		},

		operators: [
			"<?xml", "?>", "=",
			"/>", "</", "<", ">"
		],
		
		tokenAnalyzerMap: {
			cdata: ["enterCdata", "exitCdata"],
			content: ["enterContent", "exitContent"],
			doctype: ["enterDoctype", "exitDoctype"]
		},
		
		analyzer: htmlAnalyzer

	});
}(window["Sunlight"]));