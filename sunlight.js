(function(window, undefined){

	if (window["console"] === undefined) {
		window.console = { log: function(text) { } };
	}
	
	//http://javascript.crockford.com/prototypal.html
	var create = function(o) {
        function F() {}
        F.prototype = o;
        return new F();
    }
	
	//array.contains()
	var contains = function(arr, value) {
		for (var i = 0; i < arr.length; i++) {
			if (arr[i] === value) {
				return true;
			}
		}
		
		return false;
	};
	
	//recursively merges one object into the other
	var merge = function(defaultObject, objectToMerge) {
		if (!objectToMerge) {
			return defaultObject;
		}
		
		for (var key in objectToMerge) {
			if (defaultObject[key] !== undefined && typeof(objectToMerge[key]) === "object") {
				defaultObject[key] = merge(defaultObject[key], objectToMerge[key]);
			} else {
				defaultObject[key] = objectToMerge[key];
			}
		}
		
		return defaultObject;
	};
	
	//http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript/3561711#3561711
	var regexEscape = function(s) {
		return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")
	};
	
	var regexHelpers = {
		punctuation: /[^\w\s]/,
		wordBoundaryString: "[\\W\\s]"
	};

	var createProceduralRule = function(startIndex, direction, tokenRequirements) {
		return function(tokens) {
			var tokenIndexStart = startIndex;
			if (direction === 1) {
				tokenRequirements.reverse();
			}
			
			for (var j = 0, expected, actual; j < tokenRequirements.length; j++) {
				actual = tokens[tokenIndexStart + (j * direction)];
				expected = tokenRequirements[tokenRequirements.length - 1 - j];
				
				if (actual === undefined) {
					if (expected["optional"] !== undefined && expected.optional) {
						tokenIndexStart -= direction;
					} else {
						return false;
					}
				} else if (actual.name === expected.token && (expected["values"] === undefined || contains(expected.values, actual.value))) {
					//derp
					continue;
				} else if (expected["optional"] !== undefined && expected.optional) {
					tokenIndexStart -= direction; //we need to reevaluate against this token again
				} else {
					return false;
				}
			}
			
			return true;
		};
	};
	
	var createBetweenRule = function(startIndex, opener, closer) {
		return function(tokens) {
			var index = startIndex, token;
			var success = false;
			
			//check to the left: if we run into a closer or never run into an opener, fail
			while ((token = tokens[--index]) !== undefined) {
				if (token.name === closer.token && contains(closer.values, token.value)) {
					if (token.name === opener.token && contains(opener.values, token.value)) {
						//if the closer is the same as the opener that's okay
						success = true;
						break;
					}
					
					return false;
				}
				
				if (token.name === opener.token && contains(opener.values, token.value)) {
					success = true;
					break;
				}
			}
			
			if (!success) {
				return false;
			}
			
			//check to the right for the closer
			index = startIndex;
			while ((token = tokens[++index]) !== undefined) {
				if (token.name === opener.token && contains(opener.values, token.value)) {
					if (token.name === closer.token && contains(closer.values, token.value)) {
						//if the closer is the same as the opener that's okay
						success = true;
						break;
					}
					
					return false;
				}
				
				if (token.name === closer.token && contains(closer.values, token.value)) {
					success = true;
					break;
				}
			}
		
			return success;
		};
	};
	
	var defaultAnalyzer = {
		enterKeyword:        function(context) { context.append("<span class=\"sunlight-keyword\">"); },
		exitKeyword:         function(context) { context.append("</span>"); },
		enterOperator:       function(context) { context.append("<span class=\"\sunlight-operator\">"); },
		exitOperator:        function(context) { context.append("</span>"); },
		enterString:         function(context) { context.append("<span class=\"sunlight-string\">"); },
		exitString:          function(context) { context.append("</span>"); },
		enterPunctuation:    function(context) { context.append("<span class=\"sunlight-punctuation\">"); },
		exitPunctuation:     function(context) { context.append("</span>"); },
		enterNumber:         function(context) { context.append("<span class=\"sunlight-number\">"); },
		exitNumber:          function(context) { context.append("</span>"); },
		enterComment:        function(context) { context.append("<span class=\"sunlight-comment\">"); },
		exitComment:         function(context) { context.append("</span>"); },
		
		enterIdent:          function(context) {
			var i, data;
			
			var iterate = function(rules, createRule) {
				rules = rules || [];
				
				for (var i = 0, ruleData; i < rules.length; i++) {
					ruleData = rules[i];
					if (typeof(ruleData) === "function") {
						return ruleData(context) && (context.append("<span class=\"sunlight-named-ident\">") || true);
					}
					
					if (createRule && createRule(ruleData)(context.tokens)) {
						context.append("<span class=\"sunlight-named-ident\">")
						return true;
					}
				}
				
				return false;
			};
			
			return iterate(context.language.namedIdentRules.custom)
				|| iterate(context.language.namedIdentRules.follows, function(ruleData) { return createProceduralRule(context.index - 1, -1, ruleData.slice(0)); })
				|| iterate(context.language.namedIdentRules.precedes, function(ruleData) { return createProceduralRule(context.index + 1, 1, ruleData.slice(0)); })
				|| iterate(context.language.namedIdentRules.between, function(ruleData) { return createBetweenRule(context.index, ruleData.opener, ruleData.closer); })
				|| context.append("<span class=\"sunlight-ident\">");
		},
		
		exitIdent:         function(context) { context.append("</span>"); },
		
		enterDefault:      function(context) { },
		exitDefault:       function(context) { },
		
		writeCurrentToken: function(context) { context.appendAndEncode(context.tokens[context.index].value); }
	};
	
	//registered languages
	var languages = { };
	
	var createCodeReader = function(text) {
		text = text.replace("\r\n", "\n").replace("\r", "\n"); //normalize line endings to unix
		var index = 0;
		var line = 1;
		var column = 1;
		var length = text.length;
		var EOF = undefined;
		var currentChar = length > 0 ? text[0] : EOF;
		var nextReadBeginsLine = false;
		
		var getCharacters = function(count) {
			if (count === 0) {
				return "";
			}
			
			count = count || 1;
			
			var value = "";
			var num = 1;
			while (num <= count && text[index + num] !== EOF) {
				value += text[index + num++];
			}
			
			return value === "" ? EOF : value;
		};
		
		return {
			peek: function(count) {
				return getCharacters(count);
			},
			
			read: function(count) {
				var value = getCharacters(count);
				
				if (value !== EOF) {
					//advance index
					index += value.length;
					column += value.length;
					
					//update line count
					if (nextReadBeginsLine) {
						line++;
						column = 1;
						nextReadBeginsLine = false;
					}
					
					var newlineCount = value.substring(0, value.length - 1).replace(/[^\n]/g, "").length;
					if (newlineCount > 0) {
						line += newlineCount;
						column = 1;
					}
					
					if (value[value.length - 1] === "\n") {
						nextReadBeginsLine = true;
					}
					
					currentChar = value[value.length - 1];
				} else {
					index = length;
					currentChar = EOF;
				}
				
				return value;
			},
			
			getLine: function() { return line; },
			getColumn: function() { return column; },
			isEof: function() { return index >= length; },
			EOF: EOF,
			current: function() { return currentChar; }
		};
	};
	
	var parser = function() {
		var parseNextToken = function(context) {
			//helpers
			var matchWord = function(wordMap, name, boundary) {
				var current = context.reader.current();
				for (var i = 0, word; i < wordMap.length; i++) {
					word = wordMap[i];
					if (word[0] === current) {
						var peek = current + context.reader.peek(word.length);
						if (word === peek || new RegExp(regexEscape(word) + boundary).test(peek)) {
							var readChars = context.reader.read(word.length - 1); //read to the end of the word (we already read the first letter)
							return context.createToken(name, word, context.reader.getLine());
						}
					}
				}
				
				return null;
			};
		
			var isIdentMatch = function() {
				return context.language.identFirstLetter.test(context.reader.current());
			};
		
			//token parsing functions
			var parseKeyword = function() {
				return matchWord(context.language.keywords, "keyword", "\\b");
			};
			
			var parseCustomTokens = function() {
				if (context.language.customTokens === undefined) {
					return null;
				}
				
				for (var tokenName in context.language.customTokens) {
					var token = matchWord(context.language.customTokens[tokenName], tokenName, "\\b");
					if (token !== null) {
						return token;
					}
				}
				
				return null;
			};
			
			var parseOperator = function() {
				return matchWord(context.language.operators, "operator", "");
			};
			
			var parsePunctuation = function() {
				var current = context.reader.current();
				if (regexHelpers.punctuation.test(regexEscape(current))) {
					return context.createToken("punctuation", current, context.reader.getLine());
				}
				
				return null;
			};
			
			var parseIdent = function(isNamed) {
				if (!isIdentMatch()) {
					return null;
				}
				
				var ident = context.reader.current();
				var peek = context.reader.peek();
				while (peek !== context.reader.EOF) {
					if (!context.language.identAfterFirstLetter.test(peek)) {
						break;
					}
					
					ident += context.reader.read();
					peek = context.reader.peek();
				}
				
				return context.createToken(isNamed ? "namedIdent" : "ident", ident, context.reader.getLine());
			};
			
			var parseDefault = function() {
				if (context.defaultData.text === "") {
					//new default token
					context.defaultData.line = context.reader.getLine();
					context.defaultData.column = context.reader.getColumn();
				}
				
				context.defaultData.text += context.reader.current();
				return null;
			};
			
			var parseScopes = function() {
				var current = context.reader.current();
				
				for (var tokenName in context.language.scopes) {
					var specificScopes = context.language.scopes[tokenName];
					for (var j = 0, opener, closer, match, zeroWidth, closerLength, escapeSequences; j < specificScopes.length; j++) {
						opener = specificScopes[j][0];
						closer = specificScopes[j][1];
						escapeSequences = specificScopes[j][2] || [];
						zeroWidth = specificScopes[j][3] || false;
						
						closerLength = closer.length;
						closer = typeof(closer) === "string" ? new RegExp(regexEscape(closer)) : closer.regex;
						
						if (opener !== current + context.reader.peek(opener.length - 1)) {
							continue;
						}
						
						var buffer = opener;
						var line = context.reader.getLine();
						var column = context.reader.getColumn();
						
						context.reader.read(opener.length - 1);
						
						//read the scope contents until the closer is found
						outerLoop: while (!context.reader.isEof()) {
							//check for escape sequences
							for (var k = 0; k < escapeSequences.length; k++) {
								if (context.reader.peek(escapeSequences[k].length) === escapeSequences[k]) {
									
									buffer += context.reader.read(escapeSequences[k].length);
									continue outerLoop;
								}
							}
							
							if (closer.test(context.reader.peek(closerLength))) {
								break;
							}
							
							buffer += context.reader.read();
						}
						
						buffer += (zeroWidth ? "" : context.reader.read(closerLength));
						return context.createToken(tokenName, buffer, line, column);
					}
				}
				
				return null;
			};
			
			var parseNumber = function() {
				var current = context.reader.current();
				var number;
				
				if (!/\d/.test(current)) {
					//is it a decimal followed by a number?
					if (current !== "." || !/d/.test(context.reader.peek())) {
						return null;
					}
					
					//decimal without leading zero
					number = current + context.reader.read();
				} else {
					number = current;
					//is it a decimal?
					if (context.reader.peek() === ".") {
						number += context.reader.read();
					}
				}
				
				//easy way out: read until it's not a number or letter
				//this will work for hex (0xef), octal (012), decimal and scientific notation (1e3)
				//anything else and you're on your own
				
				var peek = context.reader.peek();
				while (peek !== context.reader.EOF) {
					if (!/[A-Za-z0-9]/.test(peek)) {
						break;
					}
					
					number += context.reader.read();
					peek = context.reader.peek();
				}
				
				return context.createToken("number", number, context.reader.getLine());
			};
			
			var parseCustomRules = function() {
				var customRules = context.language.customParseRules;
				if (customRules === undefined) {
					return null;
				}
				
				for (var i = 0, token; i < customRules.length; i++) {
					token = customRules[i](context);
					if (token !== null) {
						return token;
					}
				}
				
				return null;
			};
			
			return parseCustomRules()
				|| parseKeyword()
				|| parseCustomTokens()
				|| parseScopes()
				|| parseIdent()
				|| parseNumber()
				|| parseOperator()
				|| parsePunctuation()
				|| parseDefault();
		};
		
		var tokenize = function(unhighlightedCode, language) {
			var context = function() {
				return {
					reader: createCodeReader(unhighlightedCode), 
					language: language,
					defaultData: {
						text: "",
						line: 1,
						column: 1
					},
					createToken: function(name, value, line, column) {
						return {
							name: name,
							line: line,
							value: value,
							column: column
						};
					}
				};
			}();
			
			var tokens = [];
			while (!context.reader.isEof()) {
				var token = parseNextToken(context);
				
				//flush default data if needed (in pretty much all languages this is whitespace)
				if (token !== null) {
					if (context.defaultData.text !== "") {
						tokens.push(context.createToken("default", context.defaultData.text, context.defaultData.line, context.defaultData.column)); 
						context.defaultData.text = "";
					}
				
					tokens.push(token);
				}
				
				context.reader.read();
			}
			
			return tokens;
		};
		
		return {
			highlight: function(unhighlightedCode, languageId) {
				var language = languages[languageId];
				if (language === undefined) {
					throw "Unregistered language: " + languageId;
				}
			
				var self = this;
				var analyzerContext = function() {
					var buffer = "";
					
					//based on http://phpjs.org/functions/htmlentities:425
					var encode = function() {
						var charMap = [
							["&", "&amp;"],
							["'", "&#039;"],
							["<", "&lt;"],
							[">", "&gt;"],
							["\t", new Array(self.options.tabWidth).join("&#160;")],
							[" ", "&#160;"]
						];
						
						return function(text) {
							var encodedText = text;
							for (var i = 0; i < charMap.length; i++) {
								encodedText = encodedText.split(charMap[i][0]).join(charMap[i][1]);
							}
							
							return encodedText;
						};
					}();
		
					return {
						tokens: tokenize(unhighlightedCode, language),
						index: 0,
						language: language,
						append: function(text) { buffer += text; },
						appendAndEncode: function(text) { buffer += encode(text); },
						getHtml: function() { return buffer; }
					};
				}();
				
				var analyzer = language.analyzer || self.options.analyzer;
				var map = merge(self.options.tokenAnalyzerMap, language.tokenAnalyzerMap);
				for (var i = 0; i < analyzerContext.tokens.length; i++) {
					analyzerContext.index = i;
					
					//enter
					analyzer[map[analyzerContext.tokens[i].name][0]](analyzerContext);
					
					//write token value
					analyzer.writeCurrentToken(analyzerContext);
					
					//exit
					analyzer[map[analyzerContext.tokens[i].name][1]](analyzerContext);
				}
				
				return analyzerContext.getHtml();
			}
		};
	}();
	
	var parserConstructor = function() {
		var defaults = {
			analyzer: create(defaultAnalyzer),
			tabWidth: 4,
			tokenAnalyzerMap: {
				keyword: ["enterKeyword", "exitKeyword"],
				operator: ["enterOperator", "exitOperator"],
				string: ["enterString", "exitString"],
				comment: ["enterComment", "exitComment"],
				ident: ["enterIdent", "exitIdent"],
				punctuation: ["enterPunctuation", "exitPunctuation"],
				number: ["enterNumber", "exitNumber"],
				"default": ["enterDefault", "exitDefault"],
			}
		};
		
		return function(options) {
			var merged = defaults;
			if (options) {
				merged = merge(temp, options);
			}
			
			this.options = merged;
		};
	}();
	
	parserConstructor.prototype = parser;
	
	window.Sunlight = {
		version: "1.0",
		Highlighter: parserConstructor,
		createAnalyzer: function() { return create(defaultAnalyzer); },
		isRegistered: function(languageId) { return languages[languageId] !== undefined; },
		defaultEscapeSequences: ["\\n", "\\t", "\\r", "\\\\", "\\v", "\\f"],
		
		highlightAll: function(options) { 
			var parser = new parserConstructor(options);
			var tags = document.getElementsByTagName("*");
			for (var i = 0, match, languageId; i < tags.length; i++) {
				if ((match = tags[i].className.match(/\s*sunlight-highlight-(\S+)\s*/)) !== null) {
					languageId = match[1];
					if (tags[i].firstChild !== null) {
						tags[i].innerHTML = parser.highlight(tags[i].firstChild.nodeValue, languageId);
					}
				}
			}
		},
		
		registerLanguage: function(languageIds, languageData) {
			if (languageIds.length === 0) {
				throw "Languages must be registered with at least one identifier, e.g. \"php\" for PHP";
			}
			
			for (var i = 0; i < languageIds.length; i++) {
				languages[languageIds[i]] = languageData;
			}
		}
	};

}(window));