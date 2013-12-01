module.exports = {
	doNotParse: /(?!x)x/,

	scopes: {
		header: [ ['---', '\n', null, true], ['+++', '\n', null, true], ['***', '\n', null, true] ],
		added: [ ['+', '\n', null, true] ],
		removed: [ ['-', '\n', null, true] ],
		modified: [ ['!', '\n', null, true] ],
		unchanged: [[' ', '\n', null, true]],
		'range-info': [ ['@@', '\n', null, true] ],
		'merge-header': [ ['Index:', '\n', null, true], ['=', '\n', null, true] ]
	},

	customTokens: {
		'no-newline': {
			values: ['\\ No newline at end of file'],
			boundary: '\\b'
		}
	}
};
