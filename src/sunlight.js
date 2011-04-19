/**
 * Sunlight
 *    Intelligent syntax highlighting
 *
 * http://sunlightjs.com/
 *
 * (c) 2011 Tommy Montgomery <http://tommymontgomery.com>
 *
 * Licensed under WTFPL <http://sam.zoy.org/wtfpl/>
 */
(function(window, document, undefined){

	//http://webreflection.blogspot.com/2009/01/32-bytes-to-know-if-your-browser-is-ie.html
	var isIe = !+"\v1"; //we have to sniff this because IE requires \r\n

	var EMPTY = function() { return null; };
	var HIGHLIGHTED_NODE_COUNT = 0;
	var DEFAULT_LANGUAGE = "plaintext";

	//http://javascript.crockford.com/prototypal.html
	var create = function(o) {
        function F() {}
        F.prototype = o;
        return new F();
    };

	//gets defined after the first call to highlight something
	var getComputedStyle = false;

	//array.contains()
	var contains = function(arr, value, caseInsensitive) {
		for (var i = 0; i < arr.length; i++) {
			if (arr[i] === value) {
				return true;
			}

			if (caseInsensitive && typeof(arr[i]) === "string" && typeof(value) === "string" && arr[i].toUpperCase() === value.toUpperCase()) {
				return true;
			}
		}

		return false;
	};

	//non-recursively merges one object into the other
	var merge = function(defaultObject, objectToMerge) {
		if (!objectToMerge) {
			return defaultObject;
		}

		for (var key in objectToMerge) {
			defaultObject[key] = objectToMerge[key];
		}

		return defaultObject;
	};

	//http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript/3561711#3561711
	var regexEscape = function(s) {
		return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")
	};

	var createProceduralRule = function(startIndex, direction, tokenRequirements, caseInsensitive) {
		tokenRequirements = tokenRequirements.slice(0);
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
				} else if (actual.name === expected.token && (expected["values"] === undefined || contains(expected.values, actual.value, caseInsensitive))) {
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

	var createBetweenRule = function(startIndex, opener, closer, caseInsensitive) {
		return function(tokens) {
			var index = startIndex, token;
			var success = false;

			//check to the left: if we run into a closer or never run into an opener, fail
			while ((token = tokens[--index]) !== undefined) {
				if (token.name === closer.token && contains(closer.values, token.value)) {
					if (token.name === opener.token && contains(opener.values, token.value, caseInsensitive)) {
						//if the closer is the same as the opener that's okay
						success = true;
						break;
					}

					return false;
				}

				if (token.name === opener.token && contains(opener.values, token.value, caseInsensitive)) {
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
				if (token.name === opener.token && contains(opener.values, token.value, caseInsensitive)) {
					if (token.name === closer.token && contains(closer.values, token.value, caseInsensitive)) {
						//if the closer is the same as the opener that's okay
						success = true;
						break;
					}

					return false;
				}

				if (token.name === closer.token && contains(closer.values, token.value, caseInsensitive)) {
					success = true;
					break;
				}
			}

			return success;
		};
	};

	var defaultAnalyzer = function() {
		var defaultHandleToken = function(suffix) {
			return function(context) {
				var element = document.createElement("span");
				element.className = "sunlight-" + suffix;
				element.appendChild(context.createTextNode(context.tokens[context.index].value));
				return context.addNode(element) || true;
			};
		};

		return  {
			handleToken: function(context) { return defaultHandleToken(context.tokens[context.index].name)(context); },

			//just append default content as a text node
			handle_default: function(context) { return context.addNode(context.createTextNode(context.tokens[context.index].value)); },

			//this handles the named ident mayhem
			handle_ident: function(context) {
				var evaluate = function(rules, createRule) {
					rules = rules || [];
					for (var i = 0; i < rules.length; i++) {
						if (typeof(rules[i]) === "function") {
							if (rules[i](context)) {
								return defaultHandleToken("named-ident")(context);
							}
						} else if (createRule && createRule(rules[i])(context.tokens)) {
							return defaultHandleToken("named-ident")(context);
						}
					}

					return false;
				};

				return evaluate(context.language.namedIdentRules.custom)
					|| evaluate(context.language.namedIdentRules.follows, function(ruleData) { return createProceduralRule(context.index - 1, -1, ruleData, context.language.caseInsensitive); })
					|| evaluate(context.language.namedIdentRules.precedes, function(ruleData) { return createProceduralRule(context.index + 1, 1, ruleData, context.language.caseInsensitive); })
					|| evaluate(context.language.namedIdentRules.between, function(ruleData) { return createBetweenRule(context.index, ruleData.opener, ruleData.closer, context.language.caseInsensitive); })
					|| defaultHandleToken("ident")(context);
			}
		};
	}();

	var createCodeReader = function(text) {
		text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n"); //normalize line endings to unix
		var index = 0;
		var line = 1;
		var column = 1;
		var length = text.length;
		var EOF = undefined;
		var currentChar = length > 0 ? text.charAt(0) : EOF;
		var nextReadBeginsLine = false;

		var getCharacters = function(count) {
			if (count === 0) {
				return "";
			}

			count = count || 1;

			var value = "", num = 1;
			while (num <= count && text.charAt(index + num) !== "") {
				value += text.charAt(index + num++);
			}

			return value === "" ? EOF : value;
		};

		return {
			toString: function() {
				return "length: " + length + ", index: " + index + ", line: " + line + ", column: " + column + ", current: [" + currentChar + "]";
			},

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

					if (value.charAt(value.length - 1) === "\n") {
						nextReadBeginsLine = true;
					}

					currentChar = value.charAt(value.length - 1);
				} else {
					index = length;
					currentChar = EOF;
				}

				return value;
			},

			getLine: function() { return line; },
			getColumn: function() { return column; },
			isEof: function() { return index >= length; },
			isSol: function() { return column === 1; },
			isEol: function() { return nextReadBeginsLine; },
			EOF: EOF,
			current: function() { return currentChar; }
		};
	};

	var matchWord = function(context, wordMap, tokenName, doNotRead) {
		wordMap = wordMap || [];
		var current = context.reader.current();
		if (context.language.caseInsensitive) {
			current = current.toUpperCase();
		}

		if (!wordMap[current]) {
			return null;
		}

		wordMap = wordMap[current];
		for (var i = 0, word, peek; i < wordMap.length; i++) {
			word = wordMap[i].value;

			peek = current + context.reader.peek(word.length);
			if (word === peek || wordMap[i].regex.test(peek)) {
				var line = context.reader.getLine(), column = context.reader.getColumn();
				return context.createToken(
					tokenName,
					context.reader.current() + context.reader[doNotRead ? "peek" : "read"](word.length - 1),
					line,
					column
				);
			}
		}

		return null;
	};

	var highlighter = function() {
		var getScopeReaderFunction = function(scope, tokenName) {
			var escapeSequences = scope[2] || [];
			var closerLength = scope[1].length;
			var closer = typeof(scope[1]) === "string" ? new RegExp(regexEscape(scope[1])) : scope[1].regex;
			var zeroWidth = scope[3] || false;

			//processCurrent indicates that this is being called from a continuation
			//which means that we need to process the current char, rather than peeking at the next
			return function(context, continuation, buffer, line, column, processCurrent) {
				var foundCloser = false, buffer = buffer || "";
				processCurrent = processCurrent ? 1 : 0;

				var process = function(processCurrent) {
					//check for escape sequences
					var peekValue;
					var current = context.reader.current();
					for (var i = 0; i < escapeSequences.length; i++) {
						peekValue = (processCurrent ? current : "") + context.reader.peek(escapeSequences[i].length - processCurrent);
						if (peekValue === escapeSequences[i]) {
							buffer += context.reader.read(peekValue.length - processCurrent);
							return true;
						}
					}

					peekValue = (processCurrent ? current : "") + context.reader.peek(closerLength - processCurrent);
					if (closer.test(peekValue)) {
						foundCloser = true;
						return false;
					}

					buffer += processCurrent ? current : context.reader.read();
					return true;
				};

				if (!processCurrent || process(true)) {
					while (context.reader.peek() !== context.reader.EOF && process(false)) { }
				}

				if (processCurrent) {
					buffer += context.reader.current();
					context.reader.read();
				} else {
					buffer += zeroWidth || context.reader.peek() === context.reader.EOF ? "" : context.reader.read(closerLength);
				}

				if (!foundCloser) {
					//we need to signal to the context that this scope was never properly closed
					//this has significance for partial parses (e.g. for nested languages)
					context.continuation = continuation;
				}

				return context.createToken(tokenName, buffer, line, column);
			};
		};

		var parseNextToken = function(context) {
			var isIdentMatch = function() {
				return context.language.identFirstLetter && context.language.identFirstLetter.test(context.reader.current());
			};

			//token parsing functions
			var parseKeyword = function() {
				return matchWord(context, context.language.keywords, "keyword");
			};

			var parseCustomTokens = function() {
				if (context.language.customTokens === undefined) {
					return null;
				}

				for (var tokenName in context.language.customTokens) {
					var token = matchWord(context, context.language.customTokens[tokenName], tokenName);
					if (token !== null) {
						return token;
					}
				}

				return null;
			};

			var parseOperator = function() {
				return matchWord(context, context.language.operators, "operator");
			};

			var parsePunctuation = function() {
				var current = context.reader.current();
				if (context.language.punctuation.test(regexEscape(current))) {
					return context.createToken("punctuation", current, context.reader.getLine(), context.reader.getColumn());
				}

				return null;
			};

			var parseIdent = function(isNamed) {
				if (!isIdentMatch()) {
					return null;
				}

				var ident = context.reader.current();
				var peek = context.reader.peek();
				var line = context.reader.getLine(), column = context.reader.getColumn();
				while (peek !== context.reader.EOF) {
					if (!context.language.identAfterFirstLetter.test(peek)) {
						break;
					}

					ident += context.reader.read();
					peek = context.reader.peek();
				}

				return context.createToken(isNamed ? "namedIdent" : "ident", ident, line, column);
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
					for (var j = 0, opener, line, column, continuation; j < specificScopes.length; j++) {
						opener = specificScopes[j][0];

						if (opener !== current + context.reader.peek(opener.length - 1)) {
							continue;
						}

						line = context.reader.getLine(), column = context.reader.getColumn();
						context.reader.read(opener.length - 1);
						continuation = getScopeReaderFunction(specificScopes[j], tokenName);
						return continuation(context, continuation, opener, line, column);
					}
				}

				return null;
			};

			var parseNumber = function() {
				return context.language.numberParser(context);
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
				|| parseCustomTokens()
				|| parseKeyword()
				|| parseScopes()
				|| parseIdent()
				|| parseNumber()
				|| parseOperator()
				|| parsePunctuation()
				|| parseDefault();
		};

		var tokenize = function(unhighlightedCode, language, continuation) {
			var tokens = [];
			var context = {
				reader: createCodeReader(unhighlightedCode),
				language: language,
				token: function(index) { return tokens[index]; },
				getAllTokens: function() { return tokens.slice(0); },
				count: function() { return tokens.length; },
				defaultData: {
					text: "",
					line: 1,
					column: 1
				},
				createToken: function(name, value, line, column) {
					return {
						name: name,
						line: line,
						value: isIe ? value.replace(/\n/g, "\r") : value,
						column: column
					};
				}
			};

			//if continuation is given, then we need to pick up where we left off from a previous parse
			//basically it indicates that a scope was never closed, so we need to continue that scope
			if (continuation) {
				tokens.push(continuation(context, continuation, "", context.reader.getLine(), context.reader.getColumn(), true));
			}

			while (!context.reader.isEof()) {
				var token = parseNextToken(context);

				//flush default data if needed (in pretty much all languages this is just whitespace)
				if (token !== null) {
					if (context.defaultData.text !== "") {
						tokens.push(context.createToken("default", context.defaultData.text, context.defaultData.line, context.defaultData.column));
						context.defaultData.text = "";
					}

					if (token[0] !== undefined) {
						//multiple tokens
						tokens = tokens.concat(token);
					} else {
						//single token
						tokens.push(token);
					}
				}

				context.reader.read();
			}

			//append the last default token, if necessary
			if (context.defaultData.text !== "") {
				tokens.push(context.createToken("default", context.defaultData.text, context.defaultData.line, context.defaultData.column));
			}

			return { tokens: tokens, continuation: context.continuation };
		};

		var createAnalyzerContext = function(unhighlightedCode, language, partialContext, options) {
			var nodes = [];
			var parseData = tokenize(unhighlightedCode, language, partialContext.continuation);
			var prepareText = function() {
				var nbsp = String.fromCharCode(0xa0);
				var tab = new Array(options.tabWidth + 1).join(nbsp);
				return function(text) {
					return text.split(" ").join(nbsp).split("\t").join(tab);
				};
			}();

			return {
				tokens: (partialContext.tokens || []).concat(parseData.tokens),
				index: partialContext.index ? partialContext.index + 1 : 0,
				language: language,
				continuation: parseData.continuation,
				addNode: function(node) { nodes.push(node); },
				createTextNode: function(text) { return document.createTextNode(prepareText(text)); },
				getNodes: function() { return nodes; }
			};
		};

		//partialContext allows us to perform a partial parse, and then pick up where we left off at a later time
		//this functionality enables nested highlights (language within a language, e.g. PHP within HTML followed by more PHP)
		var highlightText = function(unhighlightedCode, languageId, partialContext) {
			if (!getComputedStyle) {
				//http://blargh.tommymontgomery.com/2010/04/get-computed-style-in-javascript/
				getComputedStyle = function() {
					var func = null;
					if (document.defaultView && document.defaultView.getComputedStyle) {
						func = document.defaultView.getComputedStyle;
					} else if (typeof(document.body.currentStyle) !== "undefined") {
						func = function(element, anything) {
							return element["currentStyle"];
						};
					} else {
						func = EMPTY;
					}

					return function(element, style) {
						return func(element, null)[style];
					}
				}();
			};

			partialContext = partialContext || { };
			var language = languages[languageId];
			if (language === undefined) {
				//use default language if one wasn't specified or hasn't been registered
				language = languages[DEFAULT_LANGUAGE];
			}

			var analyzerContext = createAnalyzerContext(unhighlightedCode, language, partialContext, this.options);
			var analyzer = language.analyzer;
			for (var i = partialContext.index ? partialContext.index + 1 : 0, tokenName, func, exit; i < analyzerContext.tokens.length; i++) {
				analyzerContext.index = i;
				tokenName = analyzerContext.tokens[i].name;
				func = "handle_" + tokenName;

				analyzer[func] ? analyzer[func](analyzerContext) : analyzer.handleToken(analyzerContext);
			}

			return analyzerContext;
		};

		return {
			//highlights a block of text
			highlight: function(code, languageId) { return highlightText.call(this, code, languageId); },

			//recursively highlights a DOM node
			highlightNode: function highlightRecursive(node) {
				var match;
				if ((match = node.className.match(/(?:\s|^)sunlight-highlight-(\S+)(?:\s|$)/)) === null || /(?:\s|^)sunlight-highlighted(?:\s|$)/.test(node.className)) {
					//not a valid sunlight node or it's already been highlighted
					return;
				}

				var languageId = match[1];
				var currentNodeCount = 0;
				for (var j = 0, span, nodes, k, partialContext; j < node.childNodes.length; j++) {
					if (node.childNodes[j].nodeType === 3) {
						//text nodes
						span = document.createElement("span");

						span.className = "sunlight-highlighted sunlight-" + languageId;
						partialContext = highlightText.call(this, node.childNodes[j].nodeValue, languageId, partialContext);
						HIGHLIGHTED_NODE_COUNT++;
						currentNodeCount = currentNodeCount || HIGHLIGHTED_NODE_COUNT;

						nodes = partialContext.getNodes();
						for (k = 0; k < nodes.length; k++) {
							span.appendChild(nodes[k]);
						}

						node.replaceChild(span, node.childNodes[j]);
					} else {
						highlightRecursive.call(this, node.childNodes[j]);
					}
				}

				//indicate that this node has been highlighted
				node.className += " sunlight-highlighted";

				if (this.options.lineNumbers === true || (getComputedStyle && this.options.lineNumbers === "automatic" && getComputedStyle(node, "display") === "block")) {
					var container = document.createElement("div"), lineContainer = document.createElement("pre");
					
					//browsers don't render the last trailing newline, so we make sure that the line numbers reflect that
					//by disregarding the last trailing newline
					var lineCount =  node.innerHTML.replace(/[^\n]/g, "").length - /\n$/.test(node.lastChild.innerHTML);
					
					var lineHighlightOverlay, currentLineOverlay, lineHighlightingEnabled = this.options.lineHighlight.length > 0;
					if (lineHighlightingEnabled) {
						lineHighlightOverlay = document.createElement("div");
						lineHighlightOverlay.className = "sunlight-line-highlight-overlay";
					}
					
					container.className = "sunlight-container";
					lineContainer.className = "sunlight-line-number-margin";

					for (var i = this.options.lineNumberStart, eol = document.createTextNode(isIe ? "\r" : "\n"), link, name; i <= this.options.lineNumberStart + lineCount; i++) {
						link = document.createElement("a");
						name = (node.id ? node.id : "sunlight-" + currentNodeCount) + "-line-" + i;
						
						link.setAttribute("name", name);
						link.setAttribute("href", "#" + name);
						
						link.appendChild(document.createTextNode(i));
						lineContainer.appendChild(link);
						lineContainer.appendChild(eol.cloneNode(false));
						
						if (lineHighlightingEnabled) {
							currentLineOverlay = document.createElement("div");
							if (contains(this.options.lineHighlight, i)) {
								currentLineOverlay.className = "sunlight-line-highlight-active";
							}
							lineHighlightOverlay.appendChild(currentLineOverlay);
						}
					}

					container.appendChild(lineContainer);
					node.parentNode.insertBefore(container, node);
					node.parentNode.removeChild(node);
					container.appendChild(node);
					if (lineHighlightingEnabled) {
						container.appendChild(lineHighlightOverlay);
					}
				}
			}
		};
	}();

	var highlighterConstructor = function(options) {
		this.options = merge(merge({}, globalOptions), options);
	};

	highlighterConstructor.prototype = highlighter;

	//gets the next token in the specified direction that while matcher matches the current token
	var getNextWhile = function(tokens, index, direction, matcher) {
		direction = direction || 1;
		var count = 1, token;
		while (token = tokens[index + (direction * count++)]) {
			if (!matcher(token)) {
				return token;
			}
		}
		
		return undefined;
	};

	//this is crucial for performance
	var createHashMap = function(wordMap, boundary, caseInsensitive) {
		//creates a hash table where the hash is the first character of the word
		var newMap = { };
		for (var i = 0, word, firstChar; i < wordMap.length; i++) {
			word = caseInsensitive ? wordMap[i].toUpperCase() : wordMap[i];
			firstChar = word.charAt(0);
			if (!newMap[firstChar]) {
				newMap[firstChar] = [];
			}

			newMap[firstChar].push({ value: word, regex: new RegExp("^" + regexEscape(word) + boundary, caseInsensitive ? "i" : "") });
		}

		return newMap;
	};

	var defaultNumberParser = function(context) {
		var current = context.reader.current(), 
			number, 
			line = context.reader.getLine(), 
			column = context.reader.getColumn(),
			allowDecimal = true;

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

		//easy way out: read until it's not a number or letter
		//this will work for hex (0xef), octal (012), decimal and scientific notation (1e3)
		//anything else and you're on your own

		var peek;
		while ((peek = context.reader.peek()) !== context.reader.EOF) {
			if (!/[A-Za-z0-9]/.test(peek)) {
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
	};

	var globalOptions = {
		tabWidth: 4,
		lineNumbers: "automatic", //true/false/"automatic"
		lineNumberStart: 1,
		lineHighlight: []
	};

	var languages = {};
	var languageDefaults = {
		analyzer: create(defaultAnalyzer),
		customTokens: [],
		namedIdentRules: {},
		punctuation: /[^\w\s]/,
		numberParser: defaultNumberParser,
		caseInsensitive: false
	};

	//public facing object
	window.Sunlight = {
		version: "1.5",
		Highlighter: highlighterConstructor,
		createAnalyzer: function() { return create(defaultAnalyzer); },
		globalOptions: globalOptions,

		highlightAll: function(options) {
			var highlighter = new highlighterConstructor(options);
			var tags = document.getElementsByTagName("*");
			for (var i = 0; i < tags.length; i++) {
				highlighter.highlightNode(tags[i]);
			}
		},

		registerLanguage: function(languageId, languageData) {
			if (!languageId) {
				throw "Languages must be registered with an identifier, e.g. \"php\" for PHP";
			}

			languageData = merge(merge({}, languageDefaults), languageData);
			languageData.name = languageId;

			//transform keywords, operators and custom tokens into a hash map
			languageData.keywords = createHashMap(languageData.keywords || [], "\\b", languageData.caseInsensitive);
			languageData.operators = createHashMap(languageData.operators || [], "", languageData.caseInsensitive);
			for (var tokenName in languageData.customTokens) {
				languageData.customTokens[tokenName] = createHashMap(
					languageData.customTokens[tokenName].values,
					languageData.customTokens[tokenName].boundary,
					languageData.caseInsensitive
				);
			}

			languages[languageData.name] = languageData;
		},

		util: {
			escapeSequences: ["\\n", "\\t", "\\r", "\\\\", "\\v", "\\f"],
			contains: contains,
			matchWord: matchWord,
			createHashMap: createHashMap,
			createBetweenRule: createBetweenRule,
			createProceduralRule: createProceduralRule,
			getNextNonWsToken: function(tokens, index) { return getNextWhile(tokens, index, 1, function(token) { return token.name === "default"; }); },
			getPreviousNonWsToken: function(tokens, index) { return getNextWhile(tokens, index, -1, function(token) { return token.name === "default"; }); },
			getNextWhile: function(tokens, index, matcher) { return getNextWhile(tokens, index, 1, matcher); },
			getPreviousWhile: function(tokens, index, matcher) { return getNextWhile(tokens, index, -1, matcher); },
			whitespace: { token: "default", optional: true }
		}
	};

	//register the default language
	window.Sunlight.registerLanguage(DEFAULT_LANGUAGE, { punctuation: /(?!x)x/, numberParser: EMPTY });

}(window, document));