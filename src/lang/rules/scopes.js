var utils = require('../../util');

module.exports = {
	doubleQuotedString: [ '"', '"', utils.escapeSequences.concat(['\\"']) ],
	singleQuotedString: [ '\'', '\'', utils.escapeSequences.concat(['\\\'', '\\\\']) ],
	doubleSlashComment: ['//', '\n', null, true],
	slashStarMultiLineComment: ['/*', '*/']
};