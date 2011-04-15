(function(sunlight, document, undefined){

	if (sunlight === undefined || sunlight["registerLanguage"] === undefined) {
		throw "Include sunlight.js before including language files";
	}

	sunlight.registerLanguage("cpp", {
		keywords: [
			"caller","die","dump","eval","exit","goto","last","next","redo","return","sub","wantarray",
			"break","continue","given","when","default",
			"import"," local"," my","our"," state",
			"do","no","package","require","use",
			"bless","dbmclose","dbmopen","ref","tied","untie","tie",
			
			"not", "or", "and"
		],
		
		customTokens: {
			"function": {
				values: [
					"chomp","chop","chr","crypt","hex","index","length","oct","ord","rindex","sprintf","substr",
					"pos","quotemeta","split","study",
					"abs","atan2","cos","exp","hex","int","log","oct","rand","sin","sqrt","srand",
					"pop","push","shift","splice","unshift",
					"grep","join","map","reverse","sort",
					"delete","each","exists","keys","values",
					"binmode","closedir","close","eof","fileno","flock","format","getc","print","printf","readdir","rewinddir",
					"say","seekdir","seek","select","syscall","sysread","sysseek","tell","telldir","truncate","warn","write",
					"pack","syswrite","unpack","vec",

					"chdir","chmod","chown","chroot","fcntl","glob","ioctl","link","lstat","mkdir","open","opendir","readlink","rename","rmdir","stat","symlink","sysopen","umask","unlink","utime",
					"defined","dump","eval","formline","reset","scalar","undef",
					"alarm","exec","fork","getpgrp","getppid","getpriority","kill","pipe","setpgrp","setpriority","sleep","system","wait","waitpid",
					"accept","bind","connect","getpeername","getsockname","getsockopt","listen","recv","send","setsockopt","shutdown","socket","socketpair"
					"msgctl","msgget","msgrcv","msgsnd","semctl","semget","semop","shmctl","shmget","shmread","shmwrite",
					"endgrent","endhostent","endnetent","endpwent","getgrent","getgrgid","getgrnam","getlogin","getpwent","getpwnam","getpwuid","setgrent","setpwent",
					"endprotoent","endservent","gethostbyaddr","gethostbyname","gethostent","getnetbyaddr","getnetbyname","getnetent","getprotobyname","getprotobynumber",
					"getprotoent","getservbyname","getservbyport","getservent","sethostent","setnetent","setprotoent","setservent",
					"gmtime","localtime","times","time",

					"lcfirst","lc","lock","prototype","readline","read",
					"readpipe","uc","ucfirst"
				],
				boundary: "\\b"
			},
			
			specialOperator: {
				values: [
					"qr//","qw//","qx//","tr///","y///","m//","s///","-X","q//","qq//"
				],
				boundary: ""
			},
			
			specialVariable: {
				values: [
					"$.", "$<", "$_",
				],
				boundary: ""
			}
		},

		scopes: {
			string: [ ["\"", "\"", sunlight.util.escapeSequences.concat(["\\\""])], ["'", "'", ["\\\'", "\\\\"]] ],
			comment: [ ["#", "\n", null, true] ],
			variable: [ ["$", { length: 1, regex: /[\W]/ }, null, true], ["@", { length: 1, regex: /[\W]/ }, null, true], ["%", { length: 1, regex: /[\W]/ }, null, true] ]
		},
		
		customParseRules: [	
		],

		identFirstLetter: /[A-Za-z_]/,
		identAfterFirstLetter: /\w/,

		namedIdentRules: {
			custom: [
			],
			
			follows: [
			],
			
			precedes: [
			]
		},
		
		operators: [
			"++", "+=", "+",
			"--", "-=", "-",
			"**=", "**", "*=", "*",
			"//=", "/=", "//", "/",
			"%=", "%",
			"=>", "=~", "==", "=",
			"!", "!~", "!=",
			"~", "~~",
			"\\",
			
			"&&=", "&=", "&&", "&", 
			"||=", "||", "|=", "|",
			
			"<<=", "<=>", "<<", "<=", "<",
			">>=", ">>", ">=", ">",
			"^=", "^",
			
			"?", ":",
			
			"...", ".=", "..", ".",''
			
			",",
			
			"x=", "x",
			
			"lt", "gt", "le", "ge", "eq", "ne", "cmp"
		]
		
	});
}(window["Sunlight"], document));