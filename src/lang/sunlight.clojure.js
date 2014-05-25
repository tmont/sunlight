(function(sunlight, undefined){

	var specialForms = [
		"def", "defmethod", "defstruct", "defrecord", "definline", "defn-", "defn", "defmacro", "deftype", "definterface", "defmulti", "defonce", "defprotocol",
		"if", "do", "let", "quote", "var", "fn", "loop", "recur", "monitor-enter", "monitor-exit",
		".", "new", "set!", ".."
	];
	var exceptionForms = [
		"throw", "try", "catch", "finally"
	];
	var misc = [
		// core dynamic vars
		"*compile-path*", "*ns*", "*print-level*", "*allow-unresolved-vars*", "*data-readers*", "*unchecked-math*",
		"*math-context*", "*read-eval*", "*compile-files*", "*command-line-args*", "*warn-on-reflection*",
		"*flush-on-newline*", "*out*", "*print-length*", "*file*", "*verbose-defrecords*", "*clojure-version*",
		"*use-context-classloader*", "*err*", "*default-data-reader-fn*", "*agent*", "*print-dup*", "*print-readably*",
		"*fn-loader*", "*print-meta*", "*in*", "*source-path*", "*compiler-options*", "*assert*", "*1", "*2", "*3", "*e",
		// constants
		"EMPTY_NODE", "char-escape-string", "default-data-readers", "char-name-string", "primitives-classnames"
	];
	var coreForms = [
		// general functions
		"sorted-map", "read-line", "re-pattern", "unchecked-inc-int", "val", "find-protocol-impl",
		"vector-of", "object-array", "max-key", "list*", "ns-aliases", "booleans", "the-ns", "==", "chunk-buffer", "longs",
		"shorts", "format", "empty", "dorun", "remove-method", "gensym", "not=", "unchecked-multiply",
		"bit-or", "aset-byte", "send-via", "hash-set", "->Vec", "add-watch", "unchecked-dec", "some", "boolean-array",
		"second", "keys", "long-array", "pop-thread-bindings", "error-mode", "bit-set", "spit", "find-protocol-method",
		"short-array", "ns-unalias", "ns-publics", "char-array", "all-ns", "long", "init-proxy", "add-classpath",
		"await1", "short", "ns-unmap", "repeat", "zipmap", "distinct", "get-in", "bit-xor",
		"complement", "get-validator", "ref-max-history", "promise", "set-agent-send-executor!", "-'", "pop!", "derive",
		"aset-float", "extend", "-reset-methods", "commute", "partition-by", "rem",
		"mapv", "filterv", "proxy-call-with-super",
		"ns-interns", "re-matches", "split-with", "munge", "next", "deliver", "symbol", "vals", "->ArrayChunk",
		"select-keys", "re-matcher", "rand", "deref", "unchecked-inc", "read", "sequence", "make-hierarchy", "+",
		"assoc!", "descendants", "into-array", "last", "some-fn", "unchecked-negate",
		"alter", "prn", "with-meta", "floats", "*", "butlast", "-",
		"rseq", "send-off", "print", "vary-meta", "agent-error",
		"bit-flip", "bit-and", "re-groups", "newline", "replicate", "keep-indexed",
		"remove-ns", "xml-seq", "vec", "concat", "update-in", "vector", "with-bindings*", "conj", "bases",
		"/", "unchecked-add", "ref-set", "assoc", "unchecked-remainder-int", "seque", "aset-char", "boolean", "read-string", "float-array",
		"doubles", "future-call", "remove-watch", "print-str", "ref-history-count", "rsubseq",
		"split-at", "chunk-cons", "ns-refers", "create-struct", "int-array", "unchecked-long", "float",
		"map", "+'", "double-array", "accessor", "frequencies", "chars", "rand-int",
		"aset-short", "unchecked-short", "prn-str", "iterate", "chunk-append", "unchecked-double", "slurp", "restart-agent",
		"unchecked-int", "mapcat", "assoc-in", "get-thread-bindings", "ref", "conj!", "find-var", "inc", "future-cancel",
		"every-pred", "bound-fn*", "unchecked-subtract", "ns-name", "shuffle", "re-find",
		"bit-not", "construct-proxy", "ref-min-history", "destructure", "seq", "intern", "unchecked-multiply-int", "to-array-2d",
		"sorted-map-by", "filter", "->VecNode", "alter-meta!", "unchecked-dec-int",
		"key", "class", "re-seq", "-cache-protocol-fn", "test", "print-dup", "create-ns", "name", "nthrest", "aset", "nnext",
		"doall", "extenders", "macroexpand-1", "resultset-seq", "reductions", "into",
		"transient", "ffirst", "bit-clear", "proxy-name", "load-reader", "with-redefs-fn", "hash", "inc'",
		"print-ctor", "drop-last", "replace", "parents", "prefers", "numerator", "quot",
		"chunk-rest", "unchecked-negate-int", "file-seq", "send", "reverse", "count", "get-proxy-class",
		"set", "ex-info", "unchecked-subtract-int", "comp", "nth", "byte", "dissoc!", "constantly", "load", "namespace", "pr-str",
		"<", "rationalize", "sort-by", "->VecSeq", "cycle", "peek", "denominator", "reduce", "interleave", "cons", "macroexpand", "var-set",
		"str", "aset-boolean", "ns-imports", "remove-all-methods", "first", "bean", "=", "memoize", "var-get", "unchecked-float", "range",
		"tree-seq", "set-validator!", "aset-double", "*'", "unchecked-divide-int", "enumeration-seq", "prefer-method",
		"partition-all", "ensure", "reduced", "find-ns", "struct-map", ">", "max", "proxy-mappings", "identity", "ints", "fnext",
		"biginteger", "min-key", "reset-meta!", "push-thread-bindings", "unchecked-add-int", "subs", "compile", "agent-errors",
		"clear-agent-errors", "printf", "ns-resolve", "method-sig", ">=", "shutdown-agents", "reduce-kv", "reset!",
		"require", "bit-shift-left", "dec'", "methods", "compare", "sorted-set-by", "cast",
		"namespace-munge", "supers", "pcalls", "load-string", "group-by", "get", "<=", "await", "resolve", "bytes", "print-method", "loaded-libs",
		"fnil", "force", "partial", "pmap", "comparator", "char", "take-while", "refer", "underive", "in-ns",
		"iterator-seq", "ancestors", "hash-combine", "persistent!", "partition", "map-indexed", "update-proxy",
		"interpose", "chunk", "aset-int", "load-file", "apply", "swap!", "subvec",
		"byte-array", "rest", "keyword", "ns-map", "set-error-mode!", "int", "release-pending-sends", "mod", "bigdec", "nfirst", "nthnext",
		"aset-long", "struct", "array-map", "unchecked-char", "bigint", "dec", "println", "aget", "find-keyword", "pr", "drop", "clojure-version",
		"eval", "aclone", "pop", "atom", "bit-shift-right",
		"num", "disj", "merge-with", "take-nth", "double",
		"take-last", "line-seq", "take", "unchecked-byte", "make-array", "rand-nth", "alias", "use",
		"juxt", "alength", "chunk-first", "to-array", "hash-map", "bit-and-not",
		"compare-and-set!", "type", "repeatedly", "trampoline", "set-error-handler!", "remove", "find", "drop-while", "not-empty",
		"flatten", "ex-data", "set-agent-send-off-executor!", "println-str", "list", "chunk-next", "flush", "sort",
		"dissoc", "not", "error-handler", "get-method", "agent", "sorted-set", "alter-var-root", "merge", "subseq", "min",
		"print-simple", "bit-test", "await-for", "keep", "disj!", "meta",
		// Predicates
		"keyword?", "chunked-seq?", "instance?", "sequential?", "fn?", "nil?", "string?", "sorted?", "false?",
		"true?", "odd?", "symbol?", "thread-bound?", "future-done?", "number?", "integer?", "reduced?", "reversible?",
		"seq?", "identical?", "zero?", "char?", "distinct?", "ratio?", "neg?", "isa?", "extends?", "future?", "vector?",
		"counted?", "class?", "special-symbol?", "var?", "empty?", "list?", "not-any?", "associative?", "float?",
		"decimal?", "map?", "not-every?", "even?", "future-cancelled?", "bound?", "pos?", "contains?", "ifn?",
		"delay?", "realized?", "rational?", "set?", "coll?", "every?", "satisfies?",
		// Macros
		"cond->>", "bound-fn", "doseq", "if-not", "letfn", "dosync", "with-open", "gen-interface", "sync", "dotimes",
		"lazy-cat", "with-in-str", "import", "with-out-str", "when-not", "time", "for", "cond", "some->", "->>","refer-clojure", "with-loading-context", "future", "with-redefs","doto", "proxy-super", "assert", "memfn", "when-first", "pvalues",
		"comment","ns", "with-precision","extend-type", "or", "as->", "condp", "with-local-vars", "with-bindings", "when-let", "amap", "->", "while", "case", "if-let", "extend-protocol", "and", "declare", "locking", "delay", "proxy", "reify",
		"gen-class", "io!", "lazy-seq", "when", "areduce", "some->>", "cond->", "binding"
	];

	if (sunlight === undefined || sunlight["registerLanguage"] === undefined) {
		throw "Include sunlight.js before including language files";
	}

	sunlight.registerLanguage("clojure", {
		keywords: specialForms,
		scopes: {
			string: [
				[
				"\"",
				"\"",
				["\\\""]
				]
			],
			comment: [
				[
					";",
					"\n"
				]
			],
			regex: [
				[
					"#\"",
					"\"",
					["\\\""]
				]
			]
		},

		identFirstLetter: /[a-zA-Z\*\+\-!\?_]/,
		identAfterFirstLetter: /[^\s,#%&()\[\]{}]/,

		customTokens: {
			'named-ident': {
				values: coreForms,
				boundary: "[\\s\\(\\),{}\\[\\]]"
			},
			constant: {
				values: misc,
				boundary: "[\\s\\(\\),{}\\[\\]]"
			},
			variable: {
				values: exceptionForms,
				boundary: "[\\s\\(\\),{}\\[\\]]"
			},
			boolean: {
				values: ["true", "false"],
				boundary: "[\\s\\(\\),{}\\[\\]]"
			}
		},
		customParseRules: [
			// characters
			function(context) {
				if (context.reader.current() !== "\\") {
					return null;
				}

				var charNameStrings = ["\\space", "\\backspace", "\\tab", "\\newline", "\\formfeed", "\\return"];
				var map = sunlight.util.createHashMap(charNameStrings, "\\b", false);
				var tok = sunlight.util.matchWord(context, map, "char", false);

				if (tok !== null) {
					return tok;
				}

				var value = "\\" + context.reader.read(1);
				var line = context.reader.getLine();
				var column = context.reader.getColumn();
				return context.createToken("char", value, line, column);
			},

			// keywords
			function(context) {
				if(context.reader.current() !== ":") {
					return null;
				}
				var value = /^:[^\s(){}\[\],]+/.exec(context.reader.substring())[0];
				var tok =  context.createToken("symbol", value, context.reader.getLine(), context.reader.getColumn());
				context.reader.read(value.length - 1);
				return tok;
			}
		],

		caseInsensitive: false,

		doNotParse: /\s/,

		contextItems: {
			userDefinedFunctions: []
		},

		operators: []
	});
}(this["Sunlight"]));
