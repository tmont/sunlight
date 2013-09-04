var should = require('should'),
	sunlight = require('../../src');

describe('DOS Batch', function() {
	var highlighter = new sunlight.Highlighter();
	highlighter.register('batch', require('../../src/lang/batch'));
	var nbsp = String.fromCharCode(0xA0);

	it('keywords', function() {
		var highlighted = highlighter.highlight('else', 'batch').result,
			expected = '<span class="batch">' +
				'<span class="keyword">else</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('should not be case sensitive', function() {
		var highlighted = highlighter.highlight('ELSE', 'batch').result,
			expected = '<span class="batch">' +
				'<span class="keyword">ELSE</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	describe('conditional keywords', function() {
		[ 'echo', 'title', 'set' ].forEach(function(keyword) {
			it('after ' + keyword, function() {
				var highlighted = highlighter.highlight('echo ' + keyword, 'batch').result,
					expected = '<span class="batch">' +
						'<span class="keyword">echo</span>' + nbsp +
						'<span class="ident">' + keyword + '</span>' +
						'</span>';
				highlighted.should.equal(expected);
			});
		});

		it('after |', function() {
			var highlighted = highlighter.highlight('echo | do', 'batch').result,
				expected = '<span class="batch">' +
					'<span class="keyword">echo</span>' + nbsp +
					'<span class="operator">|</span>' + nbsp +
					'<span class="keyword">do</span>' +
					'</span>';
			highlighted.should.equal(expected);
		});
	});

	describe('labels', function() {
		it('must be at start of line', function() {
			var highlighted = highlighter.highlight('set :foo', 'batch').result,
				expected = '<span class="batch">' +
					'<span class="keyword">set</span>' + nbsp +
					'<span class="operator">:</span>' +
					'<span class="ident">foo</span>' +
					'</span>';
			highlighted.should.equal(expected);
		});

		it('can override keywords', function() {
			var highlighted = highlighter.highlight(':echo', 'batch').result,
				expected = '<span class="batch">' +
					'<span class="operator">:</span>' +
					'<span class="label">echo</span>' +
					'</span>';
			highlighted.should.equal(expected);
		});

		it('can start after a newline', function() {
			var highlighted = highlighter.highlight('echo\n:echo', 'batch').result,
				expected = '<span class="batch">' +
					'<span class="keyword">echo</span>\n' +
					'<span class="operator">:</span>' +
					'<span class="label">echo</span>' +
					'</span>';
			highlighted.should.equal(expected);
		});

		it('after a goto keyword', function() {
			var highlighted = highlighter.highlight('goto foo', 'batch').result,
				expected = '<span class="batch">' +
					'<span class="keyword">goto</span>' + nbsp +
					'<span class="label">foo</span>' +
					'</span>';
			highlighted.should.equal(expected);
		});

		it('after a goto keyword with a colon', function() {
			var highlighted = highlighter.highlight('goto :foo', 'batch').result,
				expected = '<span class="batch">' +
					'<span class="keyword">goto</span>' + nbsp +
					'<span class="operator">:</span>' +
					'<span class="label">foo</span>' +
					'</span>';
			highlighted.should.equal(expected);
		});
	});

	it('comments', function() {
		var highlighted = highlighter.highlight('REM comment', 'batch').result,
			expected = '<span class="batch">' +
				'<span class="comment">REM' + nbsp + 'comment</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('double-quoted string', function() {
		var highlighted = highlighter.highlight('"foo"', 'batch').result,
			expected = '<span class="batch">' +
				'<span class="string">"foo"</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('variables', function() {
		var highlighted = highlighter.highlight('%foo%', 'batch').result,
			expected = '<span class="batch">' +
				'<span class="variable">%foo%</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('variables that do not end with %', function() {
		var highlighted = highlighter.highlight('%%a', 'batch').result,
			expected = '<span class="batch">' +
				'<span class="variable">%%a</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});

	it('numbers', function() {
		var highlighted = highlighter.highlight('42', 'batch').result,
			expected = '<span class="batch">' +
				'<span class="number">42</span>' +
				'</span>';
		highlighted.should.equal(expected);
	});
});