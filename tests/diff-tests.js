var harness = require('./harness');

harness('diff', function(expect, nbsp) {
	it('merge header', function() {
		expect('Index: path/to/file.cpp\n=========', [
			[ 'merge-header', 'Index:' + nbsp + 'path/to/file.cpp' ],
			'\n',
			[ 'merge-header', '=========' ]
		]);
	});

	it('header with "---"', function() {
		expect('--- /path/to/original \'\'foo\'\'', [
			[ 'header', '---' + nbsp + '/path/to/original' + nbsp + '\'\'foo\'\'' ]
		]);
	});

	it('header with "***"', function() {
		expect('*** /path/to/original \'\'foo\'\'', [
			[ 'header', '***' + nbsp + '/path/to/original' + nbsp + '\'\'foo\'\'' ]
		]);
	});

	it('header with "+++"', function() {
		expect('+++ /path/to/original \'\'foo\'\'', [
			[ 'header', '+++' + nbsp + '/path/to/original' + nbsp + '\'\'foo\'\'' ]
		]);
	});

	it('added lines', function() {
		expect('+hello', [
			[ 'added', '+hello' ]
		]);
	});
	
	it('removed lines', function() {
		expect('-hello', [
			[ 'removed', '-hello' ]
		]);
	});

	it('unchanged lines', function() {
		expect(' hello', [
			[ 'unchanged', nbsp + 'hello' ]
		]);
	});

	it('modified lines', function() {
		expect('!hello', [
			[ 'modified', '!hello' ]
		]);
	});

	it('newline marker', function() {
		expect('\\ No newline at end of file', [
			[ 'no-newline', [ '\\', 'No', 'newline', 'at', 'end', 'of', 'file' ].join(nbsp) ]
		]);
	});
});