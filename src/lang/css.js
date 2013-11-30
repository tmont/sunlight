var utils = require('../util'),
	scopes = require('./rules/scopes');
	
function peekSelectorToken(context) {
	//make sure it's not part of a property value
	//basically if we run into "{" before "}" it's bad
	var token,
		index = context.count(),
		value = '',
		appendToValue = true,
		count = 1,
		peek;

	while ((token = context.token(--index)) !== undefined) {
		if (token.name === 'punctuation' && token.value === '}') {
			break;
		} else if (token.name === 'punctuation' && token.value === '{') {
			return null;
		}
	}

	//now check to make sure we run into a { before a ;

	peek = context.reader.peek();
	while (peek.length === count) {
		var letter = peek.charAt(peek.length - 1);
		if (/[^\w-]$/.test(peek)) {
			appendToValue = false;

			if (letter === '{') {
				break;
			}

			if (letter === ';') {
				return null;
			}
		}

		if (appendToValue) {
			value += letter;
		}

		peek = context.reader.peek(++count);
	}

	return value;
}

module.exports = {
	caseInsensitive: true,

	customParseRules: [
		//properties
		function(context) {
			//must be preceded by "{" or ";"
			var rule = utils.createProceduralRule(context.count() - 1, -1, [
				utils.whitespace,
				{ token: 'punctuation', values: ['{', ';'] }
			]);

			if (!rule(context.getAllTokens())) {
				return null;
			}

			//must be followed by a colon
			var data = context.reader.readRegex(/^([-\w]+)\s*:/, 1);
			if (!data) {
				return null;
			}

			return context.createToken('keyword', data.value, data.line, data.column);
		},

		//functions
		function(context) {
			var data = context.reader.readRegex(/^([-\w]+)\s*\(/, 1);
			if (!data) {
				return null;
			}


			return context.createToken('function', data.value, data.line, data.column);
		},

		//pseudo classes
		function(context) {
			//must be preceded by a ":", and then anything but a keyword (property)
			var previousToken = utils.getPreviousNonWsToken(context.getAllTokens(), context.count());
			if (!previousToken || previousToken.name !== 'operator' || previousToken.value !== ':') {
				return null;
			}

			previousToken = utils.getPreviousNonWsToken(context.getAllTokens(), previousToken.index);
			if (previousToken && previousToken.name === 'keyword') {
				return null;
			}

			var data = context.reader.readRegex(/^[-\w]+/);
			if (!data) {
				return null;
			}

			return context.createToken('pseudo-class', data.value, data.line, data.column);
		},

		//classes
		function(context) {
			var className,
				line = context.reader.getLine(),
				column = context.reader.getColumn();

			//we can't just make this a scope because we'll get false positives for things like '.png' in url(image.png) (image.png doesn't need to be in quotes)
			//so we detect them the hard way

			if (context.reader.current() !== '.') {
				return null;
			}

			className = peekSelectorToken(context);
			if (className === null) {
				return null;
			}

			context.reader.read(className.length);
			return [
				context.createToken('operator', '.', line, column),
				context.createToken('class', className, line, column + 1)
			];
		},

		//element selectors (div, html, body, etc.)
		function(context) {
			var current = context.reader.current(),
				prevToken,
				tagName,
				line = context.reader.getLine(),
				column = context.reader.getColumn();

			if (!/[A-Za-z_]/.test(current)) {
				return null;
			}

			prevToken = utils.getPreviousNonWsToken(context.getAllTokens(), context.count());
			if (prevToken && prevToken.name === 'operator' && (prevToken.value === ':' || prevToken.value === '::')) {
				return null;
			}

			tagName = peekSelectorToken(context);
			if (tagName === null) {
				return null;
			}

			context.reader.read(tagName.length);
			return context.createToken('element', current + tagName, line, column);
		},

		//hex color value
		function(context) {
			var peek,
				count = 1,
				value = '#',
				letter,
				validHex = true,
				line = context.reader.getLine(),
				column = context.reader.getColumn();

			if (context.reader.current() !== '#') {
				return null;
			}

			//must be between ":" and ";"
			//basically if we run into a "{" before a "} it's bad

			peek = context.reader.peek();
			while (peek.length === count) {
				letter = peek.charAt(peek.length - 1);
				if (letter === '}' || letter === ';') {
					break;
				}
				if (letter === '{') {
					return null;
				}
				if (validHex && /[A-Fa-f0-9]/.test(letter)) {
					value += letter;
				} else {
					validHex = false;
				}

				peek = context.reader.peek(++count);
			}

			context.reader.read(value.length - 1); //-1 because we already read the "#"
			return context.createToken('hex-color', value, line, column);
		}
	],

	//same as default, but allows %
	numberParser: function(context) {
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

		while ((peek = context.reader.peek()) !== context.reader.EOF) {
			if (!/[A-Za-z0-9%]/.test(peek)) {
				if (peek === '.' && allowDecimal && /\d$/.test(context.reader.peek(2))) {
					number += context.reader.read();
					allowDecimal = false;
					continue;
				}

				break;
			}

			number += context.reader.read();
		}

		return context.createToken('number', number, line, column);
	},

	customTokens: {
		'ms-filter-prefix': {
			values: [ 'progid:DXImageTransform.Microsoft' ],
			boundary: '\\b'
		},

		'important-flag': {
			values: [ '!important' ],
			boundary: '\\b'
		}
	},

	scopes: {
		string: [ scopes.singleQuotedString, scopes.doubleQuotedString ],
		comment: [ scopes.slashStarMultiLineComment ],
		id: [ ['#', { length: 1, regex: /[^-\w]/ }, null, true ] ],
		variable: [ ['@', { length: 1, regex: /[^-\w]/ }, null, true ] ]
	},

	identFirstLetter: /[A-Za-z-]/,
	identAfterFirstLetter: /[\w-]/,

	operators: [
		'::', ':', '>', '+', '~=', '^=', '$=', '|=', '=', '.', '*'
	]
};
