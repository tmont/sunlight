(function(sunlight, document, undefined){

	if (sunlight === undefined || sunlight["registerLanguage"] === undefined) {
		throw "Include sunlight.js before including language files";
	}
	
	var heredocQueue = [];

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
					"sub!","sub","syscall","system","test","trace_var","trap","untrace_var "
				],
				boundary: "\\W"
			},
			
			specialOperator: {
				values: ["defined?", "eql?", "equal?"],
				boundary: "\\W"
			}
		},
		
		customParseRules: [
			//heredoc declaration
			//heredocs can be stacked and delimited, so this is a bit complicated
			//we keep track of the heredoc declarations in heredocQueue, and then use them later in the heredoc custom parse rule below
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
				
				heredocQueue.push(ident);
				
				var token = context.createToken("heredocDeclaration", value, line, column);
				return token;
			},
			
			//heredoc
			function(context) {
				if (heredocQueue.length === 0) {
					return null;
				}
				
				//there must have been at least one line break since the heredoc declaration(s)
				if (context.defaultData.text.replace(/[^\n]/g, "").length === 0) {
					return null;
				}
				
				//we're confirmed to be in the heredoc body, so read until all of the heredoc declarations have been satisfied
				
				var tokens = [], declaration, line, column, value = context.reader.current();
				while (heredocQueue.length > 0 && context.reader.peek() !== context.reader.EOF) {
					declaration = heredocQueue.shift();
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
			
			//raw string
			//http://www.ruby-doc.org/docs/ruby-doc-bundle/Manual/man-1.4/syntax.html#string
			function(context) {
				//begin with % or %q or %Q with a non-alphanumeric delimiter (opening bracket/paren are closed by corresponding closing bracket/paren)
				if (context.reader.current() !== "%") {
					return null;
				}
				
				var value = "%", readCount = 1;
				var peek = context.reader.peek();
				if (peek === "q" || peek === "Q") {
					readCount++;
				}
				
				if (/[A-Za-z0-9=]$/.test(context.reader.peek(readCount))) {
					//potential % or %= operator (how does ruby differentiate between %= and %=string=?)
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
				
				return context.createToken("rawString", value, line, column);
			},
			
			//doc comments
			//http://www.ruby-doc.org/docs/ruby-doc-bundle/Manual/man-1.4/syntax.html#embed_doc
			function(context) {
				//these begin on with a line that starts with "=begin" and end with a line that starts with "=end"
				//apparently stuff on the same line as "=end" is also part of the comment
				
				if (context.reader.current() !== "=" || context.reader.peek(5) !== "begin") {
					return null;
				}
				
				//previous token must be whitespace with a linebreak as the last character
				//or =begin must be the very first thing in the string
				if ((context.count() === 0 && context.defaultData.text === "") || context.defaultData.text.charAt(context.defaultData.text.length - 1) !== "\n") {
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
		]
	});
}(window["Sunlight"], document));