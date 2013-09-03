var utils = require('./util'),
	CodeReader = require('./code-reader'),
	EventEmitter = require('events').EventEmitter,
	util = require('util');

function Tokenizer(languageMap) {
	this.languageMap = languageMap;
}

util.inherits(Tokenizer, EventEmitter);

Tokenizer.prototype = {
	tokenize: function(unhighlightedCode, language, partialContext, options) {
		var tokens = [],
			continuation,
			token;

		this.emit('beforeTokenize', this, { code: unhighlightedCode, language: language });
		var context = {
			reader: new CodeReader(unhighlightedCode),
			languageMap: this.languageMap,
			language: language,
			items: utils.clone(language.contextItems),
			token: function(index) {
				return tokens[index];
			},
			getAllTokens: function() {
				return tokens.slice(0);
			},
			count: function() {
				return tokens.length;
			},
			options: options,
			embeddedLanguageStack: [],

			defaultData: {
				text: "",
				line: 1,
				column: 1
			},
			createToken: function(name, value, line, column) {
				return {
					name: name,
					line: line,
					value: isIe ? value.replace(/\n/g, '\r') : value,
					column: column,
					language: this.language.name
				};
			}
		};

		//if continuation is given, then we need to pick up where we left off from a previous parse
		//basically it indicates that a scope was never closed, so we need to continue that scope
		if (partialContext.continuation) {
			continuation = partialContext.continuation;
			partialContext.continuation = null;
			tokens.push(continuation(context, continuation, '', context.reader.getLine(), context.reader.getColumn(), true));
		}

		while (!context.reader.isEof()) {
			switchToEmbeddedLanguageIfNecessary(context);
			token = parseNextToken(context);

			//flush default data if needed (in pretty much all languages this is just whitespace)
			if (token !== null) {
				if (context.defaultData.text !== '') {
					tokens.push(context.createToken('default', context.defaultData.text, context.defaultData.line, context.defaultData.column));
					context.defaultData.text = '';
				}

				if (token[0] !== undefined) {
					//multiple tokens
					tokens = tokens.concat(token);
				} else {
					//single token
					tokens.push(token);
				}
			}

			switchBackFromEmbeddedLanguageIfNecessary(context);
			context.reader.read();
		}

		//append the last default token, if necessary
		if (context.defaultData.text !== '') {
			tokens.push(context.createToken('default', context.defaultData.text, context.defaultData.line, context.defaultData.column));
		}

		this.emit('afterTokenize', this, { code: unhighlightedCode, parserContext: context });
		return context;
	}
};

//called before processing the current
function switchToEmbeddedLanguageIfNecessary(context) {
	for (var i = 0; i < context.language.embeddedLanguages.length; i++) {
		if (!context.languageMap[context.language.embeddedLanguages[i].language]) {
			//unregistered language
			continue;
		}

		var embeddedLanguage = utils.clone(context.language.embeddedLanguages[i]);

		if (embeddedLanguage.switchTo(context)) {
			embeddedLanguage.oldItems = utils.clone(context.items);
			context.embeddedLanguageStack.push(embeddedLanguage);
			context.language = context.languageMap[embeddedLanguage.language];
			context.items = utils.merge(context.items, utils.clone(context.language.contextItems));
			break;
		}
	}
}

//called after processing the current
function switchBackFromEmbeddedLanguageIfNecessary(context) {
	var current = utils.last(context.embeddedLanguageStack);

	if (current && current.switchBack(context)) {
		context.language = context.languageMap[current.parentLanguage];
		var lang = context.embeddedLanguageStack.pop();

		//restore old items
		context.items = utils.clone(lang.oldItems);
		lang.oldItems = {};
	}
}

