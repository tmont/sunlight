var utils = require('../util'),
	regexLiteralRule = require('./rules/regex-literal');

module.exports = {
	keywords: [
		'default xml namespace',
		'use namespace',

		'break', 'case', 'catch', 'continue', 'default', 'do', 'else', 'finally', 'for', 'if', 'in',
		'label', 'return', 'super', 'switch', 'throw', 'try', 'while', 'with',

		'dynamic', 'final', 'internal', 'native', 'override', 'private', 'protected', 'public', 'static',

		'class', 'const', 'extends', 'function', 'get', 'implements', 'interface', 'namespace', 'package',
		'set', 'var',

		'import', 'include',

		'false', 'null', 'this', 'true',

		'typeof', 'void', 'as', 'instanceof', 'is', 'new'
	],

	customTokens: {
		varArgs: {
			values: ['...rest'],
			boundary: '[\\W]'
		},

		constant: {
			values: ['Infinity', 'NaN', 'undefined'],
			boundary: '\\b'
		},

		globalObject: {
			values: [
				'ArgumentError', 'arguments', 'Array', 'Boolean', 'Class', 'Date', 'DefinitionError',
				'Error', 'EvalError', 'Function', 'int', 'Math', 'Namespace', 'Number', 'Object', 'QName',
				'RangeError', 'ReferenceError', 'RegExp', 'SecurityError', 'String', 'SyntaxError', 'TypeError',
				'uint', 'URIError', 'Vector', 'VerifyError', 'XMLList', 'XML'
			],
			boundary: '\\b'
		}
	},

	scopes: {
		string: [ ['\'', '\'', utils.escapeSequences.concat(['\\\''])], ['\'', '\'', utils.escapeSequences.concat(['\\\'', '\\\\'])] ],
		comment: [ ['//', '\n', null, true], ['/*', '*/'] ],
		xmlAttribute: [ ['@', '\\b'] ]
	},

	customParseRules: [
		//global functions: //http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/package-detail.html
		function() {
			var functions = utils.createHashMap([
				'Array', 'Boolean', 'decodeURIComponent', 'decodeURI', 'encodeURIComponent', 'encodeURI',
				'escape', 'int', 'isFinite', 'isNaN', 'isXMLName', 'Number', 'Object', 'parseFloat',
				'parseInt', 'String', 'trace', 'uint', 'unescape', 'Vector', 'XML', 'XMLList'
			], '\\b', false);

			return function(context) {
				if (!/[A-Za-z]/.test(context.reader.current())) {
					//short circuit
					return null;
				}

				//if it follows 'new' or ':', then it's not a function
				var prevToken = context.token(context.count() - 1);
				if (prevToken && ((prevToken.name === 'keyword' && prevToken.value === 'new') || (prevToken.name === 'operator' && prevToken.value === ':'))) {
					return null;
				}

				var token = utils.matchWord(context, functions, 'globalFunction', true);
				if (!token) {
					return null;
				}

				//make sure that a '(' follows it
				var count = token.value.length, peek;
				while ((peek = context.reader.peek(count)) && peek.length === count) {
					if (!/\s$/.test(peek)) {
						if (utils.last(peek) === '(') {
							token.line = context.reader.getLine();
							token.column = context.reader.getColumn();
							context.reader.read(token.value.length - 1);
							return token;
						}

						break;
					}
				}

				return null;
			};
		}(),

		regexLiteralRule
	],

	identFirstLetter: /[A-Za-z_]/,
	identAfterFirstLetter: /\w/,

	namedIdentRules: {
		custom: [
			function(context) {
				//next token is not '.'
				var nextToken = utils.getNextNonWsToken(context.tokens, context.index),
					token,
					index,
					previous;

				if (nextToken && nextToken.name === 'operator' && nextToken.value === '.') {
					return false;
				}

				//go backward and make sure that there are only idents and dots before the new keyword
				index = context.index;
				previous = context.tokens[index];
				while ((token = context.tokens[--index]) !== undefined) {
					if (token.name === 'keyword' && utils.contains(['new', 'is', 'instanceof', 'import'], token.value)) {
						return true;
					}

					if (token.name === 'default') {
						continue;
					}

					if (token.name === 'ident') {
						if (previous && previous.name === 'ident') {
							return false;
						}

						previous = token;
						continue;
					}

					if (token.name === 'operator' && token.value === '.') {
						if (previous && previous.name !== 'ident') {
							return false;
						}

						previous = token;
						continue;
					}

					break;
				}

				return false;
			}
		],

		follows: [
			[{ token: 'keyword', values: ['class', 'extends'] }, { token: 'default' }],
			[{ token: 'operator', values: [':'] }, utils.whitespace]
		],

		between: [
			{ opener: { token: 'keyword', values: ['implements'] }, closer: { token: 'punctuation', values: ['{'] } }
		]
	},

	operators: [
		//arithmetic
		'++', '+=', '+',
		'--', '-=', '-',
		      '*=', '*',
		      '/=', '/',
		      '%=', '%',

		//boolean
		'&&=', '&&',
		'||=', '||',

		//bitwise
		'|=',   '|',
		'&=',   '&',
		'^=',   '^',
		'>>>=', '>>>', '>>=', '>>',
		'<<=', '<<',

		//inequality
		'<=', '<',
		'>=', '>',
		'===', '==', '!==', '!=',

		//unary
		'!', '~',

		//other
		'::', '?', ':', '.', '='
	]
};
