var should = require('should'),
	sunlight = require('../../src');

describe('Actionscript', function() {
	var highlighter = new sunlight.Highlighter();
	highlighter.register('actionscript', require('../../src/lang/actionscript'));
	var nbsp = String.fromCharCode(0xA0);

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

	it('global functions', function() {
		var highlighted = highlighter.highlight('decodeURI()', 'actionscript').result;
		var expected = '<span class="actionscript">' +
			'<span class="globalFunction">decodeURI</span>' +
			'<span class="punctuation">(</span>' +
			'<span class="punctuation">)</span>' +
			'</span>';
		highlighted.should.equal(expected);
	});

	it('global function preceded by "new" is not a function', function() {
		var highlighted = highlighter.highlight('new decodeURI()', 'actionscript').result;
		var expected = '<span class="actionscript">' +
			'<span class="keyword">new</span>' + nbsp +
			'<span class="named-ident">decodeURI</span>' +
			'<span class="punctuation">(</span>' +
			'<span class="punctuation">)</span>' +
			'</span>';
		highlighted.should.equal(expected);
	});

	it('global function preceded by a colon is not a function', function() {
		var highlighted = highlighter.highlight(':decodeURI()', 'actionscript').result;
		var expected = '<span class="actionscript">' +
			'<span class="operator">:</span>' +
			'<span class="named-ident">decodeURI</span>' +
			'<span class="punctuation">(</span>' +
			'<span class="punctuation">)</span>' +
			'</span>';
		highlighted.should.equal(expected);
	});

	it('global function must be followed by an open paren', function() {
		var highlighted = highlighter.highlight('decodeURI', 'actionscript').result;
		var expected = '<span class="actionscript">' +
			'<span class="ident">decodeURI</span>' +
			'</span>';
		highlighted.should.equal(expected);
	});

	it('regex literal', function() {
		var highlighted = highlighter.highlight('/foo/', 'actionscript').result;
		var expected = '<span class="actionscript">' +
			'<span class="regexLiteral">/foo/</span>' +
			'</span>';
		highlighted.should.equal(expected);
	});

	it('idents can start with an underscore', function() {
		var highlighted = highlighter.highlight('_foo', 'actionscript').result;
		var expected = '<span class="actionscript">' +
			'<span class="ident">_foo</span>' +
			'</span>';
		highlighted.should.equal(expected);
	});

	it('single quoted strings', function() {
		var highlighted = highlighter.highlight('\'foo\'', 'actionscript').result;
		var expected = '<span class="actionscript">' +
			'<span class="string">\'foo\'</span>' +
			'</span>';
		highlighted.should.equal(expected);
	});

	it('double quoted strings', function() {
		var highlighted = highlighter.highlight('"foo"', 'actionscript').result;
		var expected = '<span class="actionscript">' +
			'<span class="string">"foo"</span>' +
			'</span>';
		highlighted.should.equal(expected);
	});

	it('single-line comments', function() {
		var highlighted = highlighter.highlight('//lolz', 'actionscript').result;
		var expected = '<span class="actionscript">' +
			'<span class="comment">//lolz</span>' +
			'</span>';
		highlighted.should.equal(expected);
	});

	it('block comments', function() {
		var highlighted = highlighter.highlight('/*\nfoo\n*/', 'actionscript').result;
		var expected = '<span class="actionscript">' +
			'<span class="comment">/*\nfoo\n*/</span>' +
			'</span>';
		highlighted.should.equal(expected);
	});

	it.skip('varargs', function() {
		var highlighted = highlighter.highlight('function foo(...args:*) {}', 'actionscript').result;
		var expected = '<span class="actionscript">' +
			'<span class="keyword">function</span>' + nbsp +
			'<span class="named-ident">foo</span>' +
			'<span class="punctuation">(</span>' +
			'<span class="varargs">...</span>' +
			'<span class="ident">args</span>' +
			'<span class="operator">:</span>' +
			'<span class="operator">*</span>' + nbsp +
			'<span class="punctuation">{</span>' +
			'<span class="punctuation">}</span>' +
			'</span>';
		highlighted.should.equal(expected);
	});

	it.skip('native xml', function() {});
});