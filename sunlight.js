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
	
	//http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript/3561711#3561711
	var regexEscape = function(s) {
		return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")
	};
	
	var regexHelpers = {
		punctuation: /[^\w\s]/,
		wordBoundaryString: "[\\W\\s]"
	};

	var defaultAnalyzer = {
		enterKeyword:     function(context) { context.append("<span class=\"sunlight-keyword\">"); },
		exitKeyword:      function(context) { context.append("</span>"); },
		enterOperator:    function(context) { context.append("<span class=\"\sunlight-operator\">"); },
		exitOperator:     function(context) { context.append("</span>"); },
		enterString:      function(context) { context.append("<span class=\"sunlight-string\">"); },
		exitString:       function(context) { context.append("</span>"); },
		enterPunctuation: function(context) { context.append("<span class=\"sunlight-punctuation\">"); },
		exitPunctuation:  function(context) { context.append("</span>"); },
		enterNumber:      function(context) { context.append("<span class=\"sunlight-number\">"); },
		exitNumber:       function(context) { context.append("</span>"); },
		enterComment:     function(context) { context.append("<span class=\"sunlight-comment\">"); },
		exitComment:      function(context) { context.append("</span>"); },
		
		enterIdent:       function(context) {
			//do the look-ahead analysis to see if this is a named identifier
			context.append("<span class=\"sunlight-ident\">"); 
		},
		
		exitIdent:        function(context) { context.append("</span>"); },
		enterNamedIdent:  function(context) { context.append("<span class=\"sunlight-named-ident\">"); },
		exitNamedIdent:   function(context) { context.append("</span>"); },
		
		enterDefault:     function(context) { },
		exitDefault:      function(context) { },
		
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
	
	var createToken = function(name, value, line, column) {
		return {
			name: name,
			line: line,
			value: value,
			column: column
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
							return createToken(name, word, context.reader.getLine());
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
			
			var parseOperator = function() {
				return matchWord(context.language.operators, "operator", "");
			};
			
			var parsePunctuation = function() {
				var current = context.reader.current();
				if (regexHelpers.punctuation.test(regexEscape(current))) {
					return createToken("punctuation", current, context.reader.getLine());
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
				
				return createToken(isNamed ? "namedIdent" : "ident", ident, context.reader.getLine());
			};
			
			var parseDefault = function() {
				return createToken("default", context.reader.current(), context.reader.getLine());
			};
			
			var parseComment = function() {
				var current = context.reader.current();
				for (var i = 0, opener, closer, peek; i < context.language.commentScopes.length; i++) {
					opener = context.language.commentScopes[i][0];
					
					peek = current + context.reader.peek(opener.length - 1);
					if (opener !== peek) {
						continue;
					}
					
					context.reader.read(opener.length - 1);
					var buffer = opener;
					var line = context.reader.getLine();
					
					//read the comment contents until the closer is found
					closer = context.language.commentScopes[i][1];
					var zeroWidth = context.language.commentScopes[i][2];
					peek = context.reader.peek(closer.length);
					while (peek !== context.reader.EOF && closer !== peek) {
						buffer += context.reader.read();
						peek = context.reader.peek(closer.length);
					}
					
					buffer += (zeroWidth ? "" : context.reader.read(closer.length));
					return createToken("comment", buffer, line);
				}
				
				return null;
			};
			
			var parseString = function() {
				var current = context.reader.current();
				for (var i = 0, opener, closer, peek; i < context.language.stringScopes.length; i++) {
					opener = context.language.stringScopes[i][0];
					
					peek = current + context.reader.peek(opener.length - 1);
					if (opener !== peek) {
						continue;
					}
					
					var buffer = opener;
					var line = context.reader.getLine();
					context.reader.read(opener.length - 1);
					
					//read the string contents until the closer is found
					closer = context.language.stringScopes[i][1];
					var closerEscape = context.language.stringScopes[i][2];
					peek = context.reader.peek(closer.length);
					while (peek !== context.reader.EOF) {
						if (context.reader.peek(closerEscape.length) === closerEscape) {
							buffer += context.reader.read(closerEscape.length);
							peek = context.reader.peek(closer.length);
							continue;
						}
						
						if (closer === peek) {
							//is the closer escaped?
							break;
						}
						
						buffer += context.reader.read();
						peek = context.reader.peek(closer.length);
					}
					
					buffer += context.reader.read(closer.length);
					return createToken("string", buffer, line);
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
				
				return createToken("number", number, context.reader.getLine());
			};
			
			var parseNamedIdent = function() {
				if (!isIdentMatch()) {
					return null;
				}
				
				//do the look-behind rules now, and then after tokenizing is complete,
				//we'll do the look-ahead rules
				for (var i = 0, rules; i < context.language.namedIdentRules.follows.length; i++) {
					rules = context.language.namedIdentRules.follows[i];
					var index = context.tokens.length - 1;
					var allRulesMatch = false;
					for (var j = 0, rule, token; j < rules.length && context.tokens[index - j] !== undefined; j++) {
						rule = rules[rules.length - 1 - j];
						token = context.tokens[index - j];
						if (token.name === rule.token && (rule.value === null || token.value === rule.value)) {
							allRulesMatch = true;
						} else {
							allRulesMatch = false;
							break;
						}
					}
					
					if (allRulesMatch) {
						return parseIdent(true);
					}
				}
				
				return null;
			};
			
			return parseKeyword() 
				|| parseComment()
				|| parseString()
				//|| parseNamedIdent()
				|| parseIdent()
				|| parseNumber()
				|| parseOperator()
				|| parsePunctuation()
				|| parseDefault();
		};
		
		var tokenize = function(unhighlightedCode, languageId) {
			var language = languages[languageId];
			if (language === undefined) {
				throw "Unregistered language: " + languageId;
			}
				
			var context = {
				reader: createCodeReader(unhighlightedCode), 
				language: language
			};
			
			var tokens = [];
			while (!context.reader.isEof()) {
				tokens.push(parseNextToken(context));
				context.reader.read();
			}
			
			return tokens;
		};
		
		return {
			highlight: function(unhighlightedCode, languageId) {
				var self = this;
				var analyzerContext = function() {
					var buffer = "";
					
					//based on http://phpjs.org/functions/htmlentities:425
					var encode = function() {
						var charMap = [
							["'", "&#039;"],
							["$", "&amp;"],
							["<", "&lt;"],
							[">", "&gt;"],
							["\t", new Array(self.options.tabWidth).join("&#160;")],
							[" ", "&#160;"],
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
						tokens: tokenize(unhighlightedCode, languageId),
						index: 0,
						append: function(text) { buffer += text; },
						appendAndEncode: function(text) { buffer += encode(text); },
						getHtml: function() { return buffer; }
					};
				}();
				
				var analyzer = self.options.analyzer;
				var map = self.options.tokenAnalyzerMap;
				for (var i = 0; i < analyzerContext.tokens.length; i++) {
					analyzerContext.index = i;
					//console.log(analyzerContext.tokens[i]);
					
					//open
					analyzer[map[analyzerContext.tokens[i].name][0]](analyzerContext);
					
					//write token value
					analyzer.writeCurrentToken(analyzerContext);
					
					//close
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
				namedIdent: ["enterNamedIdent", "exitNamedIdent"],
				punctuation: ["enterPunctuation", "exitPunctuation"],
				number: ["enterNumber", "exitNumber"],
				"default": ["enterDefault", "exitDefault"],
			}
		};
		
		return function(options) {
			var temp = defaults;
			if (options) {
				for (var key in options) {
					temp[key] = options[key];
				}
			}
			
			this.options = temp;
		};
	}();
	
	parserConstructor.prototype = parser;
	
	window.Sunlight = {
		version: "1.0",
		
		Highlighter: parserConstructor,
		
		highlightAll: function(options) { 
			var parser = new parserConstructor(options);
			console.log(parser);
			var preTags = document.getElementsByTagName("pre");
			for (var i = 0, match; i < preTags.length; i++) {
				if ((match = preTags[i].className.match(/\s*sunlight-(\S+)\s*/)) !== null) {
					var languageId = match[1];
					var code = preTags[i].getElementsByTagName("code")[0];
					
					code.innerHTML = parser.highlight(code.firstChild.nodeValue, languageId);
				}
			}
		},
		
		isRegistered: function(languageId) {
			return languages[languageId] !== undefined;
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