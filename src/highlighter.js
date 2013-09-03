var utils = require('./util'),
	Tokenizer = require('./tokenizer'),
	EventEmitter = require('events').EventEmitter,
	util = require('util');

function Highlighter(options) {
	this.options = util._extend(util._extend({}, Highlighter.defaultOptions), options);
	if (!this.options.languageMap.plaintext) {
		this.register('plaintext', { punctuation: /(?!x)x/, numberParser: null });
	}
	this.tokenizer = new Tokenizer(this.options.languageMap);
	utils.bubble('beforeTokenize', this.tokenizer, this);
	utils.bubble('afterTokenize', this.tokenizer, this);
}

util.inherits(Highlighter, EventEmitter);

Highlighter.defaultOptions = {
	tabWidth: 4,
	classPrefix: 'sunlight-',
	showWhitespace: false,
	eol: '\n',
	maxHeight: false
};

function createAnalyzerContext(parserContext, partialContext, options) {
	var result = '',
		prepareText = function() {
			var nbsp, tab;
			if (options.showWhitespace) {
				nbsp = String.fromCharCode(0xB7);
				tab = new Array(options.tabWidth).join(String.fromCharCode(0x2014)) + String.fromCharCode(0x2192);
			} else {
				nbsp = String.fromCharCode(0xA0);
				tab = new Array(options.tabWidth + 1).join(nbsp);
			}

			return function(token) {
				var value = token.value.split(' ').join(nbsp),
					tabIndex,
					lastNewlineColumn,
					actualColumn,
					tabLength;

				//tabstop madness: replace \t with the appropriate number of characters, depending on the tabWidth option and its relative position in the line
				while ((tabIndex = value.indexOf('\t')) >= 0) {
					lastNewlineColumn = value.lastIndexOf(options.eol, tabIndex);
					actualColumn = lastNewlineColumn === -1 ? tabIndex : tabIndex - lastNewlineColumn - 1;
					tabLength = options.tabWidth - (actualColumn % options.tabWidth); //actual length of the TAB character

					value = value.substring(0, tabIndex) + tab.substring(options.tabWidth - tabLength) + value.substring(tabIndex + 1);
				}

				return value;
			};
		}();

	return {
		tokens: (partialContext.tokens || []).concat(parserContext.getAllTokens()),
		index: partialContext.index ? partialContext.index + 1 : 0,
		language: null,
		getAnalyzer: function() {},
		options: options,
		continuation: parserContext.continuation,
		prepareToken: function(token) {
			return prepareText(token);
		},
		result: result,
		items: parserContext.items
	};
}

var languageDefaults = {
	analyzer: null,
	customTokens: [],
	namedIdentRules: {},
	punctuation: /[^\w\s]/,
	numberParser: null,
	caseInsensitive: false,
	doNotParse: /\s/,
	contextItems: {},
	embeddedLanguages: {}
};

function defaultNumberParser(context) {
	var current = context.reader.current(),
		number,
		line = context.reader.getLine(),
		column = context.reader.getColumn(),
		allowDecimal = true,
		peek;

	if (!/\d/.test(current)) {
		//is it a decimal followed by a number?
		if (current !== '.' || !/\d/.test(context.reader.peek())) {
			return null;
		}

		//decimal without leading zero
		number = current + context.reader.read();
		allowDecimal = false;
	} else {
		number = current;
		if (current === '0' && context.reader.peek() !== '.') {
			//hex or octal
			allowDecimal = false;
		}
	}

	//easy way out: read until it's not a number or letter
	//this will work for hex (0xef), octal (012), decimal and scientific notation (1e3)
	//anything else and you're on your own

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

	return context.createToken('number', number, line, column);
}

function openContainer(ctx) {
	return '<span class="' + ctx.options.classPrefix + ctx.language.name + '">';
}

function closeContainer() {
	return '</span>';
}

function analyze(context, startIndex) {
	var tokenName,
		func,
		language,
		analyzer;

	this.emit('beforeAnalyze', { context: context });

	if (context.tokens.length > 0) {
		context.language = this.options.languageMap[context.tokens[0].language] || this.options.languageMap.plaintext;
		var result = openContainer(context);

		for (var i = startIndex; i < context.tokens.length; i++) {
			language = this.options.languageMap[context.tokens[i].language] || this.options.languageMap.plaintext;
			if (language.name !== context.language.name) {
				result += openContainer(context) + context.result + closeContainer();
				context.result = '';
				context.language = language;
			}

			context.index = i;
			tokenName = context.tokens[i].name;
			func = 'handle_' + tokenName;

			analyzer = context.getAnalyzer.call(context) || context.language.analyzer;
			analyzer[func] ? analyzer[func](context) : analyzer.handleToken(context);
		}

		result += context.result;
		result += closeContainer();
		context.result = result;
	}

	this.emit('afterAnalyze', { context: context });
}

util._extend(Highlighter.prototype, {
	register: function(id, definition) {
		if (!id) {
			throw new Error('Languages must be registered with an identifier');
		}

		definition = utils.merge(utils.merge({}, languageDefaults), definition);
		definition.name = id;

		//transform keywords, operators and custom tokens into a hash map
		definition.keywords = utils.createHashMap(definition.keywords || [], '\\b', definition.caseInsensitive);
		definition.operators = utils.createHashMap(definition.operators || [], '', definition.caseInsensitive);
		for (var tokenName in definition.customTokens) {
			definition.customTokens[tokenName] = utils.createHashMap(
				definition.customTokens[tokenName].values,
				definition.customTokens[tokenName].boundary,
				definition.caseInsensitive
			);
		}

		//convert the embedded language object to an easier-to-use array
		var embeddedLanguages = [];
		for (var name in definition.embeddedLanguages) {
			embeddedLanguages.push({
				parentLanguage: definition.name,
				language: name,
				switchTo: definition.embeddedLanguages[name].switchTo,
				switchBack: definition.embeddedLanguages[name].switchBack
			});
		}

		definition.embeddedLanguages = embeddedLanguages;
		if (!definition.numberParser) {
			definition.numberParser = defaultNumberParser;
		}

		this.options.languageMap[definition.name] = definition;
	},

	isRegistered: function(languageId) {
		return !!this.options.languageMap[languageId];
	},

	//partialContext allows us to perform a partial parse, and then pick up where we left off at a later time
	//this functionality enables nested highlights (language within a language, e.g. PHP within HTML followed by more PHP)
	highlight: function(text, languageId, partialContext) {
		var language = this.options.languageMap[languageId],
			analyzerContext;

		partialContext = partialContext || { };
		if (language === undefined) {
			//use default language if one wasn't specified or hasn't been registered
			language = this.options.languageMap.plaintext;
		}

		this.emit('beforeHighlight', {
			code: text,
			language: language,
			previousContext: partialContext
		});

		analyzerContext = createAnalyzerContext(
			this.tokenizer.tokenize(text, language, partialContext, this.options),
			partialContext,
			this
		);

		analyze.call(this, analyzerContext, partialContext.index ? partialContext.index + 1 : 0);

		this.emit('afterHighlight', { analyzerContext: analyzerContext });

		return analyzerContext;
	}
});

module.exports = Highlighter;