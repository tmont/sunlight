(function(sunlight, undefined){

	if (sunlight === undefined || sunlight["registerLanguage"] === undefined) {
		throw "Include sunlight.js before including language files";
	}

	sunlight.registerLanguage("css", {
		keywords: [
			//background (http://www.w3.org/TR/css3-background/)
			"background-color", "background-image", "background-repeat", "background-attachment", "background-position", 
			"background-clip", "background-origin", "background-size", "background",
			
			//border
			"border", "border-top", "border-bottom", "border-right", "border-left", "border-spacing",
			"border-top-style", "border-right-style", "border-left-style", "border-bottom-style", "border-style",
			"border-top-width", "border-right-width", "border-left-width", "border-bottom-width", "border-width",
			"border-top-color", "border-right-color", "border-left-color", "border-bottom-color", "border-color",
			
			"border-radius", "border-top-left-radius", "border-top-right-radius", "border-bottom-right-radius", 
			"border-bottom-left-radius",
		
			"border-image", "border-image-source", "border-image-slice", "border-image-width", "border-image-outset", 
			"border-image-repeat",
			
			//miscellaneous effects
			"box-decoration-break", "box-shadow",
			
			//speech (http://www.w3.org/TR/css3-speech/)
			"voice-volume", "voice-balance", "speak", "pause-before", "pause-after", "pause", "rest-before", "rest-after", 
			"rest", "cue-before", "cue-after", "cue", "mark-before", "mark-after", "mark", "voice-family", "voice-rate",
			"voice-pitch", "voice-pitch-range", "voice-stress", "voice-duration", "phonemes", "speak-header", "speak-numeral",
			"speak-punctuation", "pitch-range", "play-during", "richness", "speak", "speech-rate",
			
			//ui (http://www.w3.org/TR/css3-ui/)
			"appearance", "icon", "box-sizing", "outline", "outline-width", "outline-style", "outline-color", "outline-offset",
			"resize", "cursor", "nav-index", "nav-up", "nav-right", "nav-down", "nav-left",
			
			//box-model (http://www.w3.org/TR/css3-box/)
			"display", "position", "float", "clear", "visibility", "bottom", "top", "left", "right",
			"overflow", "overflow-x", "overflow-y", "overflow-style",
			"marquee-style", "marquee-direction", "marquee-play-count", "marquee-speed",
			"padding", "padding-top", "padding-right", "padding-bottom", "padding-left",
			"margin", "margin-top", "margin-right", "margin-bottom", "margin-left",
			"width", "height", "min-width", "max-width", "min-height", "max-height",
			"rotation", "rotation-point",
			
			//text (http://www.w3.org/TR/css3-text/)
			"text-transform", "white-space-collapsing", "white-space", "line-break", "word-break", 
			"hyphens", "hyphenate-character", "hyphenate-limit-before", "hyphenate-limit-after", "hyphenate-limit-lines", 
			"hyphenate-limit-last", "hyphenate-resource", "text-wrap", "word-wrap", "text-align", "text-align-first",
			"text-align-last", "text-justify", "word-spacing", "letter-spacing", "text-trim", "text-autospace", "text-indent",
			"hanging-punctuation", "text-decoration-line", "text-decoration-color", "text-decoration-style", "text-decoration",
			"text-decoration-skip", "text-underline-position", "text-emphasis-style", "text-emphasis-color", "text-emphasis",
			"text-emphasis-position", "text-shadow", "text-outline", 
			
			//writing modes (http://www.w3.org/TR/css3-writing-modes/)
			"direction", "unicode-bidi", "writing-mode", "text-orientation", "text-combine", 
			
			//color (http://www.w3.org/TR/css3-color/)
			"color", "opacity",
			
			//font (http://www.w3.org/TR/css3-fonts/)
			"font-family", "font-weight", "font-stretch", "font-style", "font-size", "font-size-adjust", "font",
			"font-synthesis", "src", "unicode-range", "font-variant", "font-feature-settings", "font-kerning",
			"vertical-position", "font-variant-ligatures", "font-variant-caps", "font-variant-numeric",
			"font-variant-alternates", "font-variant-east-asian", "font-feature-settings", "font-language-override",
			
			"line-height", "text-height",
			
			//transformations (http://www.w3.org/TR/css3-2d-transforms/ & http://www.w3.org/TR/css3-3d-transforms/)
			"transform", "transform-origin", "transform-style", "perspective", "perspective-origin", "backface-visibility",
			
			//transition (http://www.w3.org/TR/css3-transitions/)
			"transition-property", "transition-duration", "transition-timing-function", "transition-delay",
			
			//lists (http://www.w3.org/TR/css3-lists/)
			"list-style-type", "list-style-image", "list-style-position", "list-style",
			
			//multi-column (http://www.w3.org/TR/css3-multicol/)
			"column-width", "column-count", "colunns", "column-gap", "column-rule-color", "column-rule-style", "column-rule-width",
			"column-rule", "break-before", "break-after", "break-inside", "column-span", "column-fill",
			
			//tables
			"border-collapse", "caption-side", "table-layout", "empty-cells",
			
			//print
			"fit", "fit-position", "image-orientation", "orphans", "page", "page-break-after", "page-break-before", "page-break-inside",
			"size", "widows",
			
			//other
			"content", "z-index", "counter-increment", "counter-reset", "azimuth", "elevation", "quotes"
		],
		
		customParseRules: [
			//functions
			function() {
				var functions = sunlight.util.createHashMap([
					"matrix", "translate", "translateX", "translateY", "scaleX", "scaleY", "rotate", "skewX", "skewY", "skew",
					"translate3d", "scaleZ", "translateZ", "rotate3d", "perspective", "url"
				], "\\b");
				
				return function(context) {
					var token = sunlight.util.matchWord(context, functions, "function", true);
					if (token === null) {
						return null;
					}
					
					//the next non-whitespace character must be a "("
					var count = token.value.length, peek = context.reader.peek(count);
					while (peek.length === count && peek !== context.reader.EOF) {
						if (!/\s$/.test(peek)) {
							if (peek[peek.length - 1] === "(") {
								//this token really is a function
								context.reader.read(token.value.length - 1);
								return token;
							}
							
							break;
						}
					
						peek = context.reader.peek(++count);
					}
					
					return null;
				};
			}(),
			
			//pseudo classes
			function() {
				var pseudoClasses = sunlight.util.createHashMap([
					//http://www.w3.org/TR/css3-selectors/#selectors
					"root", "nth-child", "nth-last-child", "nth-of-type", "nth-last-of-type", "first-child", "last-child", 
					"first-of-type", "last-of-type", "only-child", "only-of-type", "empty", "link", "visited", "active",
					"hover", "focus", "target", "lang", "enabled", "disabled", "checked", "first-line", "first-letter",
					"before", "after", "not",
					
					//http//www.w3.org/TR/css3-ui/#pseudo-classes
					"read-only", "read-write", "default", "valid", "invalid", "in-range", "out-of-range", "required", "optional"
				], "\\b", false);
				
				return function(context) {
					var previousToken = sunlight.util.getPreviousNonWsToken(context.getAllTokens(), context.count());
					if (!previousToken || previousToken.name !== "operator" || previousToken.value !== ":") {
						return null;
					}
					
					return sunlight.util.matchWord(context, pseudoClasses, "pseudoClass");
				};
			}(),
			
			//pseudo elements
			function() {
				var pseudoElements = sunlight.util.createHashMap(
					["before", "after", "value", "choices", "repeat-item", "repeat-index", "marker"],
					"\\b",
					false
				);
				
				return function(context) {
					var previousToken = sunlight.util.getPreviousNonWsToken(context.getAllTokens(), context.count());
					if (!previousToken || previousToken.name !== "operator" || previousToken.value !== "::") {
						return null;
					}
					
					return sunlight.util.matchWord(context, pseudoElements, "pseudoElement");
				};
			}(),
			
			//classes
			function(context) {
				//we can't just make this a scope because we'll get false positives for things like: url(image.png) (image.png doesn't need to be in quotes)
				//so we detect them the hard way
				
				if (context.reader.current() !== ".") {
					return null;
				}
				
				//make sure it's not a value to a function, e.g. not between "(" and ")"
				//basically if we run into "(" before a "{" it's bad
				var token, index = context.count(), tokens = context.getAllTokens();
				while ((token = sunlight.util.getPreviousNonWsToken(tokens, index--)) !== undefined) {
					if (token.name === "punctuation") {
						if (token.value === "{" || token.value === ")") {
							break;
						}
						
						if (token.value === "(") {
							return null;
						}
					}
				}
				
				//if we made it this far, we're looking at a class name
				var className = ".";
				var peek = context.reader.peek();
				var line = context.reader.getLine(), column = context.reader.getColumn();
				while (peek !== context.reader.EOF) {
					if (/[^\w-]/.test(peek)) {
						break;
					}
					
					className += context.reader.read();
					peek = context.reader.peek();
				}
				
				return context.createToken("class", className, line, column);
			},
			
			//hex color value
			function(context) {
				if (context.reader.current() !== "#") {
					return null;
				}
				
				//must be between ":" and ";"
				//basically if we run into a "{" before a "} it's bad
				
				var peek = context.reader.peek(), count = 1, value = "#", letter, validHex = true;
				var line = context.reader.getLine(), column = context.reader.getColumn();
				while (peek.length === count) {
					letter = peek[peek.length - 1];
					if (letter === "}" || letter === ";") {
						break;
					}
					if (letter === "{") {
						return null;
					}
					if (validHex && /[A-Fa-f0-9]/.test(letter)) {
						value += letter;
					} else {
						validHex = false;
					}
					
					peek = context.reader.peek(++count);
				}
				
				context.reader.read(value.length - 1); //-1 because we already read the "#"
				return context.createToken("hexColor", value, line, column);
			}
		],
		
		customTokens: {
			rule: [
				"@import", "@media", "@font-face", "@phonetic-alphabet", "@hyphenate-resource", "@font-feature-values",
				"@charset", "@namespace", "@page", 
				"@bottom-left-corner", "@bottom-left", "@bottom-center", "@bottom-right", "@bottom-right-corner",
				"@top-left-corner", "@top-left", "@top-center", "@top-right", "@top-right-corner"
			]
		},
		
		scopes: {
			string: [ ["\"", "\"", ["\\\"", "\\\\"]], ["'", "'", ["\\\'"]] ],
			comment: [ ["/*", "*/"] ],
			id: [ ["#", { length: 1, regex: /[^-\w]/ }, null, true ] ]
		},
		
		identFirstLetter: /[A-Za-z]/,
		identAfterFirstLetter: /[\w-]/,

		operators: [
			"::", ":", ">", "+", "~=", "^=", "$=", "|=", "="
		]

	});
}(window["Sunlight"]));