function CodeReader(text) {
	this.text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n'); //normalize line endings to unix;
	this.length = text.length;
	this.index = 0;
	this.line = 1;
	this.column = 1;
	this.currentChar = this.length > 0 ? this.text.charAt(0) : CodeReader.EOF;
	this.nextReadBeginsLine = false;
}

CodeReader.EOF = undefined;

CodeReader.prototype = {
	getCharacters: function getCharacters(count) {
		var value;
		if (count === 0) {
			return '';
		}

		count = count || 1;

		value = this.text.substring(this.index + 1, this.index + count + 1);
		return value === '' ? CodeReader.EOF : value;
	},

	toString: function() {
		return 'length: ' + this.length + ', index: ' + this.index + ', line: ' + this.line + ', column: ' + this.column + ', current: [' + this.currentChar + ']';
	},

	peek: function(count) {
		return this.getCharacters(count);
	},

	substring: function() {
		return this.text.substring(this.index);
	},

	peekSubstring: function() {
		return this.text.substring(this.index + 1);
	},

	read: function(count) {
		var value = this.getCharacters(count),
			newlineCount,
			lastChar;

		if (value === '') {
			//this is a result of reading/peeking/doing nothing
			return value;
		}

		if (value !== CodeReader.EOF) {
			//advance index
			this.index += value.length;
			this.column += value.length;

			//update line count
			if (this.nextReadBeginsLine) {
				this.line++;
				this.column = 1;
				this.nextReadBeginsLine = false;
			}

			newlineCount = value.substring(0, value.length - 1).replace(/[^\n]/g, '').length;
			if (newlineCount > 0) {
				this.line += newlineCount;
				this.column = 1;
			}

			lastChar = utils.last(value);
			if (lastChar === "\n") {
				this.nextReadBeginsLine = true;
			}

			this.currentChar = lastChar;
		} else {
			this.index = this.length;
			this.currentChar = CodeReader.EOF;
		}

		return value;
	},

	getText: function() {
		return this.text;
	},

	getLine: function() {
		return this.line;
	},
	getColumn: function() {
		return this.column;
	},
	isEof: function() {
		return this.index >= this.length;
	},
	isSol: function() {
		return this.column === 1;
	},
	isSolWs: function() {
		var temp = this.index, c;
		if (this.column === 1) {
			return true;
		}

		//look backward until we find a newline or a non-whitespace character
		while ((c = this.text.charAt(--temp)) !== '') {
			if (c === '\n') {
				return true;
			}
			if (!/\s/.test(c)) {
				return false;
			}
		}

		return true;
	},
	isEol: function() {
		return this.nextReadBeginsLine;
	},
	current: function() {
		return this.currentChar;
	}
};

module.exports = CodeReader;