var parseNextToken = (function() {
	function isIdentMatch(context) {
		return context.language.identFirstLetter && context.language.identFirstLetter.test(context.reader.current());
	}

	//token parsing functions
	function parseKeyword(context) {
		return utils.matchWord(context, context.language.keywords, 'keyword');
	}

	function parseCustomTokens(context) {
		if (context.language.customTokens === undefined) {
			return null;
		}

		for (var tokenName in context.language.customTokens) {
			var token = utils.matchWord(context, context.language.customTokens[tokenName], tokenName);
			if (token !== null) {
				return token;
			}
		}

		return null;
	}

	function parseOperator(context) {
		return utils.matchWord(context, context.language.operators, 'operator');
	}

	function parsePunctuation(context) {
		var current = context.reader.current();
		if (context.language.punctuation.test(utils.regexEscape(current))) {
			return context.createToken('punctuation', current, context.reader.getLine(), context.reader.getColumn());
		}

		return null;
	}

	function parseIdent(context) {
		var ident,
			peek,
			line = context.reader.getLine(),
			column = context.reader.getColumn();

		if (!isIdentMatch(context)) {
			return null;
		}

		ident = context.reader.current();
		while ((peek = context.reader.peek()) !== context.reader.EOF) {
			if (!context.language.identAfterFirstLetter.test(peek)) {
				break;
			}

			ident += context.reader.read();
		}

		return context.createToken('ident', ident, line, column);
	}

	function parseDefault(context) {
		if (context.defaultData.text === '') {
			//new default token
			context.defaultData.line = context.reader.getLine();
			context.defaultData.column = context.reader.getColumn();
		}

		context.defaultData.text += context.reader.current();
		return null;
	}

	function parseScopes(context) {
		var current = context.reader.current();

		for (var tokenName in context.language.scopes) {
			var specificScopes = context.language.scopes[tokenName];
			for (var j = 0; j < specificScopes.length; j++) {
				var opener = specificScopes[j][0],
					value = current + context.reader.peek(opener.length - 1);

				if (opener !== value && (!context.language.caseInsensitive || value.toUpperCase() !== opener.toUpperCase())) {
					continue;
				}

				var line = context.reader.getLine(),
					column = context.reader.getColumn();
				context.reader.read(opener.length - 1);
				var continuation = getScopeReaderFunction(specificScopes[j], tokenName);
				return continuation(context, continuation, value, line, column);
			}
		}

		return null;
	}

	function parseNumber(context) {
		return context.language.numberParser(context);
	}

	function parseCustomRules(context) {
		var customRules = context.language.customParseRules;

		if (customRules === undefined) {
			return null;
		}

		for (var i = 0; i < customRules.length; i++) {
			var token = customRules[i](context);
			if (token) {
				return token;
			}
		}

		return null;
	}

	return function(context) {
		if (context.language.doNotParse.test(context.reader.current())) {
			return parseDefault(context);
		}

		return parseCustomRules(context)
			|| parseCustomTokens(context)
			|| parseKeyword(context)
			|| parseScopes(context)
			|| parseIdent(context)
			|| parseNumber(context)
			|| parseOperator(context)
			|| parsePunctuation(context)
			|| parseDefault(context);
	}
}());

function getScopeReaderFunction(scope, tokenName) {
	var escapeSequences = scope[2] || [],
		closerLength = scope[1].length,
		closer = typeof(scope[1]) === 'string' ? new RegExp(utils.regexEscape(scope[1])) : scope[1].regex,
		zeroWidth = scope[3] || false;

	//processCurrent indicates that this is being called from a continuation
	//which means that we need to process the current char, rather than peeking at the next
	return function(context, continuation, buffer, line, column, processCurrent) {
		var foundCloser = false;
		buffer = buffer || '';

		processCurrent = processCurrent ? 1 : 0;

		function process(processCurrent) {
			//check for escape sequences
			var peekValue,
				current = context.reader.current();

			for (var i = 0; i < escapeSequences.length; i++) {
				peekValue = (processCurrent ? current : '') + context.reader.peek(escapeSequences[i].length - processCurrent);
				if (peekValue === escapeSequences[i]) {
					buffer += context.reader.read(peekValue.length - processCurrent);
					return true;
				}
			}

			peekValue = (processCurrent ? current : '') + context.reader.peek(closerLength - processCurrent);
			if (closer.test(peekValue)) {
				foundCloser = true;
				return false;
			}

			buffer += processCurrent ? current : context.reader.read();
			return true;
		}

		if (!processCurrent || process(true)) {
			//noinspection StatementWithEmptyBodyJS
			while (context.reader.peek() !== CodeReader.EOF && process(false));
		}

		if (processCurrent) {
			buffer += context.reader.current();
			context.reader.read();
		} else {
			buffer += zeroWidth || context.reader.peek() === context.reader.EOF
				? ''
				: context.reader.read(closerLength);
		}

		if (!foundCloser) {
			//we need to signal to the context that this scope was never properly closed
			//this has significance for partial parses (e.g. for nested languages)
			context.continuation = continuation;
		}

		return context.createToken(tokenName, buffer, line, column);
	};
}

module.exports = Tokenizer;