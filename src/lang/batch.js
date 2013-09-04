var utils = require('../util'),
	scopes = require('./rules/scopes');

module.exports = {
	caseInsensitive: true,

	scopes: {
		string: [ scopes.doubleQuotedString ],
		comment: [[ 'REM', '\n', null, true], [ '::', '\n', null, true ]],
		variable: [[ '%', { regex: /[^\w%]/, length: 1}, null, true ]]
	},

	customParseRules: [
		//labels
		function(context) {
			if (!context.reader.isSolWs() || context.reader.current() !== ':' || context.reader.peek() === ':') {
				return null;
			}

			var colon = context.createToken('operator', ':', context.reader.getLine(), context.reader.getColumn());

			//label, read until whitespace
			var peek, value = '', line, column;
			while (peek = context.reader.peek()) {
				if (/\s/.test(peek)) {
					break;
				}

				value += context.reader.read();
				if (!line) {
					line = context.reader.getLine();
					column = context.reader.getColumn();
				}
			}

			if (value === '') {
				return null;
			}


			return [colon, context.createToken('label', value, line, column)];
		},

		//label after goto statements
		function(context) {
			var values = [
					{ token: 'keyword', values: ['goto'] },
					{ token: 'operator', values: [':'], optional: true }
				],
				line = context.reader.getLine(),
				matches = utils.createProceduralRule(context.count() - 1, -1, values, true),
				column = context.reader.getColumn();

			if (!matches(context.getAllTokens())) {
				return null;
			}

			var value = context.reader.current(), peek;
			while (peek = context.reader.peek()) {
				if (/[\W]/.test(peek)) {
					break;
				}

				value += context.reader.read();
			}

			var tokens = [];
			if (value.charAt(0) === ':') {
				tokens.push(context.createToken('operator', ':', line, column));
				column++;
				value = value.substring(1);
			}

			tokens.push(context.createToken('label', value, line, column));
			return tokens;
		},

		//keywords have to be handled manually because strings don't have to be quoted
		//e.g. we don't want to highlight 'do' in 'echo do you have the time?'
		function() {
			var keywords = utils.createHashMap([
				//commands
				'assoc','attrib','break','bcdedit','cacls','call','cd','chcp','chdir','chkdsk','chkntfs','cls','cmd',
				'color','comp','compact','convertfcopy','date','del','dir','diskcomp','diskcopy','diskpart','doskey',
				'driverquery','echo','endlocal','erase','exit','fc','findstr','find','format','for','fsutil','ftype',
				'goto','gpresult','graftabl','help','icacls','if','label','md','mkdir','mklink','mode','more','move',
				'openfiles','path','pause','popd','print','prompt','pushd','rd','recover',/*'rem',*/'rename','ren',
				'replace','rmdir','robocopy','setlocal','set','schtasks','sc','shift','shutdown','sort','start',
				'subst','systeminfo','tasklist','taskkill','time','title','tree','type','verify','ver','vol','xcopy',
				'wmic',

				'lfnfor',

				//keywords
				'do', 'else', 'errorlevel', 'exist', 'in', 'not',
				'choice',
				'com1', 'con', 'prn', 'aux', 'nul', 'lpt1',
				'exit', 'eof', 'off', 'on',

				'equ','neq','lss','leq','gtr','geq'
			], '\\b', true);

			return function(context) {
				var token = utils.matchWord(context, keywords, 'keyword', true);

				if (!token) {
					return null;
				}

				//look backward for 'echo' or 'title' or 'set' or '|' or beginning of line
				//if we find 'echo' or 'set' or 'title' or '=' before '|' or sol then it's a fail

				if (!context.reader.isSolWs()) {
					var index = context.count(), prevToken;
					while (prevToken = context.token(--index)) {
						if (prevToken.name === 'keyword' && utils.contains(['echo', 'title', 'set'], prevToken.value)) {
							return null;
						}
						if (prevToken.name === 'operator' && prevToken.value === '=') {
							return null;
						}

						//pipe
						if (prevToken.name === 'operator' && prevToken.value === '|') {
							break;
						}

						//sol
						if (prevToken.name === 'default' && prevToken.value.indexOf('\n') >= 0) {
							break;
						}
					}
				}

				context.reader.read(token.value.length - 1);
				return token;
			};
		}()
	],

	identFirstLetter: /[A-Za-z_\.]/,
	identAfterFirstLetter: /[\w-]/,

	operators: [
		'&&', '||', '&', ':', '/', '==', '|', '@', '*', '>>', '>', '<', '==!', '!', '=', '+'
	]
};
