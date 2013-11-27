var should = require('should'),
	sunlight = require('../../src');

describe('C++', function() {
	var highlighter = new sunlight.Highlighter();
	highlighter.register('cpp', require('../../src/lang/c++'));
	var nbsp = String.fromCharCode(0xA0);

	it('keywords', function() {
		var highlighted = highlighter.highlight('while', 'cpp').result,
			expected = '<span class="cpp">' +
				'<span class="keyword">while</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	describe('constants', function() {
		var constants = [
			'EXIT_SUCCESS', 'EXIT_FAILURE',
			'SIG_DFL', 'SIG_IGN', 'SIG_ERR', 'SIGABRT', 'SIGFPE', 'SIGILL',
			'SIGINT', 'SIGSEGV', 'SIGTERM'
		];

		constants.forEach(function(constant) {
			it(constant, function() {
				var highlighted = highlighter.highlight(constant, 'cpp').result,
					expected = '<span class="cpp">' +
						'<span class="constant">' + constant + '</span>' +
						'</span>';
				highlighted.should.equal(expected);
			});
		});
	});

	describe('basic types', function() {
		['ptrdiff_t', 'size_t', 'nullptr_t', 'max_align_t'].forEach(function(basicType) {
			it(basicType, function() {
				var highlighted = highlighter.highlight(basicType, 'cpp').result,
					expected = '<span class="cpp">' +
						'<span class="basicType">' + basicType + '</span>' +
						'</span>';
				highlighted.should.equal(expected);
			});
		});
	});

	it('ellipsis', function() {
		var highlighted = highlighter.highlight('...', 'cpp').result,
			expected = '<span class="cpp">' +
				'<span class="ellipsis">...</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('double-quoted strings', function() {
		var highlighted = highlighter.highlight('"foo"', 'cpp').result,
			expected = '<span class="cpp">' +
				'<span class="string">"foo"</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('chars', function() {
		var highlighted = highlighter.highlight('\'c\'', 'cpp').result,
			expected = '<span class="cpp">' +
				'<span class="char">\'c\'</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('single-line comments', function() {
		var highlighted = highlighter.highlight('//foo', 'cpp').result,
			expected = '<span class="cpp">' +
				'<span class="comment">//foo</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('multi-line comments', function() {
		var highlighted = highlighter.highlight('/*\nfoo\n*/', 'cpp').result,
			expected = '<span class="cpp">' +
				'<span class="comment">/*\nfoo\n*/</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('preprocessor directives', function() {
		var highlighted = highlighter.highlight('#include <iostream>', 'cpp').result,
			expected = '<span class="cpp">' +
				'<span class="preprocessorDirective">#include' + nbsp + '&lt;iostream&gt;</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('enum name is a named ident', function() {
		var highlighted = highlighter.highlight('enum foo', 'cpp').result,
			expected = '<span class="cpp">' +
				'<span class="keyword">enum</span>' + nbsp +
				'<span class="named-ident">foo</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('struct name is a named ident', function() {
		var highlighted = highlighter.highlight('struct foo', 'cpp').result,
			expected = '<span class="cpp">' +
				'<span class="keyword">struct</span>' + nbsp +
				'<span class="named-ident">foo</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('union name is a named ident', function() {
		var highlighted = highlighter.highlight('union foo', 'cpp').result,
			expected = '<span class="cpp">' +
				'<span class="keyword">union</span>' + nbsp +
				'<span class="named-ident">foo</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('class name is a named ident', function() {
		var highlighted = highlighter.highlight('class foo {}', 'cpp').result,
			expected = '<span class="cpp">' +
				'<span class="keyword">class</span>' + nbsp +
				'<span class="named-ident">foo</span>' + nbsp +
				'<span class="punctuation">{</span>' +
				'<span class="punctuation">}</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('class name and generic type are named idents', function() {
		var highlighted = highlighter.highlight('nsCOMPtr<nsIConsoleService> console', 'cpp').result,
			expected = '<span class="cpp">' +
				'<span class="named-ident">nsCOMPtr</span>' +
				'<span class="operator">&lt;</span>' +
				'<span class="named-ident">nsIConsoleService</span>' +
				'<span class="operator">&gt;</span>' + nbsp +
				'<span class="ident">console</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('class name with multiple generic types are named idents', function() {
		var highlighted = highlighter.highlight('nsCOMPtr<nsIConsoleService, foo> console', 'cpp').result,
			expected = '<span class="cpp">' +
				'<span class="named-ident">nsCOMPtr</span>' +
				'<span class="operator">&lt;</span>' +
				'<span class="named-ident">nsIConsoleService</span>' +
				'<span class="operator">,</span>' + nbsp +
				'<span class="named-ident">foo</span>' +
				'<span class="operator">&gt;</span>' + nbsp +
				'<span class="ident">console</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('namespace in fully-qualified ident', function() {
		var highlighted = highlighter.highlight('std::foo', 'cpp').result,
			expected = '<span class="cpp">' +
				'<span class="named-ident">std</span>' +
				'<span class="operator">::</span>' +
				'<span class="ident">foo</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('namespace and type in fully-qualified ident declaration', function() {
		var highlighted = highlighter.highlight('std::foo bar', 'cpp').result,
			expected = '<span class="cpp">' +
				'<span class="named-ident">std</span>' +
				'<span class="operator">::</span>' +
				'<span class="named-ident">foo</span>' + nbsp +
				'<span class="ident">bar</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('namespace and type in fully-qualified method declaration', function() {
		var highlighted = highlighter.highlight('void std::foo()', 'cpp').result,
			expected = '<span class="cpp">' +
				'<span class="keyword">void</span>' + nbsp +
				'<span class="named-ident">std</span>' +
				'<span class="operator">::</span>' +
				'<span class="ident">foo</span>' +
				'<span class="punctuation">(</span>' +
				'<span class="punctuation">)</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('less than and not generic', function() {
		var highlighted = highlighter.highlight('foo < bar', 'cpp').result,
			expected = '<span class="cpp">' +
				'<span class="ident">foo</span>' + nbsp +
				'<span class="operator">&lt;</span>' + nbsp +
				'<span class="ident">bar</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('greater than and not generic', function() {
		var highlighted = highlighter.highlight('foo > bar', 'cpp').result,
			expected = '<span class="cpp">' +
				'<span class="ident">foo</span>' + nbsp +
				'<span class="operator">&gt;</span>' + nbsp +
				'<span class="ident">bar</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('generic type arguments in template declarations are not named idents', function() {
		var highlighted = highlighter.highlight('class Foo<T> {}', 'cpp').result,
			expected = '<span class="cpp">' +
				'<span class="keyword">class</span>' + nbsp +
				'<span class="named-ident">Foo</span>' +
				'<span class="operator">&lt;</span>' +
				'<span class="ident">T</span>' +
				'<span class="operator">&gt;</span>' + nbsp +
				'<span class="punctuation">{</span>' +
				'<span class="punctuation">}</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('consecutive idents', function() {
		var highlighted = highlighter.highlight('foo bar', 'cpp').result,
			expected = '<span class="cpp">' +
				'<span class="named-ident">foo</span>' + nbsp +
				'<span class="ident">bar</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	describe('function parameters', function() {
		it('named idents with references', function() {
			var highlighted = highlighter.highlight('foo &bar', 'cpp').result,
				expected = '<span class="cpp">' +
					'<span class="named-ident">foo</span>' + nbsp +
					'<span class="operator">&amp;</span>' +
					'<span class="ident">bar</span>' +
					'</span>';
			highlighted.should.equal(expected);
		});

		it('function parameter', function() {
			var highlighted = highlighter.highlight('void foo(Url url)', 'cpp').result,
				expected = '<span class="cpp">' +
					'<span class="keyword">void</span>' + nbsp +
					'<span class="ident">foo</span>' +
					'<span class="punctuation">(</span>' +
					'<span class="named-ident">Url</span>' + nbsp +
					'<span class="ident">url</span>' +
					'<span class="punctuation">)</span>' +
					'</span>';
			highlighted.should.equal(expected);
		});
	});

	describe('pointers', function() {
		it('named-idents from pointer declarations', function() {
			var highlighted = highlighter.highlight('pointer* myPointer', 'cpp').result,
				expected = '<span class="cpp">' +
					'<span class="named-ident">pointer</span>' +
					'<span class="operator">*</span>' + nbsp +
					'<span class="ident">myPointer</span>' +
					'</span>';
			highlighted.should.equal(expected);
		});

		it('named-idents from double pointer declarations', function() {
			var highlighted = highlighter.highlight('pointer** myPointer', 'cpp').result,
				expected = '<span class="cpp">' +
					'<span class="named-ident">pointer</span>' +
					'<span class="operator">**</span>' + nbsp +
					'<span class="ident">myPointer</span>' +
					'</span>';
			highlighted.should.equal(expected);
		});

		it('named-idents from pointer declarations with goofy whitespace', function() {
			var highlighted = highlighter.highlight('pointer * myPointer', 'cpp').result,
				expected = '<span class="cpp">' +
					'<span class="named-ident">pointer</span>' + nbsp +
					'<span class="operator">*</span>' + nbsp +
					'<span class="ident">myPointer</span>' +
					'</span>';
			highlighted.should.equal(expected);
		});

		it('rhs of equals sign is not a pointer declaration', function() {
			var highlighted = highlighter.highlight('result = ident1 * ident2;', 'cpp').result,
				expected = '<span class="cpp">' +
					'<span class="ident">result</span>' + nbsp +
					'<span class="operator">=</span>' + nbsp +
					'<span class="ident">ident1</span>' + nbsp +
					'<span class="operator">*</span>' + nbsp +
					'<span class="ident">ident2</span>' +
					'<span class="punctuation">;</span>' +
					'</span>';
			highlighted.should.equal(expected);
		});

		it('rhs of equals sign in parens is not a pointer declaration', function() {
			var highlighted = highlighter.highlight('result = (ident1 * ident2);', 'cpp').result,
				expected = '<span class="cpp">' +
					'<span class="ident">result</span>' + nbsp +
					'<span class="operator">=</span>' + nbsp +
					'<span class="punctuation">(</span>' +
					'<span class="ident">ident1</span>' + nbsp +
					'<span class="operator">*</span>' + nbsp +
					'<span class="ident">ident2</span>' +
					'<span class="punctuation">)</span>' +
					'<span class="punctuation">;</span>' +
					'</span>';
			highlighted.should.equal(expected);
		});
	});
});