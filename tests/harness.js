var should = require('should'),
	sunlight = require('../'),
	nbsp = String.fromCharCode(0xA0);

module.exports = function(language, test) {
	describe(language, function() {
		var highlighter = new sunlight.Highlighter();
		highlighter.register(language, require('../src/lang/' + language));

		function encode(value) {
			return value && value.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;');
		}

		function expect(code, tokens) {
			var result = highlighter.highlight(code, language).result;
			var expected = '<span class="' + language + '">' +
				tokens.map(function(token) {
					if (typeof(token) === 'string') {
						return token;
					}

					return '<span class="' + token[0] + '">' + encode(token[1]) + '</span>';
				}).join('') +
				'</span>';

			result.should.equal(expected);
		}

		test(expect, nbsp, highlighter, should);
	});
};