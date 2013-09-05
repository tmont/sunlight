var should = require('should'),
	sunlight = require('../../src');

describe('Brainfuck', function() {
	var highlighter = new sunlight.Highlighter();
	highlighter.register('brainfuck', require('../../src/lang/brainfuck'));
	var nbsp = String.fromCharCode(0xA0);

	it('increment', function() {
		var highlighted = highlighter.highlight('>', 'brainfuck').result,
			expected = '<span class="brainfuck">' +
				'<span class="increment">&gt;</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('incrementPointer', function() {
		var highlighted = highlighter.highlight('+', 'brainfuck').result,
			expected = '<span class="brainfuck">' +
				'<span class="incrementPointer">+</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('decrement', function() {
		var highlighted = highlighter.highlight('<', 'brainfuck').result,
			expected = '<span class="brainfuck">' +
				'<span class="decrement">&lt;</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('decrementPointer', function() {
		var highlighted = highlighter.highlight('-', 'brainfuck').result,
			expected = '<span class="brainfuck">' +
				'<span class="decrementPointer">-</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('read', function() {
		var highlighted = highlighter.highlight(',', 'brainfuck').result,
			expected = '<span class="brainfuck">' +
				'<span class="read">,</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('write', function() {
		var highlighted = highlighter.highlight('.', 'brainfuck').result,
			expected = '<span class="brainfuck">' +
				'<span class="write">.</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('openLoop', function() {
		var highlighted = highlighter.highlight('[', 'brainfuck').result,
			expected = '<span class="brainfuck">' +
				'<span class="openLoop">[</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('closeLoop', function() {
		var highlighted = highlighter.highlight(']', 'brainfuck').result,
			expected = '<span class="brainfuck">' +
				'<span class="closeLoop">]</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});
});