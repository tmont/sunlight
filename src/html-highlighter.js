var Highlighter = require('./highlighter'),
	util = require('util');

function HtmlHighlighter(document, options) {
	Highlighter.call(this, options);

	this.highlightedNodeCount = 0;
	this.document = document || (typeof(window) !== 'undefined' && window);
	if (!this.document) {
		throw new Error('document is required');
	}
}

util.inherits(HtmlHighlighter, Highlighter);

util._extend(HtmlHighlighter.prototype, {
	getComputedStyle: function(element, style) {
		if (this.document.defaultView && this.document.defaultView.getComputedStyle) {
			return this.document.defaultView.getComputedStyle(element, null)[style];
		}

		return element.currentStyle[style];
	},

	//matches the language of the node to highlight
	matchSunlightNode: function() {
		var regex;

		return function(node) {
			if (!regex) {
				regex = new RegExp('(?:\\s|^)' + this.options.classPrefix + 'highlight-(\\S+)(?:\\s|$)');
			}

			return regex.exec(node.className);
		};
	}(),

	//determines if the node has already been highlighted
	isAlreadyHighlighted: function() {
		var regex;
		return function(node) {
			if (!regex) {
				regex = new RegExp('(?:\\s|^)' + this.options.classPrefix + 'highlighted(?:\\s|$)');
			}

			return regex.test(node.className);
		};
	}(),

	highlightNode: function(node) {
		var match;
		if (this.isAlreadyHighlighted(node) || (match = this.matchSunlightNode(node)) === null) {
			return;
		}

		var languageId = match[1],
			currentNodeCount = 0,
			partialContext = null;
		this.emit('beforeHighlightNode', { node: node });
		for (var i = 0; i < node.childNodes.length; i++) {
			if (node.childNodes[i].nodeType === 3) {
				//text nodes
				partialContext = this.highlight(node.childNodes[i].nodeValue, languageId, partialContext);
				this.highlightedNodeCount++;
				currentNodeCount = currentNodeCount || this.highlightedNodeCount;
				node.innerHTML = partialContext.result;
			} else if (node.childNodes[i].nodeType === 1) {
				//element nodes
				this.highlightNode(node.childNodes[i]);
			}
		}

		//indicate that this node has been highlighted
		node.className += ' ' + this.options.classPrefix + 'highlighted';

		//if the node is block level, we put it in a container, otherwise we just leave it alone
		var container,
			codeContainer;
		if (this.getComputedStyle(node, 'display') === 'block') {
			container = this.document.createElement('div');
			container.className = this.options.classPrefix + 'container';

			codeContainer = this.document.createElement('div');
			codeContainer.className = this.options.classPrefix + 'code-container';

			//apply max height if specified in options
			if (this.options.maxHeight !== false) {
				codeContainer.style.overflowY = 'auto';
				codeContainer.style.maxHeight = this.options.maxHeight + (/^\d+$/.test(this.options.maxHeight) ? 'px' : '');
			}

			container.appendChild(codeContainer);

			node.parentNode.insertBefore(codeContainer, node);
			node.parentNode.removeChild(node);
			codeContainer.appendChild(node);

			codeContainer.parentNode.insertBefore(container, codeContainer);
			codeContainer.parentNode.removeChild(codeContainer);
			container.appendChild(codeContainer);
		}

		this.emit('afterHighlightNode', {
			container: container,
			codeContainer: codeContainer,
			node: node,
			count: currentNodeCount
		});
	}
});