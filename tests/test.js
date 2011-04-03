if (!console || !console.log || !console.error) {
	console = function() {
		var log = function() { 
			var pre = document.createElement("pre");
			document.body.appendChild(pre);
			return function(text) {
				pre.appendChild(document.createTextNode(text));
				pre.appendChild(document.createTextNode("\n-------------------\n"));
			}
		}();
		
		return {
			log: log,
			error: log
		}
	}();
}

var start = new Date();
Sunlight.highlightAll();
console.log("highlighting time: " + (new Date().getTime() - start.getTime()) + "ms");

//tests
var tags = document.getElementById("code").getElementsByTagName("*");
var nbsp = String.fromCharCode(0x00a0);
function exists(className, content) {
	content = content.replace(/ /g, nbsp).replace(/\t/g, nbsp + nbsp + nbsp + nbsp);
	var searched = 0;
	var regex = new RegExp("\s*sunlight-" + className + "\s*");
	for (var i = 0; i < tags.length; i++) {
		if (regex.test(tags[i].className)) {
			searched++;
			if (tags[i].firstChild && tags[i].firstChild.nodeValue === content) {
				return { nodes: searched, passed: true };
			}
		}
	}
	
	return { nodes: searched, passed: false };
}

function assertExists(className, content, description) {
	var data = exists(className, content);
	description = description + " (found " + data.nodes + " matching nodes)";
	if (data.passed) {
		console.log("pass: " + description);
	} else{
		console.error("fail: " + description);
	}
}