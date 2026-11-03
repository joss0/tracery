// Loads the engine in a fresh vm context, exactly as a browser <script> would.
// TRACERY_DIR lets the same suite run against another checkout for comparison.
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var dir = process.env.TRACERY_DIR || path.join(__dirname, "..");

function load() {
	var ctx = vm.createContext({ console: { log: function() {}, warn: function() {} } });
	["mods-eng-basic.js", "tracery.js"].forEach(function(f) {
		var file = path.join(dir, "js", "tracery", f);
		vm.runInContext(fs.readFileSync(file, "utf8"), ctx, { filename: file });
	});
	return ctx;
}

// A grammar with the English modifiers and rng pinned to the first rule.
function grammar(raw, settings) {
	var ctx = load();
	var g = ctx.tracery.createGrammar(raw, settings);
	g.addModifiers(ctx.baseEngModifiers);
	ctx.tracery.setRng(function() { return 0; });
	return g;
}

module.exports = { load: load, grammar: grammar, dir: dir };
