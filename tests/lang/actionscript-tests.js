var should = require('should'),
	sunlight = require('../../src');

describe('Actionscript', function() {
	var highlighter = new sunlight.Highlighter();
	highlighter.register('actionscript', require('../../src/lang/actionscript'));
	var nbsp = String.fromCharCode(0xA0);

	it('single line comments', function() {
		var highlighted = highlighter.highlight('//lolz', 'actionscript').result;
		highlighted.should.equal('<span class="actionscript"><span class="comment">//lolz</span></span>');
	});

	it('keywords', function() {
		var highlighted = highlighter.highlight('package', 'actionscript').result;
		highlighted.should.equal('<span class="actionscript"><span class="keyword">package</span></span>');
	});

	it('named ident after import statement', function() {
		var highlighted = highlighter.highlight('import foo.bar', 'actionscript').result;
		var expected = '<span class="actionscript">' +
			'<span class="keyword">import</span>' + nbsp +
			'<span class="ident">foo</span>' +
			'<span class="operator">.</span>' +
			'<span class="named-ident">bar</span>' +
			'</span>';
		highlighted.should.equal(expected);
	});

	it('named ident after class keyword', function() {
		var highlighted = highlighter.highlight('class Foo', 'actionscript').result;
		var expected = '<span class="actionscript">' +
			'<span class="keyword">class</span>' + nbsp +
			'<span class="named-ident">Foo</span>' +
			'</span>';
		highlighted.should.equal(expected);
	});

	it('named ident after implements keyword', function() {
		var highlighted = highlighter.highlight('implements Bar {', 'actionscript').result;
		var expected = '<span class="actionscript">' +
			'<span class="keyword">implements</span>' + nbsp +
			'<span class="named-ident">Bar</span>' + nbsp +
			'<span class="punctuation">{</span>' +
			'</span>';
		highlighted.should.equal(expected);
	});

	it('named ident after is keyword', function() {
		var highlighted = highlighter.highlight('foo is Bar', 'actionscript').result;
		var expected = '<span class="actionscript">' +
			'<span class="ident">foo</span>' + nbsp +
			'<span class="keyword">is</span>' + nbsp +
			'<span class="named-ident">Bar</span>' +
			'</span>';
		highlighted.should.equal(expected);
	});

	it('named ident after instanceof keyword', function() {
		var highlighted = highlighter.highlight('foo instanceof Bar', 'actionscript').result;
		var expected = '<span class="actionscript">' +
			'<span class="ident">foo</span>' + nbsp +
			'<span class="keyword">instanceof</span>' + nbsp +
			'<span class="named-ident">Bar</span>' +
			'</span>';
		highlighted.should.equal(expected);
	});

	it('named ident after new keyword', function() {
		var highlighted = highlighter.highlight('new Bar', 'actionscript').result;
		var expected = '<span class="actionscript">' +
			'<span class="keyword">new</span>' + nbsp +
			'<span class="named-ident">Bar</span>' +
			'</span>';
		highlighted.should.equal(expected);
	});

	it('named ident after extends keyword', function() {
		var highlighted = highlighter.highlight('Bar extends Baz', 'actionscript').result;
		var expected = '<span class="actionscript">' +
			'<span class="ident">Bar</span>' + nbsp +
			'<span class="keyword">extends</span>' + nbsp +
			'<span class="named-ident">Baz</span>' +
			'</span>';
		highlighted.should.equal(expected);
	});

	it('named ident for typehints', function() {
		var highlighted = highlighter.highlight('foo:Bar', 'actionscript').result;
		var expected = '<span class="actionscript">' +
			'<span class="ident">foo</span>' +
			'<span class="operator">:</span>' +
			'<span class="named-ident">Bar</span>' +
			'</span>';
		highlighted.should.equal(expected);
	});
});