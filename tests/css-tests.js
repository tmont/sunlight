var harness = require('./harness');

harness('css', function(expect, nbsp) {
	it('property under selector', function() {
		expect('a { foo: bar; }', [
			[ 'element', 'a' ],
			nbsp,
			[ 'punctuation', '{' ],
			nbsp,
			[ 'keyword', 'foo' ],
			[ 'operator', ':' ],
			nbsp,
			[ 'ident', 'bar' ],
			[ 'punctuation', ';' ],
			nbsp,
			[ 'punctuation', '}' ]
		]);
	});

	it('hex color', function() {
		expect('a { foo: #0afe45; }', [
			[ 'element', 'a' ],
			nbsp,
			[ 'punctuation', '{' ],
			nbsp,
			[ 'keyword', 'foo' ],
			[ 'operator', ':' ],
			nbsp,
			[ 'hex-color', '#0afe45' ],
			[ 'punctuation', ';' ],
			nbsp,
			[ 'punctuation', '}' ]
		]);
	});

	it('percentage', function() {
		expect('a { foo: 20%; }', [
			[ 'element', 'a' ],
			nbsp,
			[ 'punctuation', '{' ],
			nbsp,
			[ 'keyword', 'foo' ],
			[ 'operator', ':' ],
			nbsp,
			[ 'number', '20%' ],
			[ 'punctuation', ';' ],
			nbsp,
			[ 'punctuation', '}' ]
		]);
	});

	it('MS filter prefix with function', function() {
		expect('a { foo: progid:DXImageTransform.Microsoft.foobar(10); }', [
			[ 'element', 'a' ],
			nbsp,
			[ 'punctuation', '{' ],
			nbsp,
			[ 'keyword', 'foo' ],
			[ 'operator', ':' ],
			nbsp,
			[ 'ms-filter-prefix', 'progid:DXImageTransform.Microsoft' ],
			[ 'operator', '.' ],
			[ 'function', 'foobar' ],
			[ 'punctuation', '(' ],
			[ 'number', '10' ],
			[ 'punctuation', ')' ],
			[ 'punctuation', ';' ],
			nbsp,
			[ 'punctuation', '}' ]
		]);
	});

	it('class selectors', function() {
		expect('.foo { color: white; }', [
			[ 'operator', '.' ],
			[ 'class', 'foo' ],
			nbsp,
			[ 'punctuation', '{' ],
			nbsp,
			[ 'keyword', 'color' ],
			[ 'operator', ':' ],
			nbsp,
			[ 'ident', 'white' ],
			[ 'punctuation', ';' ],
			nbsp,
			[ 'punctuation', '}' ]
		]);
	});

	it('id selectors', function() {
		expect('#foo { color: white; }', [
			[ 'id', '#foo' ],
			nbsp,
			[ 'punctuation', '{' ],
			nbsp,
			[ 'keyword', 'color' ],
			[ 'operator', ':' ],
			nbsp,
			[ 'ident', 'white' ],
			[ 'punctuation', ';' ],
			nbsp,
			[ 'punctuation', '}' ]
		]);
	});

	it('double-quoted strings', function() {
		expect('a { color: "white"; }', [
			[ 'element', 'a' ],
			nbsp,
			[ 'punctuation', '{' ],
			nbsp,
			[ 'keyword', 'color' ],
			[ 'operator', ':' ],
			nbsp,
			[ 'string', '"white"' ],
			[ 'punctuation', ';' ],
			nbsp,
			[ 'punctuation', '}' ]
		]);
	});

	it('single-quoted strings', function() {
		expect('a { color: \'white\'; }', [
			[ 'element', 'a' ],
			nbsp,
			[ 'punctuation', '{' ],
			nbsp,
			[ 'keyword', 'color' ],
			[ 'operator', ':' ],
			nbsp,
			[ 'string', '\'white\'' ],
			[ 'punctuation', ';' ],
			nbsp,
			[ 'punctuation', '}' ]
		]);
	});

	it('comments', function() {
		expect('a /*comment*/ { color: white; }', [
			[ 'element', 'a' ],
			nbsp,
			[ 'comment', '/*comment*/' ],
			nbsp,
			[ 'punctuation', '{' ],
			nbsp,
			[ 'keyword', 'color' ],
			[ 'operator', ':' ],
			nbsp,
			[ 'ident', 'white' ],
			[ 'punctuation', ';' ],
			nbsp,
			[ 'punctuation', '}' ]
		]);
	});

	it('!important flag', function() {
		expect('a { color: white !important; }', [
			[ 'element', 'a' ],
			nbsp,
			[ 'punctuation', '{' ],
			nbsp,
			[ 'keyword', 'color' ],
			[ 'operator', ':' ],
			nbsp,
			[ 'ident', 'white' ],
			nbsp,
			[ 'important-flag', '!important' ],
			[ 'punctuation', ';' ],
			nbsp,
			[ 'punctuation', '}' ]
		]);
	});

	it('function argument', function() {
		expect('a { background-image: url(foo.png); }', [
			[ 'element', 'a' ],
			nbsp,
			[ 'punctuation', '{' ],
			nbsp,
			[ 'keyword', 'background-image' ],
			[ 'operator', ':' ],
			nbsp,
			[ 'function', 'url' ],
			[ 'punctuation', '(' ],
			[ 'ident', 'foo' ],
			[ 'operator', '.' ],
			[ 'ident', 'png' ],
			[ 'punctuation', ')' ],
			[ 'punctuation', ';' ],
			nbsp,
			[ 'punctuation', '}' ]
		]);
	});

	it('less variables/@-rules', function() {
		expect('@import foo; a { color: @white; }', [
			[ 'variable', '@import' ],
			nbsp,
			[ 'ident', 'foo' ],
			[ 'punctuation', ';' ],
			nbsp,
			[ 'element', 'a' ],
			nbsp,
			[ 'punctuation', '{' ],
			nbsp,
			[ 'keyword', 'color' ],
			[ 'operator', ':' ],
			nbsp,
			[ 'variable', '@white' ],
			[ 'punctuation', ';' ],
			nbsp,
			[ 'punctuation', '}' ]
		]);
	});
});