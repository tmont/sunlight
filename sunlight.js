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
	
	var regexEscape = function(s) {
		return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")
	};
	
	var regexHelpers = {
		punctuation: /[^A-Za-z0-9\s]/
	};


	var defaultAnalyzer = {
		enterKeyword: function(token)     { console.log("enterKeyword", token); },
		exitKeyword: function(token)      { console.log("exitKeyword" , token); },
		
		enterOperator: function(token)    { console.log("enterOperator", token); },
		exitOperator: function(token)     { console.log("exitOperator" , token); },
		
		enterString: function(token)      { console.log("enterString", token); },
		exitString: function(token)       { console.log("exitString" , token); },
		
		enterIdent: function(token)       { console.log("enterIdent", token); },
		exitIdent: function(token)        { console.log("exitIdent" , token); },
		
		enterPunctuation: function(token) { console.log("enterPunctuation", token); },
		exitPunctuation: function(token)  { console.log("exitPunctuation" , token); },
		
		enterNamedIdent: function(token) {},
		exitNamedIdent: function(token) {},
		
		enterNumber: function(token)      { console.log("enterNumber", token); },
		exitNumber: function(token)       { console.log("exitNumber" , token); },
		
		enterComment: function(token)     { console.log("enterComment", token); },
		exitComment: function(token)      { console.log("exitComment" , token); },
	};
	
	var createParserContext = function(reader, language, analyzer) {
		var tokens = [];
		return {
			scopeStack: [ ],
			language: language,
			tokens: tokens,
			lastToken: function() { return tokens[tokens.length - 1]; },
			reader: reader,
			buffer: "",
			analyzer: analyzer
		};
	};
	
	//registered languages
	var languages = { };
	
	var createCodeReader = function(text) {
		text = text.replace("\r\n", "\n").replace("\r", "\n"); //normalize line endings to unix
		var index = 0;
		var line = 1;
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
					
					//update line count
					if (nextReadBeginsLine) {
						line++;
						nextReadBeginsLine = false;
					}
					
					var newlineCount = value.substring(0, value.length - 1).replace(/[^\n]/g, "").length;
					line += newlineCount;
					
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
			isEof: function() { return index >= length; },
			EOF: EOF,
			current: function() { return currentChar; }
		};
	};
	
	var createToken = function(name, value, line) {
		return {
			name: name,
			line: line,
			value: value
		}
	};
	
	var parser = function() {
		var parseNextToken = function(context) {
			
			var matchWord = function(wordMap, name) {
				var current = context.reader.current();
				for (var i = 0, word; i < wordMap.length; i++) {
					word = wordMap[i];
					if (word[0] === current) {
						var peek = current + context.reader.peek(word.length);
						if (word === peek || new RegExp(regexEscape(word) + "\\b").exec(peek) !== null) {
							var readChars = context.reader.read(word.length - 1); //read to the end of the word (we already read the first letter)
							//console.log("matched word and then read [%s]", readChars);
							return createToken(name, word, context.reader.getLine());
						}
					}
				}
				
				return null;
			};
		
			var parseKeyword = function() {
				var token = matchWord(context.language.keywords, "keyword");
				if (token === null) {
					return false;
				}
				
				context.analyzer.enterKeyword(token);
				context.analyzer.exitKeyword(token);
				return true;
			};
			
			var parseOperator = function() {
				var token = matchWord(context.language.operators, "operator");
				if (token === null) {
					return false;
				}
				
				context.analyzer.enterOperator(token);
				context.analyzer.exitOperator(token);
				return true;
			};
			
			var parsePunctuation = function() {
				var current = context.reader.current();
				if (regexHelpers.punctuation.exec(current) !== null) {
					var token = createToken("punctuation", current, context.reader.getLine());
					context.analyzer.enterPunctuation(token);
					context.analyzer.exitPunctuation(token);
					return true;
				}
				
				return false;
			};
			
			var parseIdent = function() {
				var current = context.reader.current();
				if (context.language.identFirstLetter.exec(current) === null) {
					return false;
				}
				
				var ident = current;
				var peek = context.reader.peek();
				while (peek !== context.reader.EOF) {
					if (context.language.identAfterFirstLetter.exec(peek) === null) {
						break;
					}
					
					ident += context.reader.read();
					peek = context.reader.peek();
				}
				
				var token = createToken("ident", ident, context.reader.getLine());
				context.analyzer.enterIdent(token);
				context.analyzer.exitIdent(token);
				return true;
			};
			
			var parseDefault = function() {
				console.log("parsing default: [%s]", context.reader.current());
				context.buffer += context.reader.current();
				return true;
			};
			
			var parseComment = function() {
				var current = context.reader.current();
				for (var i = 0, opener, closer, peek; i < context.language.commentScopes.length; i++) {
					opener = context.language.commentScopes[i][0];
					
					
					peek = current + context.reader.peek(opener.length - 1);
					if (opener !== peek) {
						continue;
					}
					
					context.analyzer.enterComment(createToken("commentOpener", opener, context.reader.getLine()));
					context.reader.read(opener.length - 1);
					
					//read the comment contents until the closer is found
					closer = context.language.commentScopes[i][1];
					var zeroWidth = context.language.commentScopes[i][2];
					peek = context.reader.read(closer.length);
					var buffer = "";
					while (peek !== context.reader.EOF && closer !== peek) {
						buffer += context.reader.read();
						peek = context.reader.peek(closer.length);
					}
					
					context.buffer += buffer + (zeroWidth ? "" : context.reader.read(closer.length));
					buffer = null;
					context.analyzer.exitComment(createToken("commentCloser", closer, context.reader.getLine()));
					return true;
				}
				
				return false;
			};
			
			var parseString = function() {
				var current = context.reader.current();
				for (var i = 0, opener, closer, peek; i < context.language.stringScopes.length; i++) {
					opener = context.language.stringScopes[i][0];
					
					peek = current + context.reader.peek(opener.length - 1);
					if (opener !== peek) {
						continue;
					}
					
					context.analyzer.enterString(createToken("stringOpener", opener, context.reader.getLine()));
					context.reader.read(opener.length - 1);
					
					//read the string contents until the closer is found
					closer = context.language.stringScopes[i][1];
					var closerEscape = context.language.stringScopes[i][2];
					peek = context.reader.read(closer.length);
					var buffer = "";
					while (peek !== context.reader.EOF) {
						if (closer === peek) {
							//is the closer escaped?
							if (context.reader.peek(closerEscape.length) === closerEscape) {
								buffer += context.reader.read(closerEscape.length);
								peek = context.reader.peek(closer.length);
								continue;
							} else {
								break;
							}
						}
						
						buffer += context.reader.read();
						peek = context.reader.peek(closer.length);
					}
					
					context.buffer += buffer + context.reader.read(closer.length);
					buffer = null;
					context.analyzer.exitString(createToken("stringCloser", closer, context.reader.getLine()));
					return true;
				}
				
				return false;
			};
			
			var parseNumber = function() {
				var current = context.reader.current();
				var number;
				
				if (!/\d/.test(current)) {
					//is it a decimal followed by a number?
					if (current !== "." || !/d/.test(context.reader.peek())) {
						return false;
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
				//anything else on you're on your own
				
				var peek = context.reader.peek();
				while (peek !== context.reader.EOF) {
					if (!/[A-Za-z0-9]/.test(peek)) {
						break;
					}
					
					number += context.reader.read();
					peek = context.reader.peek();
				}
				
				context.analyzer.enterNumber(createToken("number", number, context.reader.getLine()));
				context.analyzer.exitNumber(createToken("number", number, context.reader.getLine()));
			};
			
			return parseKeyword() 
				|| parseOperator()
				|| parseString() 
				|| parseComment()
				// || parseOtherScopes()
				|| parseIdent()
				|| parseNumber()
				|| parsePunctuation()
				|| parseDefault();
		};
	
		return {
			parse: function(unhighlightedCode, languageId) {
				var languageSettings = languages[languageId];
				if (languageSettings === undefined) {
					throw "Unregistered language: " + languageId;
				}
				
				var context = createParserContext(createCodeReader(unhighlightedCode), languageSettings, create(defaultAnalyzer));
				
				while (!context.reader.isEof()) {
					parseNextToken(context);
					context.reader.read();
				}
			}
		};
	}();
	
	var parserConstructor = function(options) {
		this.options = options;
	};
	
	parserConstructor.prototype = parser;
	
	window.Sunlight = {
		version: "1.0",
		
		Parser: parserConstructor,
		
		highlight: function() { 
			//auto-detect code snippets and highlight them
		},
		
		isRegistered: function(languageId) {
			return languages[languageId] !== undefined;
		},
		
		registerLanguage: function(languageIds, languageData) {
			if (languageIds.length === 0) {
				throw "Languages must be registered with at least one identifier, e.g. \"php\" for PHP";
			}
			
			for (var i = 0; i < languageIds.length; i++) {
				console.log("registering " + languageIds[i]);
				languages[languageIds[i]] = languageData;
			}
		}
	};

}(window));