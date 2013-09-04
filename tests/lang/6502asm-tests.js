var should = require('should'),
	sunlight = require('../../src');

describe('6502 ASM', function() {
	var highlighter = new sunlight.Highlighter();
	highlighter.register('6502asm', require('../../src/lang/6502asm'));
	var nbsp = String.fromCharCode(0xA0);

	it('label', function() {
		var highlighted = highlighter.highlight('FooBar', '6502asm').result;
		highlighted.should.equal('<span class="sunlight-6502asm"><span class="sunlight-label">FooBar</span></span>');
	});

	it('label even if it is a keyword if it starts a line', function() {
		var highlighted = highlighter.highlight('sta', '6502asm').result,
			expected = '<span class="sunlight-6502asm"><span class="sunlight-label">sta</span></span>';
		highlighted.should.equal(expected);
	});

	it('keywords', function() {
		var highlighted = highlighter.highlight('FooBar\n sta', '6502asm').result,
			expected = '<span class="sunlight-6502asm"><span class="sunlight-label">FooBar</span>\n' + nbsp + '<span class="sunlight-keyword">sta</span></span>';
		highlighted.should.equal(expected);
	});

	it('comments', function() {
		var highlighted = highlighter.highlight('; lolz', '6502asm').result,
			expected = '<span class="sunlight-6502asm"><span class="sunlight-comment">;' + nbsp + 'lolz</span></span>';
		highlighted.should.equal(expected);
	});

	it('single-quoted strings', function() {
		var highlighted = highlighter.highlight('\'foo\'', '6502asm').result,
			expected = '<span class="sunlight-6502asm"><span class="sunlight-string">\'foo\'</span></span>';
		highlighted.should.equal(expected);
	});

	it('pseudo op', function() {
		var highlighted = highlighter.highlight('Foo\n .byte', '6502asm').result,
			expected = '<span class="sunlight-6502asm"><span class="sunlight-label">Foo</span>\n' +
				nbsp + '<span class="sunlight-punctuation">.</span>' +
				'<span class="sunlight-pseudoOp">byte</span></span>';
		highlighted.should.equal(expected);
	});

	it('constant', function() {
		var highlighted = highlighter.highlight('Foo\n ldy #PLAYERAREAHEIGHT', '6502asm').result,
			expected = '<span class="sunlight-6502asm"><span class="sunlight-label">Foo</span>\n' +
				nbsp + '<span class="sunlight-keyword">ldy</span>' + nbsp +
				'<span class="sunlight-constant">#PLAYERAREAHEIGHT</span></span>';
		highlighted.should.equal(expected);
	});

	it('constant with nested brackets and parens', function() {
		var highlighted = highlighter.highlight('#<[3.[14] * (1(0))0]', '6502asm').result,
			expected = '<span class="sunlight-6502asm"><span class="sunlight-constant">#<[3.[14]' + nbsp + '*' + nbsp + '(1(0))0]</span></span>';
		highlighted.should.equal(expected);
	});

	it('number', function() {
		var highlighted = highlighter.highlight('$2C', '6502asm').result,
			expected = '<span class="sunlight-6502asm"><span class="sunlight-number">$2C</span></span>';
		highlighted.should.equal(expected);
	});
});