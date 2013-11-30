var should = require('should'),
	sunlight = require('../');

describe('Bash', function() {
	var highlighter = new sunlight.Highlighter();
	highlighter.register('bash', require('../src/lang/bash'));
	var nbsp = String.fromCharCode(0xA0);

	it('keywords', function() {
		var highlighted = highlighter.highlight('while', 'bash').result,
			expected = '<span class="bash">' +
				'<span class="keyword">while</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('commands', function() {
		var highlighted = highlighter.highlight('md5sum', 'bash').result,
			expected = '<span class="bash">' +
				'<span class="command">md5sum</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	describe('special variables', function() {
		[ '$$', '$?', '$#' ].forEach(function(variable) {
			it(variable, function() {
				var highlighted = highlighter.highlight(variable, 'bash').result,
					expected = '<span class="bash">' +
						'<span class="specialVariable">' + variable + '</span>' +
						'</span>';
				highlighted.should.equal(expected);
			});
		});
	});

	it('single quoted string', function() {
		var highlighted = highlighter.highlight('\'foo\'', 'bash').result,
			expected = '<span class="bash">' +
				'<span class="string">\'foo\'</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('double quoted string', function() {
		var highlighted = highlighter.highlight('"foo"', 'bash').result,
			expected = '<span class="bash">' +
				'<span class="string">"foo"</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('hashbang', function() {
		var highlighted = highlighter.highlight('#!/bin/sh', 'bash').result,
			expected = '<span class="bash">' +
				'<span class="hashBang">#!/bin/sh</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('comments', function() {
		var highlighted = highlighter.highlight('#foo', 'bash').result,
			expected = '<span class="bash">' +
				'<span class="comment">#foo</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('verbatim command', function() {
		var highlighted = highlighter.highlight('`ls`', 'bash').result,
			expected = '<span class="bash">' +
				'<span class="verbatimCommand">`ls`</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('variable', function() {
		var highlighted = highlighter.highlight('$foo', 'bash').result,
			expected = '<span class="bash">' +
				'<span class="variable">$foo</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('variable that starts with a number', function() {
		var highlighted = highlighter.highlight('$1', 'bash').result,
			expected = '<span class="bash">' +
				'<span class="variable">$1</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('functions', function() {
		var highlighted = highlighter.highlight('foo () {', 'bash').result,
			expected = '<span class="bash">' +
				'<span class="named-ident">foo</span>' + nbsp +
				'<span class="punctuation">(</span>' +
				'<span class="punctuation">)</span>' + nbsp +
				'<span class="punctuation">{</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('operators and numbers and idents', function() {
		var highlighted = highlighter.highlight('4 + five', 'bash').result,
			expected = '<span class="bash">' +
				'<span class="number">4</span>' + nbsp +
				'<span class="operator">+</span>' + nbsp +
				'<span class="ident">five</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it.skip('variables with braces', function() {
		var highlighted = highlighter.highlight('${foo}', 'bash').result,
			expected = '<span class="bash">' +
				'<span class="variable">${foo}</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});
});