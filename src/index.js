var Highlighter = require('./highlighter'),
	HtmlHighlighter = require('./html-highlighter'),
	utils = require('./util'),
	Analyzer = require('./analyzer');

//public facing object
module.exports = {
	Highlighter: Highlighter,
	HtmlHighlighter: HtmlHighlighter,
	util: utils,
	Analyzer: Analyzer,
	highlightAll: function(options) {
		if (typeof(window) === 'undefined') {
			return;
		}

		var highlighter = new HtmlHighlighter(window.document, options),
			tags = window.document.getElementsByTagName('*');

		for (var i = 0; i < tags.length; i++) {
			highlighter.highlightNode(tags[i]);
		}
	}
};
