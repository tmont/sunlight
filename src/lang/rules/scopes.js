var utils = require('../../util'),
	esc = utils.escapeSequences;

module.exports = {
	doubleQuotedString:        [ '"',   '"', esc.concat([ '\\"' ]),  false ],
	singleQuotedString:        [ '\'', '\'', esc.concat([ '\\\'' ]), false ],
	doubleSlashComment:        [ '//', '\n', null,                   true  ],
	hashComment:               [ '#',  '\n', null,                   true  ],
	slashStarMultiLineComment: [ '/*', '*/', null,                   false ]
};