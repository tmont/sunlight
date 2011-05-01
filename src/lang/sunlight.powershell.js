(function(sunlight, undefined){

	if (sunlight === undefined || sunlight["registerLanguage"] === undefined) {
		throw "Include sunlight.js before including language files";
	}

	sunlight.registerLanguage("powershell", {
		
		scopes: {
			string: [ ["\"", "\"", ["\\\"", "\\\\"]], ["'", "'", ["\\'", "\\\\"]] ],
			comment: [ ["#", "\n", null, true] ]
		},
		
		customTokens: {
		},
		
		customParseRules: [
			//idents and special operators
			//we need a custom rule to differentiate between the "-" operator and idents that start with "-"
			function() {
				var specialOperators = [
					"-not", "-band", "-bor", "bnot", "-replace", "-ireplace", "-creplace", "-and",
					"-or", "-isnot", "-is", "-as", "-F", "-lt", "-le", "-gt", "-ge", "-eq", "-ne", 
					"-contains", "-notcontains", "-like", "-notlike", "-match", "-notmatch"
				];
				
				//[type]::gettype("System.Management.Automation.KeywordTokenReader")|%{$_.InvokeMember("_keywordTokens", "NonPublic,Static,GetField", $null, $_,@())}
				var keywords = [
					"elseif","begin","function","for","foreach","return","else","trap","while","using","do","data",
					"dynamicparam","class","define","until","end","break","if","throw","param","continue","finally",
					"in","switch","exit","filter","from","try","process","var","catch"
				];
				
				return function(context) {
					if (!/[A-Za-z_-]/.test(context.reader.current()) || !/[\w-]/.test(context.reader.peek())) {
						return null;
					}
					
					var peek, ident = context.reader.current(), line = context.reader.getLine(), column = context.reader.getColumn();
					
					while (peek = context.reader.peek()) {
						if (!/[\w-]/.test(peek)) {
							break;
						}
						
						ident += context.reader.read();
					}
					
					var tokenType = sunlight.util.contains(specialOperators, ident) 
						? "specialOperator" 
						: (sunlight.util.contains(keywords, ident) 
							? "keyword" 
							: (ident.charAt(0) === "-" 
								? "switch"
								: "ident"
							)
						);
					
					return context.createToken(tokenType, ident, line, column);
				};
			}(),
			
			//variables
			function() {
				//Get-Help about_automatic_variables
				var specialVariables = [
					"$$", "$?", "$^", "$_", "$ARGS", "$CONSOLEFILENAME", "$ERROR", "$EVENT", "$EVENTSUBSCRIBER",
					"$EXECUTIONCONTEXT", "$FALSE", "$FOREACH", "$HOME", "$HOST", "$INPUT", "$LASTEXITCODE", 
					"$MATCHES", "$MYINVOCATION", "$NESTEDPROMPTLEVEL", "$NULL", "$PID", "$PROFILE", "$PSBOUNDPARAMETERS",
					"$PSCMDLET", "$PSCULTURE", "$PSDEBUGCONTEXT", "$PSHOME", "$PSSCRIPTROOT", "$PSUICULTURE",
					"$PSVERSIONTABLE", "$PWD", "$SENDER", "$SHELLID", "$SOURCEARGS", "$SOURCEEVENTARGS", "$THIS", "$TRUE"
				];
				var invalidVariableCharRegex = /[!@#%&,\.\s]/;
				return function(context) {
					//illegal characters in a variable: ! @ # % & , . whitespace
					if (context.reader.current() !== "$" || invalidVariableCharRegex.test(context.reader.peek())) {
						return null;
					}
					
					var peek, value = "$", line = context.reader.getLine(), column = context.reader.getColumn();
					while (peek = context.reader.peek()) {
						if (invalidVariableCharRegex.test(peek)) {
							break;
						}
						
						value += context.reader.read();
					}
					
					return context.createToken(sunlight.util.contains(specialVariables, value.toUpperCase()) ? "specialVariable" : "variable", value, line, column);
				}
			}()
		],
		
		namedIdentRules: {
			custom: [
				function(context) {
					var prevToken = context.tokens[context.index - 1];
					if (!prevToken) {
						return true;
					}
					
					//must be first thing on the line that's not a continuation (preceded by "`" operator)
					if (prevToken.name === "default" && prevToken.value.indexOf("\n") >= 0) {
						prevToken = context.tokens[context.index - 2];
						if (prevToken && prevToken.name === "operator" && prevToken.value === "`") {
							return false;
						}
						
						return true;
					}
					
					//if it follows an equals sign, that's cool, too
					prevToken = sunlight.util.getPreviousNonWsToken(context.tokens, context.index);
					if (prevToken && ((prevToken.name === "operator" && prevToken.value === "=") || (prevToken.name === "punctuation" && prevToken.value === "{"))) {
						return true;
					}
					
					return false;
				}
			],
			
			between: [
				//type coercion
				{ opener: { token: "punctuation", values: ["["] }, closer: { token: "punctuation", values: ["]"] } }
			]
		},
		
		operators: [
			"@(",
			"::",
			"..", ".",
			"=",
			"!=", "!",
			"|",
			">>", ">",
			"++", "+=", "+",
			"`",
			"*=", "*",
			"/=", "/",
			"--", "-=", "-",
			"%{", "%=", "%",
			"${",
			"&"
		]

	});
}(this["Sunlight"]));