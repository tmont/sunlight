(function(sunlight, undefined){

	if (sunlight === undefined || sunlight["registerLanguage"] === undefined) {
		throw "Include sunlight.js before including language files";
	}
	
	//keep track of all user defined functions so we can highlight them later
	var userDefinedFunctions = [];
	
	sunlight.registerLanguage("haskell", {
		//http://www.haskell.org/haskellwiki/Keywords
		keywords: [
			"as","case","of","class","datafamily","datainstance","data","default","derivinginstance","deriving",
			"do","forall","foreign","hiding","if","then","else","import","infix","infixl","infixr","instance",
			"let","in","mdo","module","newtype","proc","qualified","rec","typefamily","typeinstance","type","where"
		],
		
		customParseRules: [
			//character literals, e.g. 'a'
			function(context) {
				var peek = context.reader.peek();
				if (context.reader.current() !== "'" && peek !== "'") {
					return null;
				}
				
				//to differentiate from template haskell, we'll just assume that character literals
				//are exactly one character long (or two for \' and \\) and delimited by '
				
				var expectedEnd = 2;
				if (peek && peek === "\\") {
					expectedEnd++;
				}
				
				if (!/'$/.test(context.reader.peek(expectedEnd))) {
					//doesn't end with an apostrophe, so it's a template operator
					return null;
				}
				
				var line = context.reader.getLine(), column = context.reader.getColumn();
				return context.createToken("char", "'" + context.reader.read(expectedEnd), line, column);
			},
			
			//look for user defined functions
			function(context) {
				if (!context.reader.isSol()) {
					return null;
				}
				
				//read the ident, if a :: operator follows it, then it's a function definition (i guess, like i know anything about haskell)
				if (!/[A-Za-z_]/.test(context.reader.current())) {
					return null;
				}
				
				var peek, value = context.reader.current(), count = 1;
				while ((peek = context.reader.peek(++count)) && peek.length === count) {
					if (!/[\w']$/.test(peek)) {
						break;
					}
				}
				
				var ident = context.reader.current() + peek.substring(0, peek.length - 1);
				
				//should be some whitespace, and then ::
				while ((peek = context.reader.peek(++count)) && peek.length === count) {
					if (!/\s$/.test(peek)) {
						if (!/::$/.test(context.reader.peek(++count))) {
							return null;
						}
						
						//yay it's a function!
						var line = context.reader.getLine(), column = context.reader.getColumn();
						userDefinedFunctions.push(ident);
				
						context.reader.read(ident.length - 1); //already read the first character
						return context.createToken("ident", ident, line, column);
					}
				}
				
				return null;
			}
		],
		
		customTokens: {
			"function": {
				values: [
					"abs","acosh","acos","all","and","any","appendFile","asinh","asin","asTypeOf","atan2","atanh",
					"atan","break","catch","ceiling","compare","concatMap","concat","const","cosh","cos","curry",
					"cycle","decodeFloat","divMod","div","dropWhile","drop","either","elem","encodeFloat","enumFromThenTo",
					"enumFromThen","enumFromTo","enumFrom","error","even","exponent","exp","fail","filter","flip",
					"floatDigits","floatRadix","floatRange","floor","fmap","foldl1","foldl","foldr1","foldr","fromEnum",
					"fromInteger","fromIntegral","fromRational","fst","gcd","getChar","getContents","getLine","head",
					"id","init","interact","ioError","isDenormalized","isIEEE","isInfinite","isNaN","isNegativeZero",
					"iterate","last","lcm","length","lex","lines","logBase","log","lookup","mapM_","mapM","map",
					"maxBound","maximum","max","maybe","minBound","minimum","min","mod","negate","notElem","not",
					"null","odd","or","otherwise","pi","pred","print","product","properFraction","putChar","putStrLn",
					"putStr","quotRem","quot","readFile","readIO","readList","readLn","readParen","readsPrec","reads",
					"realToFrac","read","recip","rem","repeat","replicate","return","reverse","round","scaleFloat",
					"scanl1","scanl","scanr1","scanr","sequence_","sequence","seq","showChar","showList","showParen",
					"showsPrec","showString","shows","show","significand","signum","sinh","sin","snd","splitAt","sqrt",
					"subtract","succ","sum","tail","takeWhile","take","tanh","tan","toEnum","toInteger","toRational",
					"truncate","uncurry","undefined","unlines","until","unwords","unzip3","unzip","userError","words",
					"writeFile","zip3","zipWith3","zipWith","zip"
				],
				boundary: "\\b"
			}
		},
		
		scopes: {
			string: [ ["\"", "\"", sunlight.util.escapeSequences.concat(["\\\""])] ],
			comment: [ ["--", "\n", null, true], ["{-", "-}"] ],
			infixOperator: [ ["`", "`", ["\\`"]] ]
		},
		
		identFirstLetter: /[A-Za-z_]/,
		identAfterFirstLetter: /[\w']/,

		namedIdentRules: {
			custom: [
				function(context) {
					return sunlight.util.contains(userDefinedFunctions, context.tokens[context.index].value);
				}
			]
		},

		operators: [
			":", "::",
			
			"=>", "=",
			"@",
			"[|", "|]",
			"\\\\", "\\",
			"/=", "/",
			"++", "+",
			"-<<", "-<", "->", "-",
			"&&",
			
			"!!", "!",
			"''", "'",
			"??", "?",
			"#",
			"<-", "<=", "<",
			">@>", ">>=", ">>", ">=", ">",
			"^^", "^",
			"**", "*",
			"||", "|",
			"~",
			"_",
			"..", "."
			
		]
	});
}(window["Sunlight"]));