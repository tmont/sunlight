var should = require('should'),
	sunlight = require('../../src');

describe('C#', function() {
	var highlighter = new sunlight.Highlighter();
	highlighter.register('csharp', require('../../src/lang/csharp'));
	var nbsp = String.fromCharCode(0xA0);

	it('using statement', function() {
		var highlighted = highlighter.highlight('using System;', 'csharp').result,
			expected = '<span class="csharp">' +
				'<span class="keyword">using</span>' + nbsp +
				'<span class="ident">System</span>' +
				'<span class="punctuation">;</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('using statement with alias', function() {
		var highlighted = highlighter.highlight('using Foo = System.Linq.Enumerable;', 'csharp').result,
			expected = '<span class="csharp">' +
				'<span class="keyword">using</span>' + nbsp +
				'<span class="named-ident">Foo</span>' + nbsp +
				'<span class="operator">=</span>' + nbsp +
				'<span class="ident">System</span>' +
				'<span class="operator">.</span>' +
				'<span class="ident">Linq</span>' +
				'<span class="operator">.</span>' +
				'<span class="named-ident">Enumerable</span>' +
				'<span class="punctuation">;</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('namespace', function() {
		var highlighted = highlighter.highlight('namespace Foo.Bar {}', 'csharp').result,
			expected = '<span class="csharp">' +
				'<span class="keyword">namespace</span>' + nbsp +
				'<span class="ident">Foo</span>' +
				'<span class="operator">.</span>' +
				'<span class="ident">Bar</span>' + nbsp +
				'<span class="punctuation">{</span>' +
				'<span class="punctuation">}</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	[ 'class', 'delegate', 'event', 'struct', 'enum', 'interface' ].forEach(function(type) {
		it(type + ' name', function() {
			var highlighted = highlighter.highlight(type + ' Foo {}', 'csharp').result,
				expected = '<span class="csharp">' +
					'<span class="keyword">' + type + '</span>' + nbsp +
					'<span class="named-ident">Foo</span>' + nbsp +
					'<span class="punctuation">{</span>' +
					'<span class="punctuation">}</span>' +
					'</span>';
			highlighted.should.equal(expected);
		});
	});

	it('params', function() {
		var highlighted = highlighter.highlight('void Foo(params Foo[] foos) {}', 'csharp').result,
			expected = '<span class="csharp">' +
				'<span class="keyword">void</span>' + nbsp +
				'<span class="ident">Foo</span>' +
				'<span class="punctuation">(</span>' +
				'<span class="keyword">params</span>' + nbsp +
				'<span class="named-ident">Foo</span>' +
				'<span class="punctuation">[</span>' +
				'<span class="punctuation">]</span>' + nbsp +
				'<span class="ident">foos</span>' +
				'<span class="punctuation">)</span>' + nbsp +
				'<span class="punctuation">{</span>' +
				'<span class="punctuation">}</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('generic class with interfaces and type constraint', function() {
		var highlighted = highlighter.highlight('abstract class Foo<in T1, out T2> : Bar, IBaz where T1 : IFoo {}', 'csharp').result,
			expected = '<span class="csharp">' +
				'<span class="keyword">abstract</span>' + nbsp +
				'<span class="keyword">class</span>' + nbsp +
				'<span class="named-ident">Foo</span>' +
				'<span class="operator">&lt;</span>' +
				'<span class="keyword">in</span>' + nbsp +
				'<span class="ident">T1</span>' +
				'<span class="punctuation">,</span>' + nbsp +
				'<span class="keyword">out</span>' + nbsp +
				'<span class="ident">T2</span>' +
				'<span class="operator">&gt;</span>' + nbsp +
				'<span class="operator">:</span>' + nbsp +
				'<span class="named-ident">Bar</span>' +
				'<span class="punctuation">,</span>' + nbsp +
				'<span class="named-ident">IBaz</span>' + nbsp +
				'<span class="keyword">where</span>' + nbsp +
				'<span class="ident">T1</span>' + nbsp +
				'<span class="operator">:</span>' + nbsp +
				'<span class="named-ident">IFoo</span>' + nbsp +
				'<span class="punctuation">{</span>' +
				'<span class="punctuation">}</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

});