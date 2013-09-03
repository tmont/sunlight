function getNextWhile(tokens, index, direction, matcher) {
	var count = 1,
		token;

	direction = direction || 1;
	while (token = tokens[index + (direction * count++)]) {
		if (!matcher(token)) {
			return token;
		}
	}

	return undefined;
}

module.exports = {
	last: function(thing) {
		return thing.charAt ? thing.charAt(thing.length - 1) : thing[thing.length - 1];
	},

	contains: function(arr, value, caseInsensitive) {
		if (arr.indexOf && !caseInsensitive) {
			return arr.indexOf(value) >= 0;
		}

		for (var i = 0; i < arr.length; i++) {
			if (arr[i] === value) {
				return true;
			}

			if (caseInsensitive &&
				typeof(arr[i]) === 'string' &&
				typeof(value) === 'string' &&
				arr[i].toUpperCase() === value.toUpperCase()) {
				return true;
			}
		}

		return false;
	},

	merge: function(defaultObject, objectToMerge) {
		if (!objectToMerge) {
			return defaultObject;
		}

		for (var key in objectToMerge) {
			defaultObject[key] = objectToMerge[key];
		}

		return defaultObject;
	},

	clone: function(object) {
		return this.merge({}, object);
	},

	createHashMap: function(wordMap, boundary, caseInsensitive) {
		//creates a hash table where the hash is the first character of the word
		var newMap = {};

		for (var i = 0; i < wordMap.length; i++) {
			var word = caseInsensitive ? wordMap[i].toUpperCase() : wordMap[i];
			var firstChar = word.charAt(0);
			if (!newMap[firstChar]) {
				newMap[firstChar] = [];
			}

			newMap[firstChar].push({
				value: word,
				regex: new RegExp('^' + this.regexEscape(word) + boundary, caseInsensitive ? 'i' : '')
			});
		}

		return newMap;
	},

	matchWord: function(context, wordMap, tokenName, doNotRead) {
		var current = context.reader.current(),
			line = context.reader.getLine(),
			column = context.reader.getColumn();

		wordMap = wordMap || [];
		if (context.language.caseInsensitive) {
			current = current.toUpperCase();
		}

		if (!wordMap[current]) {
			return null;
		}

		wordMap = wordMap[current];
		for (var i = 0; i < wordMap.length; i++) {
			var word = wordMap[i].value,
				peek = current + context.reader.peek(word.length);
			if (word === peek || wordMap[i].regex.test(peek)) {
				return context.createToken(
					tokenName,
					context.reader.current() + context.reader[doNotRead ? 'peek' : 'read'](word.length - 1),
					line,
					column
				);
			}
		}

		return null;
	},

	createProceduralRule: function(startIndex, direction, tokenRequirements, caseInsensitive) {
		tokenRequirements = tokenRequirements.slice(0);
		return function(tokens) {
			var tokenIndexStart = startIndex;

			if (direction === 1) {
				tokenRequirements.reverse();
			}

			for (var i = 0; i < tokenRequirements.length; i++) {
				var actual = tokens[tokenIndexStart + (i * direction)],
					expected = tokenRequirements[tokenRequirements.length - 1 - i];

				if (!actual) {
					if (!expected.optional) {
						return false;
					}

					tokenIndexStart -= direction;
				} else if (actual.name === expected.token && (!expected.values || utils.contains(expected.values, actual.value, caseInsensitive))) {
					//derp
					continue;
				} else if (expected.optional) {
					tokenIndexStart -= direction; //we need to reevaluate against this token again
				} else {
					return false;
				}
			}

			return true;
		};
	},

	createBetweenRule: function(startIndex, opener, closer, caseInsensitive) {
		return function(tokens) {
			var index = startIndex,
				token,
				success = false;

			//check to the left: if we run into a closer or never run into an opener, fail
			while ((token = tokens[--index]) !== undefined) {
				if (token.name === closer.token && utils.contains(closer.values, token.value)) {
					if (token.name === opener.token && utils.contains(opener.values, token.value, caseInsensitive)) {
						//if the closer is the same as the opener that's okay
						success = true;
						break;
					}

					return false;
				}

				if (token.name === opener.token && utils.contains(opener.values, token.value, caseInsensitive)) {
					success = true;
					break;
				}
			}

			if (!success) {
				return false;
			}

			//check to the right for the closer
			index = startIndex;
			while ((token = tokens[++index]) !== undefined) {
				if (token.name === opener.token && utils.contains(opener.values, token.value, caseInsensitive)) {
					if (token.name === closer.token && utils.contains(closer.values, token.value, caseInsensitive)) {
						//if the closer is the same as the opener that's okay
						success = true;
						break;
					}

					return false;
				}

				if (token.name === closer.token && utils.contains(closer.values, token.value, caseInsensitive)) {
					success = true;
					break;
				}
			}

			return success;
		};
	},

	getNextNonWsToken: function(tokens, index) {
		return getNextWhile(tokens, index, 1, function(token) {
			return token.name === "default";
		});
	},
	getPreviousNonWsToken: function(tokens, index) {
		return getNextWhile(tokens, index, -1, function(token) {
			return token.name === "default";
		});
	},
	getNextWhile: function(tokens, index, matcher) {
		return getNextWhile(tokens, index, 1, matcher);
	},
	getPreviousWhile: function(tokens, index, matcher) {
		return getNextWhile(tokens, index, -1, matcher);
	},

	escapeSequences: ['\\n', '\\t', '\\r', '\\\\', '\\v', '\\f'],
	whitespace: { token: 'default', optional: true },

	//http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript/3561711#3561711
	regexEscape: function(s) {
		return s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
	},

	bubble: function(event, source, target) {
		source.on(event, function(data) {
			target.emit(event, data);
		});
	}
};
