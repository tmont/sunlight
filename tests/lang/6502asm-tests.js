var should = require('should'),
	sunlight = require('../../src');

describe('6502 ASM', function() {
	var highlighter = new sunlight.Highlighter();
	highlighter.register('6502asm', require('../../src/lang/6502asm'));
	var nbsp = String.fromCharCode(0xA0);

	it('should highlight labels', function() {
		var highlighted = highlighter.highlight('FooBar', '6502asm').result;
		highlighted.should.equal('<span class="sunlight-6502asm"><span class="sunlight-label">FooBar</span></span>');
	});

	it('should highlight keywords', function() {
		var highlighted = highlighter.highlight('FooBar\n  sta', '6502asm').result,
			expected = '<span class="sunlight-6502asm"><span class="sunlight-label">FooBar</span>\n' + nbsp + nbsp + '<span class="sunlight-keyword">sta</span></span>';
		highlighted.should.equal(expected);
	});

	it('should highlight comments', function() {
		var highlighted = highlighter.highlight('; lolz', '6502asm').result,
			expected = '<span class="sunlight-6502asm"><span class="sunlight-comment">;' + nbsp + 'lolz</span></span>';
		highlighted.should.equal(expected);
	});
});