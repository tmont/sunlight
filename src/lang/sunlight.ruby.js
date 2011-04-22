(function(sunlight, undefined){

	if (sunlight === undefined || sunlight["registerLanguage"] === undefined) {
		throw "Include sunlight.js before including language files";
	}
	
	sunlight.registerLanguage("ruby", {
		//http://www.ruby-doc.org/docs/keywords/1.9/
		keywords: [
			"BEGIN","END","__ENCODING__","__END__","__FILE__","__LINE__","alias","and","begin","break","case",
			"class","def","defined?","do","else","elsif","end","ensure","false","for","if","in","module","next",
			"nil","not","or","redo","rescue","retry","return","self","super","then","true","undef","unless",
			"until","when","while","yield"
		],
		
		customTokens: {
			//http://www.ruby-doc.org/docs/ruby-doc-bundle/Manual/man-1.4/function.html
			"function": {
				values: [
					"Array","Float","Integer","String","at_exit","autoload","binding","caller","catch","chop!","chop",
					"chomp!","chomp","eval","exec","exit!","exit","fail","fork","format","gets","global_variables",
					"gsub!","gsub","iterator?","lambda","load","local_variables","loop","open","p","print","printf","proc",
					"putc","puts","raise","rand","readline","readlines","require","select","sleep","split","sprintf","srand",
					"sub!","sub","syscall","system","test","trace_var","trap","untrace_var"
				],
				boundary: "\\W"
			},
			
			specialOperator: {
				values: ["defined?", "eql?", "equal?"],
				boundary: "\\W"
			}
		},
		
		customParseRules: [
			//regex literal, same as javascript
			function(context) {
				if (context.reader.current() !== "/") {
					return null;
				}
				
				var isValid = function() {
					var previousNonWsToken = context.token(context.count() - 1);
					var previousToken = null;
					if (context.defaultData.text !== "") {
						previousToken = context.createToken("default", context.defaultData.text); 
					}
					
					if (!previousToken) {
						previousToken = previousNonWsToken;
					}
					
					//first token of the string
					if (previousToken === undefined) {
						return true;
					}
					
					//since Ruby doesn't have statement terminators, if the previous token was whitespace and contained a newline, then we're good
					if (previousToken.name === "default" && previousToken.value.indexOf("\n") > -1) {
						return true;
					}
					
					if (previousNonWsToken.name === "keyword" || previousNonWsToken.name === "ident" || previousNonWsToken.name === "number") {
						return false;
					}
					
					return true;
				}();
				
				if (!isValid) {
					return null;
				}
				
				//read the regex literal
				var regexLiteral = "/";
				var line = context.reader.getLine();
				var column = context.reader.getColumn();
				var peek2, next;
				
				while (context.reader.peek() !== context.reader.EOF) {
					peek2 = context.reader.peek(2);
					if (peek2 === "\\/" || peek2 === "\\\\") {
						//escaped backslash or escaped forward slash
						regexLiteral += context.reader.read(2);
						continue;
					}
					
					regexLiteral += (next = context.reader.read());
					if (next === "/") {
						break;
					}
				}
				
				//read the regex modifiers
				//only "x", "i", "o" and "m" are allowed, but for the sake of simplicity we'll just say any alphabetical character is valid
				while (context.reader.peek() !== context.reader.EOF) {
					if (!/[A-Za-z]/.test(context.reader.peek())) {
						break;
					}
					
					regexLiteral += context.reader.read();
				}
				
				return context.createToken("regexLiteral", regexLiteral, line, column);
			},
			
			//heredoc declaration
			//heredocs can be stacked and delimited, so this is a bit complicated
			//we keep track of the heredoc declarations in context.items.heredocQueue, and then use them later in the heredoc custom parse rule below
			function(context) {
				if (context.reader.current() !== "<" || context.reader.peek() !== "<") {
					return null;
				}
				
				//cannot be preceded by an ident or a number or a string
				var prevToken = sunlight.util.getPreviousNonWsToken(context.getAllTokens(), context.count() - 1);
				if (prevToken && (prevToken.name === "ident" || prevToken.name === "number" || prevToken.name === "string")) {
					return null;
				}
				
				//can be between quotes (double, single or back) or not, or preceded by a hyphen
				
				var line = context.reader.getLine(), column = context.reader.getColumn();
				var value = "<<", ident = "";
				context.reader.read(2);
				
				var current = context.reader.current();
				var delimiter = "";
				if (current === "-") {
					context.reader.read();
					value += current;
					current = context.reader.current();
				}
				
				if (sunlight.util.contains(["\"", "'", "`"], current)) {
					delimiter = current;
				} else {
					ident = current;
				}
				
				value += current;
				
				var peek;
				while ((peek = context.reader.peek()) !== context.reader.EOF) {
					if (peek === "\n" || (delimiter === "" && /\W/.test(peek))) {
						break;
					}
					
					if (peek === "\\") {
						var peek2 = context.reader.peek(2);
						if (delimiter !== "" && sunlight.util.contains(["\\" + delimiter, "\\\\"], peek2)) {
							value += peek2;
							ident += context.reader.read(2);
							continue;
						}
					}
					
					value += context.reader.read();
					
					if (delimiter !== "" && peek === delimiter) {
						break;
					}
					
					ident += peek;
				}
				
				context.items.heredocQueue.push(ident);
				
				var token = context.createToken("heredocDeclaration", value, line, column);
				return token;
			},
			
			//heredoc
			function(context) {
				if (context.items.heredocQueue.length === 0) {
					return null;
				}
				
				//there must have been at least one line break since the heredoc declaration(s)
				if (context.defaultData.text.replace(/[^\n]/g, "").length === 0) {
					return null;
				}
				
				//we're confirmed to be in the heredoc body, so read until all of the heredoc declarations have been satisfied
				
				var tokens = [], declaration, line, column, value = context.reader.current();
				while (context.items.heredocQueue.length > 0 && context.reader.peek() !== context.reader.EOF) {
					declaration = context.items.heredocQueue.shift();
					line = context.reader.getLine(), column = context.reader.getColumn();
					
					//read until "\n{declaration}\n"
					while (context.reader.peek() !== context.reader.EOF) {
						var peekIdent = context.reader.peek(declaration.length + 2);
						if (peekIdent === "\n" + declaration || peekIdent === "\n" + declaration + "\n") {
							value += context.reader.read(declaration.length + 2);
							break;
						}
						
						value += context.reader.read();
					}
					
					tokens.push(context.createToken("heredoc", value, line, column));
					value = "";
				}
				
				return tokens.length > 0 ? tokens : null;
			},
			
			//raw string/regex
			//http://www.ruby-doc.org/docs/ruby-doc-bundle/Manual/man-1.4/syntax.html#string
			//http://www.ruby-doc.org/docs/ruby-doc-bundle/Manual/man-1.4/syntax.html#regexp
			function(context) {
				//begin with % or %q or %Q with a non-alphanumeric delimiter (opening bracket/paren are closed by corresponding closing bracket/paren)
				if (context.reader.current() !== "%") {
					return null;
				}
				
				var value = "%", readCount = 1, isRegex = false;
				var peek = context.reader.peek();
				if (peek === "q" || peek === "Q" || peek === "r") {
					readCount++;
					if (peek === "r") {
						isRegex = true;
					}
				}
				
				if (/[A-Za-z0-9=]$/.test(context.reader.peek(readCount))) {
					//potential % or %= operator (how does ruby differentiate between "%=" and "%=string="?)
					return null;
				}
				
				var line = context.reader.getLine(), column = context.reader.getColumn();
				value += context.reader.read(readCount);
				var delimiter = value.charAt(value.length - 1);
				switch (delimiter) {
					case "(":
						delimiter = ")";
						break;
					case "[":
						delimiter = "]";
						break;
					case "{":
						delimiter = "}";
						break;
				}
				
				//read until the delimiter
				while ((peek = context.reader.peek()) !== context.reader.EOF) {
					if (peek === "\\" && sunlight.util.contains(["\\" + delimiter, "\\\\"], context.reader.peek(2))) {
						//escape sequence
						value += context.reader.read(2);
						continue;
					}
					
					value += context.reader.read();
					
					if (peek === delimiter) {
						break;
					}
				}
				
				if (isRegex) {
					//read potential regex modifiers
					while (context.reader.peek() !== context.reader.EOF) {
						if (!/[A-Za-z]/.test(context.reader.peek())) {
							break;
						}
						
						value += context.reader.read();
					}
				}
				
				return context.createToken(isRegex ? "regexLiteral" : "rawString", value, line, column);
			},
			
			//doc comments
			//http://www.ruby-doc.org/docs/ruby-doc-bundle/Manual/man-1.4/syntax.html#embed_doc
			function(context) {
				//these begin on with a line that starts with "=begin" and end with a line that starts with "=end"
				//apparently stuff on the same line as "=end" is also part of the comment
				
				if (!context.reader.isSol() || context.reader.current() !== "=" || context.reader.peek(5) !== "begin") {
					return null;
				}
				
				var value = "=begin";
				var line = context.reader.getLine();
				var column = context.reader.getColumn();
				context.reader.read(5);
				
				//read until "\n=end" and then everything until the end of that line
				var foundEnd = false, peek;
				while ((peek = context.reader.peek()) !== context.reader.EOF) {
					if (!foundEnd && context.reader.peek(5) === "\n=end") {
						foundEnd = true;
						value += context.reader.read(5);
						continue;
					}
					
					if (foundEnd && peek === "\n") {
						break;
					}
					
					value += context.reader.read();
				}
				
				return context.createToken("docComment", value, line, column);
			}
		],

		scopes: {
			string: [ ["\"", "\"", sunlight.util.escapeSequences.concat(["\\\""])], ["'", "'", ["\\\'", "\\\\"]] ],
			comment: [ ["#", "\n", null, true] ],
			subshellCommand: [ ["`", "`", ["\\`"]] ],
			globalVariable: [ ["$", { length: 1, regex: /[\W]/ }, null, true] ],
			instanceVariable: [ ["@", { length: 1, regex: /[\W]/ }, null, true] ]
		},
		
		identFirstLetter: /[A-Za-z_]/,
		identAfterFirstLetter: /\w/,
		
		namedIdentRules: {
			follows: [
				//class names
				//function names
				[{ token: "keyword", values: ["class", "def"] }, sunlight.util.whitespace],
				
				//extended classes
				[
					{ token: "keyword", values: ["class"] }, 
					sunlight.util.whitespace, 
					{ token: "ident" }, 
					sunlight.util.whitespace, 
					{ token: "operator", values: ["<", "<<"] },
					sunlight.util.whitespace
				]
			],
			
			precedes: [
				//static variable access
				[sunlight.util.whitespace, { token: "operator", values: ["::"] }],
				
				//new-ing a class
				[
					sunlight.util.whitespace, 
					{ token: "operator", values: ["."] }, 
					sunlight.util.whitespace, 
					{ token: "ident", values: ["new"] }, 
					sunlight.util.whitespace, 
					{ token: "punctuation", values: ["("] }
				]
			]
		},

		operators: [
			"?",
			"...", "..", ".",
			"::", ":",
			"[]",
			"+=", "+", 
			"-=", "-", 
			"**=", "*=", "**", "*",
			"/=", "/",  
			"%=", "%", 
			"&&=", "&=", "&&", "&", 
			"||=", "|=", "||", "|",
			"^=", "^", 
			"~", 
			"<=>", "<<=", "<<", "<=", "<", 
			">>=", ">>", ">=", ">",   
			"!~", "!=", "!",
			"=>", "===", "==", "=~", "="
		],
		
		contextItems: {
			heredocQueue: []
		}
	});
}(this["Sunlight"]));