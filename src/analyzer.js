var utils = require('./util');

function defaultHandleToken(type, context) {
	var tokenString = '<span class="' + context.options.classPrefix + type + '">' +
		context.prepareToken(context.tokens[context.index]) + '</span>';
	return context.append(tokenString) || true;
}

function Analyzer(languageMap) {
	this.languageMap = languageMap;
}

Analyzer.prototype = {
	handleToken: function(context) {
		return defaultHandleToken(context.tokens[context.index].name, context);
	},

	//just append default content as regular text
	handle_default: function(context) {
		return context.append(context.prepareToken(context.tokens[context.index]));
	},

	//this handles the named ident mayhem
	handle_ident: function(context) {
		function evaluate(rules, createRule) {
			rules = rules || [];
			for (var i = 0; i < rules.length; i++) {
				if (typeof(rules[i]) === 'function') {
					if (rules[i](context)) {
						return defaultHandleToken('named-ident', context);
					}
				} else if (createRule && createRule(rules[i])(context.tokens)) {
					return defaultHandleToken('named-ident', context);
				}
			}

			return false;
		}

		var caseInsensitive = context.language.caseInsensitive;
		function followsFactory(ruleData) {
			return utils.createProceduralRule(context.index - 1, -1, ruleData, caseInsensitive);
		}

		function precedesFactory(ruleData) {
			return utils.createProceduralRule(context.index + 1, 1, ruleData, caseInsensitive);
		}

		function betweenFactory(ruleData) {
			return utils.createBetweenRule(context.index, ruleData.opener, ruleData.closer, caseInsensitive);
		}

		return evaluate(context.language.namedIdentRules.custom)
			|| evaluate(context.language.namedIdentRules.follows, followsFactory)
			|| evaluate(context.language.namedIdentRules.precedes, precedesFactory)
			|| evaluate(context.language.namedIdentRules.between, betweenFactory)
			|| defaultHandleToken('ident', context);
	}
};

module.exports = Analyzer;