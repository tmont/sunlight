(function(sunlight, undefined){

	if (sunlight === undefined || sunlight["registerLanguage"] === undefined) {
		throw "Include sunlight.js before including language files";
	}

	var phpAnalyzer = sunlight.createAnalyzer();
	phpAnalyzer.enter_languageConstruct = function(context) { context.append("<a class=\"sunlight-language-construct sunlight-php\" href=\"http://php.net/" + context.tokens[context.index].value + "\">") };
	phpAnalyzer.exit_languageConstruct = function(context) { context.append("</a>") };
	phpAnalyzer.enter_function = function(context) { context.append("<a class=\"sunlight-function sunlight-php\" href=\"http://php.net/" + context.tokens[context.index].value + "\">") };
	phpAnalyzer.exit_function = function(context) { context.append("</a>") };
	
	sunlight.registerLanguage("php", {
		keywords: [
			//class qualifiers
			"public", "private", "protected", "static", "final", "abstract",
			
			//class extension
			"extends", "implements",

			//member qualifiers
			"const", "var",

			//types
			"class", "interface",

			//primitives
			"integer", "boolean", "int", "bool", "double", "float", "real", "string",

			//literals
			"null", "true", "false",

			//looping
			"for", "foreach", "do", "while", "as", "endwhile", "endfor", "endforeach",

			//scoping
			"namespace",

			//flow control
			"if", "else", "elseif", "try", "catch", "break", "continue", "goto", "case", "throw", "switch", "endif", "endswitch", "endwhile",

			//type comparison
			"instanceof",
			
			//closures
			"use",
			
			//logic
			"and", "or", "xor",
			
			//oo
			"self", "parent", "clone",

			//other
			"default", "new", "function", "declare", "enddeclare", "global"
		],
		
		customTokens: {
			"function": {
				values: ["constant","bin2hex","sleep","usleep","time_nanosleep","time_sleep_until","flush","wordwrap","htmlspecialchars","htmlentities","html_entity_decode","htmlspecialchars_decode","get_html_translation_table","sha1","sha1_file","md5","md5_file","crc32","iptcparse","iptcembed","getimagesize","image_type_to_mime_type","image_type_to_extension","phpinfo","phpversion","phpcredits","php_logo_guid","php_real_logo_guid","php_egg_logo_guid","zend_logo_guid","php_sapi_name","php_uname","php_ini_scanned_files","php_ini_loaded_file","strnatcmp","strnatcasecmp","substr_count","strspn","strcspn","strtok","strtoupper","strtolower","strpos","stripos","strrpos","strripos","strrev","hebrev","hebrevc","nl2br","basename","dirname","pathinfo","stripslashes","stripcslashes","strstr","stristr","strrchr","str_shuffle","str_word_count","str_split","strpbrk","substr_compare","strcoll","substr","substr_replace","quotemeta","ucfirst","lcfirst","ucwords","strtr","addslashes","addcslashes","rtrim","str_replace","str_ireplace","str_repeat","count_chars","chunk_split","trim","ltrim","strip_tags","similar_text","explode","implode","join","setlocale","localeconv","soundex","levenshtein","chr","ord","parse_str","str_getcsv","str_pad","chop","strchr","sprintf","printf","vprintf","vsprintf","fprintf","vfprintf","sscanf","fscanf","parse_url","urlencode","urldecode","rawurlencode","rawurldecode","http_build_query","readlink","linkinfo","symlink","link","unlink","exec","system","escapeshellcmd","escapeshellarg","passthru","shell_exec","proc_open","proc_close","proc_terminate","proc_get_status","rand","srand","getrandmax","mt_rand","mt_srand","mt_getrandmax","getservbyname","getservbyport","getprotobyname","getprotobynumber","getmyuid","getmygid","getmypid","getmyinode","getlastmod","base64_decode","base64_encode","convert_uuencode","convert_uudecode","abs","ceil","floor","round","sin","cos","tan","asin","acos","atan","atanh","atan2","sinh","cosh","tanh","asinh","acosh","expm1","log1p","pi","is_finite","is_nan","is_infinite","pow","exp","log","log10","sqrt","hypot","deg2rad","rad2deg","bindec","hexdec","octdec","decbin","decoct","dechex","base_convert","number_format","fmod","inet_ntop","inet_pton","ip2long","long2ip","getenv","putenv","getopt","microtime","gettimeofday","uniqid","quoted_printable_decode","quoted_printable_encode","convert_cyr_string","get_current_user","set_time_limit","get_cfg_var","magic_quotes_runtime","set_magic_quotes_runtime","get_magic_quotes_gpc","get_magic_quotes_runtime","import_request_variables","error_log","error_get_last","call_user_func","call_user_func_array","call_user_method","call_user_method_array","forward_static_call","forward_static_call_array","serialize","unserialize","var_dump","var_export","debug_zval_dump","print_r","memory_get_usage","memory_get_peak_usage","register_shutdown_function","register_tick_function","unregister_tick_function","highlight_file","show_source","highlight_string","php_strip_sunlight.helpers.whitespace","ini_get","ini_get_all","ini_set","ini_alter","ini_restore","get_include_path","set_include_path","restore_include_path","setcookie","setrawcookie","header","header_remove","headers_sent","headers_list","connection_aborted","connection_status","ignore_user_abort","parse_ini_file","parse_ini_string","is_uploaded_file","move_uploaded_file","gethostbyaddr","gethostbyname","gethostbynamel","gethostname","dns_check_record","checkdnsrr","dns_get_mx","getmxrr","dns_get_record","intval","floatval","doubleval","strval","gettype","settype","is_null","is_resource","is_bool","is_long","is_float","is_int","is_integer","is_double","is_real","is_numeric","is_string","is_array","is_object","is_scalar","is_callable","pclose","popen","readfile","rewind","rmdir","umask","fclose","feof","fgetc","fgets","fgetss","fread","fopen","fpassthru","ftruncate","fstat","fseek","ftell","fflush","fwrite","fputs","mkdir","rename","copy","tempnam","tmpfile","file","file_get_contents","file_put_contents","stream_select","stream_context_create","stream_context_set_params","stream_context_get_params","stream_context_set_option","stream_context_get_options","stream_context_get_default","stream_context_set_default","stream_filter_prepend","stream_filter_append","stream_filter_remove","stream_socket_client","stream_socket_server","stream_socket_accept","stream_socket_get_name","stream_socket_recvfrom","stream_socket_sendto","stream_socket_enable_crypto","stream_socket_shutdown","stream_socket_pair","stream_copy_to_stream","stream_get_contents","stream_supports_lock","fgetcsv","fputcsv","flock","get_meta_tags","stream_set_write_buffer","set_file_buffer","set_socket_blocking","stream_set_blocking","socket_set_blocking","stream_get_meta_data","stream_get_line","stream_wrapper_register","stream_register_wrapper","stream_wrapper_unregister","stream_wrapper_restore","stream_get_wrappers","stream_get_transports","stream_resolve_include_path","stream_is_local","get_headers","stream_set_timeout","socket_set_timeout","socket_get_status","realpath","fnmatch","fsockopen","pfsockopen","pack","unpack","get_browser","crypt","opendir","closedir","chdir","getcwd","rewinddir","readdir","dir","scandir","glob","fileatime","filectime","filegroup","fileinode","filemtime","fileowner","fileperms","filesize","filetype","file_exists","is_writable","is_writeable","is_readable","is_executable","is_file","is_dir","is_link","stat","lstat","chown","chgrp","chmod","touch","clearstatcache","disk_total_space","disk_free_space","diskfreespace","realpath_cache_size","realpath_cache_get","mail","ezmlm_hash","openlog","syslog","closelog","define_syslog_variables","lcg_value","metaphone","ob_start","ob_flush","ob_clean","ob_end_flush","ob_end_clean","ob_get_flush","ob_get_clean","ob_get_length","ob_get_level","ob_get_status","ob_get_contents","ob_implicit_flush","ob_list_handlers","ksort","krsort","natsort","natcasesort","asort","arsort","sort","rsort","usort","uasort","uksort","shuffle","array_walk","array_walk_recursive","count","end","prev","next","reset","current","key","min","max","in_array","array_search","extract","compact","array_fill","array_fill_keys","range","array_multisort","array_push","array_pop","array_shift","array_unshift","array_splice","array_slice","array_merge","array_merge_recursive","array_replace","array_replace_recursive","array_keys","array_values","array_count_values","array_reverse","array_reduce","array_pad","array_flip","array_change_key_case","array_rand","array_unique","array_intersect","array_intersect_key","array_intersect_ukey","array_uintersect","array_intersect_assoc","array_uintersect_assoc","array_intersect_uassoc","array_uintersect_uassoc","array_diff","array_diff_key","array_diff_ukey","array_udiff","array_diff_assoc","array_udiff_assoc","array_diff_uassoc","array_udiff_uassoc","array_sum","array_product","array_filter","array_map","array_chunk","array_combine","array_key_exists","pos","sizeof","key_exists","assert","assert_options","version_compare","str_rot13","stream_get_filters","stream_filter_register","stream_bucket_make_writeable","stream_bucket_prepend","stream_bucket_append","stream_bucket_new","output_add_rewrite_var","output_reset_rewrite_vars","sys_get_temp_dir"],
				boundary: "\\b"
			},
			
			languageConstruct: { 
				values: [
					"isset", "array", "unset", "list", "echo", "include", "include_once", 
					"require", "require_once", "print", "empty", "return", "die", "eval", "exit"
				],
				
				boundary: "\\b"
			},
			
			constant: {
				values: ["__CLASS__", "__DIR__", "__FILE__", "__LINE__", "__FUNCTION__", "__METHOD__", "__NAMESPACE__"],
				boundary: "\\b"
			},
			
			openTag: {
				values: ["<?php"],
				boundary: "\\s"
			},
			
			shortOpenTag: {
				values: ["<?=", "<?"],
				boundary: ""
			},
			
			closeTag: {
				values: ["?>"],
				boundary: ""
			}
		},

		scopes: {
			string: [ ["\"", "\"", sunlight.util.escapeSequences.concat(["\\\""])], ["'", "'", ["\\\'", "\\\\"]] ],
			comment: [ ["//", "\n", null, true], ["/*", "*/"], ["#", "\n", null, true] ],
			variable: [ ["$", { length: 1, regex: /[^\$A-Za-z0-9_]/ }, null, true] ]
		},
		
		customParseRules: [
			//heredoc/nowdoc
			function(context) {
				if (context.reader.current() !== "<" || context.reader.peek(2) !== "<<") {
					return null;
				}
				
				var value = "<<<";
				var line = context.reader.getLine();
				var column = context.reader.getColumn();
				context.reader.read(2);
				
				var ident = "", isNowdoc = false;
				var peek = context.reader.peek();
				while (peek !== context.reader.EOF && peek !== "\n") {
					value += context.reader.read();
					
					if (peek !== "'") {
						//ignore NOWDOC apostophres
						ident += context.reader.current();
					} else {
						isNowdoc = true;
					}
					
					peek = context.reader.peek();
				}
				
				//read the newline
				value += context.reader.read();
				
				//read until "\n{ident};"
				while (!context.reader.isEof()) {
					if (context.reader.peek(ident.length + 2) === "\n" + ident + ";") {
						break;
					}
					
					value += context.reader.read();
				}
				
				value += context.reader.read(ident.length + 1); //don't read the semicolon
				return context.createToken(isNowdoc ? "nowdoc" : "heredoc", value, line, column);
			}
		],

		identFirstLetter: /[A-Za-z_]/,
		identAfterFirstLetter: /\w/,

		namedIdentRules: {
			follows: [
				//extends/implements class names
				[{ token: "ident" }, sunlight.util.whitespace, { token: "keyword", values: ["extends", "implements"] }, sunlight.util.whitespace],

				[{ token: "keyword", values: ["class", "interface", "abstract", "final", "new"] }, sunlight.util.whitespace],
			],
			
			precedes: [
				//static method calls
				[sunlight.util.whitespace, { token: "operator", values: ["::"] }],
				
				[{ token: "default" }, { token: "variable" }],
			],

			between: [
				{ opener: { token: "keyword", values: ["implements"] }, closer: { token: "punctuation", values: ["{"] } }
			]
		},

		operators: [
			//member access
			"::", "->",
			
			//arithmetic
			"++", "+=", "+",
			"--", "-=", "-",
			      "*=", "*",
			      "/=", "/",
			      "%=", "%",

			//boolean
			"&&", "||",

			//bitwise
			"|=",   "|",
			"&=",   "&",
			"^=",   "^",
			">>=", ">>",
			"<<=", "<<",

			//inequality
			"<=", "<",
			">=", ">",
			"===", "==", "!==", "!=",

			//unary
			"!", "~",

			//other
			"?:", "?", ":", ".=", ".", "=>", "="
		],
		
		analyzer: phpAnalyzer
	});
}(window["Sunlight"]));