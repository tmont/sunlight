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
	
	//based on http://phpjs.org/functions/htmlentities:425
	var encode = function() {
		var charMap = [
			["'", "&#039;"],
			["$", "&amp;"],
			["<", "&lt;"],
			[">", "&gt;"],
			["\t", "&#160;&#160;&#160;&#160;"],
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
	
	//http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript/3561711#3561711
	var regexEscape = function(s) {
		return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")
	};
	
	var regexHelpers = {
		punctuation: /[^A-Za-z0-9\s]/
	};

	var defaultAnalyzer = {
		enterKeyword:     function(context) { context.append("<span class=\"sunlight-keyword\">"); },
		exitKeyword:      function(context) { context.append("</span>"); },
		enterOperator:    function(context) { context.append("<span class=\"\sunlight-operator\">"); },
		exitOperator:     function(context) { context.append("</span>"); },
		enterString:      function(context) { context.append("<span class=\"sunlight-string\">"); },
		exitString:       function(context) { context.append("</span>"); },
		enterIdent:       function(context) { context.append("<span class=\"sunlight-ident\">"); },
		exitIdent:        function(context) { context.append("</span>"); },
		enterPunctuation: function(context) { context.append("<span class=\"sunlight-punctuation\">"); },
		exitPunctuation:  function(context) { context.append("</span>"); },
		enterNamedIdent:  function(context) { context.append("<span class=\"sunlight-named-ident\">"); },
		exitNamedIdent:   function(context) { context.append("</span>"); },
		enterNumber:      function(context) { context.append("<span class=\"sunlight-number\">"); },
		exitNumber:       function(context) { context.append("</span>"); },
		enterComment:     function(context) { context.append("<span class=\"sunlight-comment\">"); },
		exitComment:      function(context) { context.append("</span>"); }
	};
	
	var createParserContext = function(reader, language, analyzer) {
		var tokens = [];
		var buffer = "";
		return {
			language: language,
			tokens: tokens,
			lastToken: function() { return tokens[tokens.length - 1]; },
			reader: reader,
			append: function(text) { buffer += text; },
			appendAndEncode: function(text) { buffer += encode(text); },
			analyzer: analyzer,
			getHtml: function() { return buffer; }
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
				
				context.tokens.push(token);
				context.analyzer.enterKeyword(context);
				context.appendAndEncode(token.value);
				context.analyzer.exitKeyword(context);
				return true;
			};
			
			var parseOperator = function() {
				var token = matchWord(context.language.operators, "operator");
				if (token === null) {
					return false;
				}
				
				context.tokens.push(token);
				context.analyzer.enterOperator(context);
				context.appendAndEncode(token.value);
				context.analyzer.exitOperator(context);
				return true;
			};
			
			var parsePunctuation = function() {
				var current = context.reader.current();
				if (regexHelpers.punctuation.exec(current) !== null) {
					var token = createToken("punctuation", current, context.reader.getLine());
					context.tokens.push(token);
					context.analyzer.enterPunctuation(context);
					context.appendAndEncode(token.value);
					context.analyzer.exitPunctuation(context);
					return true;
				}
				
				return false;
			};
			
			var parseIdent = function(isNamed) {
				if (!isIdentMatch()) {
					return false;
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
				
				context.tokens.push(createToken(isNamed ? "namedIdent" : "ident", ident, context.reader.getLine()));
				context.analyzer[isNamed ? "enterNamedIdent" : "exitNamedIdent"](context);
				context.appendAndEncode(ident);
				context.analyzer[isNamed ? "exitNamedIdent" : "exitIdent"](context);
				return true;
			};
			
			var isIdentMatch = function() {
				return context.language.identFirstLetter.test(context.reader.current());
			};
			
			var parseDefault = function() {
				context.appendAndEncode(context.reader.current());
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
					
					context.tokens.push(createToken("commentOpener", opener, context.reader.getLine()));
					context.reader.read(opener.length - 1);
					context.analyzer.enterComment(context);
					context.appendAndEncode(opener);
					
					//read the comment contents until the closer is found
					closer = context.language.commentScopes[i][1];
					var zeroWidth = context.language.commentScopes[i][2];
					peek = context.reader.peek(closer.length);
					var buffer = "";
					while (peek !== context.reader.EOF && closer !== peek) {
						buffer += context.reader.read();
						peek = context.reader.peek(closer.length);
					}
					
					context.appendAndEncode(buffer + (zeroWidth ? "" : context.reader.read(closer.length)));
					buffer = null;
					context.tokens.push(createToken("commentCloser", closer, context.reader.getLine()));
					context.analyzer.exitComment(context);
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
					
					context.tokens.push(createToken("stringOpener", opener, context.reader.getLine()));
					context.reader.read(opener.length - 1);
					
					context.analyzer.enterString(context);
					context.appendAndEncode(opener);
					
					//read the string contents until the closer is found
					closer = context.language.stringScopes[i][1];
					var closerEscape = context.language.stringScopes[i][2];
					peek = context.reader.peek(closer.length);
					var buffer = "";
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
					
					context.appendAndEncode(buffer + context.reader.read(closer.length));
					buffer = null;
					context.tokens.push(createToken("stringCloser", closer, context.reader.getLine()));
					context.analyzer.exitString(context);
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
				//anything else and you're on your own
				
				var peek = context.reader.peek();
				while (peek !== context.reader.EOF) {
					if (!/[A-Za-z0-9]/.test(peek)) {
						break;
					}
					
					number += context.reader.read();
					peek = context.reader.peek();
				}
				
				context.tokens.push(createToken("number", number, context.reader.getLine()));
				context.analyzer.enterNumber(context);
				context.appendAndEncode(number);
				context.analyzer.exitNumber(context);
				return true;
			};
			
			var parseNamedIdent = function() {
				if (!isIdentMatch()) {
					return false;
				}
				
				for (var i = 0, rule; i < context.language.namedIdentRules.follows.length; i++) {
					rule = context.language.namedIdentRules.follows[i];
					var index = context.tokens.length - 1;
					for (var j = 0; j < rule.length && context.tokens[index - j] !== undefined; j++) {
						if (
							context.tokens[index - j].name === rule[rule.length - 1 - j].token && 
							(rule[rule.length - 1 - j].value === null || context.tokens[index - j].value === rule[rule.length - 1 - j].value)
						) {
							return parseIdent(true);
						}
					}
				}
				
				return false;
			};
			
			return parseKeyword() 
				|| parseOperator()
				|| parseString() 
				|| parseComment()
				// || parseOtherScopes()
				|| parseNamedIdent()
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
				
				return context.getHtml();
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
		
		highlight: function(options) { 
			//<pre class="sunlight-{languageId}"><code>
			
			var parser = new parserConstructor(options);
			var preTags = document.getElementsByTagName("pre");
			for (var i = 0, match; i < preTags.length; i++) {
				if ((match = preTags[i].className.match(/\s*sunlight-(\S+)\s*/)) !== null) {
					var languageId = match[1];
					var code = preTags[i].getElementsByTagName("code")[0];
					
					code.innerHTML = parser.parse(code.firstChild.nodeValue, languageId);
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
				console.log("registering " + languageIds[i]);
				languages[languageIds[i]] = languageData;
			}
		}
	};

}(window));