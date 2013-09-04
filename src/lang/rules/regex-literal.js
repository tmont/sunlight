/**
 * JavaScript-style regular expression literal (e.g. /[a-z]+/gi)
 */
module.exports = function(context) {
	var peek = context.reader.peek();

	if (context.reader.current() !== '/' || peek === '/' || peek === '*') {
		//doesn't start with a / or starts with // (comment) or /* (multi line comment)
		return null;
	}

	var isValid = function() {
		var previousNonWsToken = context.token(context.count() - 1),
			previousToken = null;

		if (context.defaultData.text !== '') {
			previousToken = context.createToken('default', context.defaultData.text);
		}

		if (!previousToken) {
			previousToken = previousNonWsToken;
		}

		//first token of the string
		if (previousToken === undefined) {
			return true;
		}

		//since JavaScript doesn't require statement terminators, if the previous token was whitespace and contained a newline, then we're good
		if (previousToken.name === 'default' && previousToken.value.indexOf('\n') > -1) {
			return true;
		}

		if (utils.contains(['keyword', 'ident', 'number'], previousNonWsToken.name)) {
			return false;
		}
		if (previousNonWsToken.name === 'punctuation' && !utils.contains(['(', '{', '[', ',', ';'], previousNonWsToken.value)) {
			return false;
		}

		return true;
	}();

	if (!isValid) {
		return null;
	}

	//read the regex literal
	var regexLiteral = '/',
		next,
		line = context.reader.getLine(),
		column = context.reader.getColumn();

	while (context.reader.peek() !== context.reader.EOF) {
		var peek2 = context.reader.peek(2);
		if (peek2 === '\\/' || peek2 === '\\\\') {
			//escaped backslash or escaped forward slash
			regexLiteral += context.reader.read(2);
			continue;
		}

		regexLiteral += (next = context.reader.read());
		if (next === '/') {
			break;
		}
	}

	//read the regex modifiers
	//only 'g', 'i' and 'm' are allowed, but for the sake of simplicity
	//we'll just say any alphabetical character is valid
	while (context.reader.peek() !== context.reader.EOF) {
		if (!/[A-Za-z]/.test(context.reader.peek())) {
			break;
		}

		regexLiteral += context.reader.read();
	}

	return context.createToken('regexLiteral', regexLiteral, line, column);
};