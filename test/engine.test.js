var test = require("node:test");
var assert = require("node:assert");
var h = require("./helpers");
var path = require("path");

function flat(raw, rule) {
	return h.grammar(raw).flatten(rule);
}

// ---- Parsing of actions

test("push rule may contain a colon", function() {
	assert.equal(flat({}, "[a:b:c]#a#"), "b:c");
	assert.equal(flat({}, "[link:http://x.org]#link#"), "http://x.org");
});

test("#21 nested tag action inside a push keeps the whole rule", function() {
	assert.equal(flat({ d: "D" }, "#[a:FOO#[b:c]d#BAR]a#"), "FOODBAR");
	assert.equal(flat({}, "#[a:FOO#[b:c]d#BAR]a#"), "FOO((d))BAR");
});

test("bare action containing a nested push is not read as a push", function() {
	assert.equal(flat({ b: "B" }, "[#[a:1]b#]x"), "x");
});

test("commas split pushed rules, but not inside tags or nested actions", function() {
	var g = h.grammar({ s: "abc" });
	assert.equal(g.flatten("[v:#s.replace(a,b)#]#v#"), "bbc");
	assert.equal(g.flatten("[w:one,two]#w#"), "one");
	assert.equal(g.flatten("[z:[y:1,2]#y#]#z#"), "1");
});

test("escaped comma in a push is literal", function() {
	assert.equal(flat({}, "[v:a\\,b]#v#"), "a,b");
});

test("#20 commas produced by expansion do not split a pushed rule", function() {
	assert.equal(flat({ c: "orange, blue" }, "[v:#c#]#v#"), "orange, blue");
});

test("#46 tag actions pop when the tag finishes", function() {
	var raw = { origin: "I love #[animal:#cat#]say# and #say#", say: "#animal.s#", animal: "dog", cat: "cat" };
	assert.equal(flat(raw, "#origin#"), "I love cats and dogs");
});

// ---- Escapes

test("several escapes in one rule survive being pushed", function() {
	assert.equal(flat({}, "[a:\\#b\\#c\\#]#a#"), "#b#c#");
	assert.equal(flat({}, "[a:x\\#y\\#z]#a#"), "x#y#z");
});

test("text before a trailing backslash is kept", function() {
	assert.equal(flat({}, "abc\\"), "abc");
});

test("literal text is never mistaken for an escape sentinel", function() {
	assert.equal(flat({}, "DOUBLEBACKSLASH"), "DOUBLEBACKSLASH");
});

test("double backslash is a literal backslash", function() {
	assert.equal(flat({}, "a\\\\b"), "a\\b");
});

// ---- Modifiers and their parameters

test("capitalizing a missing symbol keeps its name", function() {
	assert.equal(flat({}, "#hero.capitalize#"), "((hero))");
});

test("#21 a symbol pushed from its own expansion stays usable", function() {
	var raw = { power: "frost", t: "the amulet of #power#", s: "When you need #power#, seek #[power:#power#]t#!" };
	assert.equal(flat(raw, "#s#"), "When you need frost, seek the amulet of frost!");
});

test("modifier parameters may contain dots", function() {
	assert.equal(flat({ u: "a.com" }, "#u.replace(.com,.org).capitalize#"), "A.org");
});

test("modifier parameters may contain tags", function() {
	var raw = { story: "Ann met Ann", a: "Ann", b: "Bob" };
	assert.equal(flat(raw, "#story.replace(#a#,#b#)#"), "Bob met Bob");
});

test("tags in parameters work inside a pushed rule", function() {
	var raw = { story: "Ann", a: "Ann", b: "Bob" };
	assert.equal(flat(raw, "[v:#story.replace(#a#,#b#)#]#v#"), "Bob");
});

test("modifier parameters can be nested and can escape delimiters", function() {
	assert.equal(flat({ s: "a,b" }, "#s.replace(\\,,;)#"), "a;b");
	assert.equal(flat({ s: "xy", t: "q" }, "#s.replace(x,#t.replace(q,r)#)#"), "ry");
});

test("empty parentheses mean no parameters", function() {
	assert.equal(flat({ s: "dog" }, "#s.capitalize()#"), "Dog");
});

test("replacement text is literal, not a regex replacement pattern", function() {
	assert.equal(flat({ s: "abc" }, "#s.replace(b,$&$&)#"), "a$&$&c");
});

test("#7 modifiers run with the node as this, while tag actions are active", function() {
	var g = h.grammar({ s: "x" });
	var seen;
	g.addModifiers({ see: function(t) { seen = this.grammar.flatten("#v#"); return t; } });
	g.flatten("#[v:inner]s.see#");
	assert.equal(seen, "inner");
});

test("a throwing modifier reports an error instead of aborting", function() {
	var g = h.grammar({ s: "x" });
	g.addModifiers({ boom: function() { throw new Error("nope"); } });
	assert.equal(g.flatten("#s.boom#!"), "x!");
	assert.match(g.errors.join(), /boom/);
});

test("replace with missing parameters leaves the text alone", function() {
	assert.equal(flat({ s: "x" }, "#s.replace#"), "x");
	assert.equal(flat({ s: "x" }, "#s.replace(x)#"), "x");
});

// ---- Bad input must not throw

test("names on Object.prototype are ordinary names", function() {
	assert.equal(flat({}, "#constructor#"), "((constructor))");
	assert.equal(flat({}, "#toString#"), "((toString))");
	assert.equal(flat({}, "[__proto__:x]#__proto__#"), "x");
	assert.equal(flat({ s: "a" }, "#s.toString#"), "a((.toString))");
	assert.equal(flat({ s: "a" }, "#s.constructor#"), "a((.constructor))");
	assert.equal(flat({ hasOwnProperty: "h" }, "#hasOwnProperty#"), "h");
	var evil = JSON.parse('{"__proto__": "p", "o": "#__proto__#"}');
	assert.equal(flat(evil, "#o#"), "p");
	assert.equal({}.polluted, undefined);
});

test("popping an unknown symbol is an error, not a crash", function() {
	var g = h.grammar({});
	assert.equal(g.flatten("a[nope:POP]b"), "ab");
	assert.match(g.errors.join(), /nope/);
});

test("over-popping reports through the node's errors", function() {
	var g = h.grammar({ s: "x" });
	assert.equal(g.flatten("[s:POP]#s#"), "((s))");
	assert.match(g.errors.join(), /too many pops/);
});

test("two symbols in a tag is an error, not a thrown string", function() {
	var g = h.grammar({ a: "A", b: "B" });
	g.flatten("#a[x:1]b#");
	assert.match(g.errors.join(), /multiple/);
});

test("non-string rules do not crash", function() {
	assert.equal(flat({ n: 5 }, "#n#"), "5");
	assert.equal(flat({ n: [5] }, "#n#"), "5");
	assert.equal(flat({ b: true }, "#b#"), "true");
	var g = h.grammar({ o: { x: 1 }, nest: [["a"]], nul: null, e: [] });
	assert.equal(g.flatten("[#o#][#nest#][#nul#][#e#]ok"), "ok");
	assert.ok(g.errors.length >= 4, g.errors.join());
});

test("tag with only actions produces no text", function() {
	assert.equal(flat({}, "a#[x:1]#b"), "ab");
});

test("every recorded error is reachable from the grammar", function() {
	var g = h.grammar({ a: "#b#" });
	g.flatten("[v:#missing#]#a#");
	assert.match(g.errors.join(), /missing/);
	assert.match(g.errors.join(), /'b'/);
	g.flatten("fine");
	assert.equal(g.errors.length, 0);
});

test("non-default distributions report instead of crashing", function() {
	var g = h.grammar({ a: ["x", "y"] });
	g.distribution = "weighted";
	assert.equal(g.flatten("#a#"), "x");
	assert.match(g.errors.join(), /Weighted/);
});

// ---- Runaway grammars (#5)

test("infinite recursion stops with an error", function() {
	var g = h.grammar({ a: "#a#" });
	assert.match(g.flatten("#a#"), /\(\(/);
	assert.match(g.errors.join(), /depth/);
});

test("recursion through actions stops with an error", function() {
	var g = h.grammar({ a: "[x:#a#]y" });
	assert.equal(typeof g.flatten("#a#"), "string");
	assert.match(g.errors.join(), /depth/);
});

test("recursion through bare function actions stops with an error", function() {
	var g = h.grammar({ a: "[#a#]y" });
	assert.equal(typeof g.flatten("#a#"), "string");
	assert.match(g.errors.join(), /depth/);
});

test("recursion through modifier parameters stops with an error", function() {
	var g = h.grammar({ a: "#a.replace(#a#,x)#" });
	assert.equal(typeof g.flatten("#a#"), "string");
	assert.ok(g.errors.length > 0);
});

test("exponential branching stops at the node budget", function() {
	// Wide rather than deep: thirty levels of doubling never reaches the depth limit
	var raw = { s30: "x" };
	for (var i = 0; i < 30; i++) raw["s" + i] = "#s" + (i + 1) + "##s" + (i + 1) + "#";
	var g = h.grammar(raw, { maxNodes: 5000 });
	var out = g.flatten("#s0#");
	assert.match(g.errors.join(), /budget/);
	assert.ok(out.length < 100000);
});

test("exponential text growth stops at the length limit", function() {
	var g = h.grammar({ a: "[x:#x##x#]#a#", x: "xxxxxxxx" }, { maxLength: 100000 });
	var out = g.flatten("#a#");
	assert.match(g.errors.join(), /length/);
	assert.ok(out.length < 1000000);
});

test("deep doubling stops at the depth limit without exhausting the budget", function() {
	var g = h.grammar({ a: "#a##a#" });
	g.flatten("#a#");
	assert.equal(g.errors.length, 1);
	assert.match(g.errors[0], /depth/);
});

test("limits are configurable and legitimate deep recursion still works", function() {
	var raw = { n: "1" };
	for (var i = 0; i < 500; i++) raw["s" + i] = "#s" + (i + 1) + "#";
	raw.s500 = "end";
	assert.equal(h.grammar(raw).flatten("#s0#"), "end");
	var g = h.grammar(raw, { maxDepth: 10 });
	g.flatten("#s0#");
	assert.match(g.errors.join(), /depth/);
});

test("the grammar is usable after hitting a limit", function() {
	var g = h.grammar({ a: "#a##a#", ok: "fine" }, { maxNodes: 100 });
	g.flatten("#a#");
	assert.equal(g.flatten("#ok#"), "fine");
	assert.equal(g.errors.length, 0);
});

// ---- State

test("clearState removes symbols created by actions", function() {
	var g = h.grammar({});
	g.flatten("[v:1]");
	g.clearState();
	assert.equal(g.flatten("#v#"), "((v))");
});

test("clearState restores shuffled decks", function() {
	var g = h.grammar({ a: ["1", "2", "3"] });
	g.distribution = "shuffle";
	var first = g.flatten("#a#");
	g.clearState();
	assert.equal(g.flatten("#a#"), first);
});

test("shuffle draws every rule before repeating (#55)", function() {
	var g = h.grammar({ a: ["1", "2", "3"] });
	g.distribution = "shuffle";
	var out = [g.flatten("#a#"), g.flatten("#a#"), g.flatten("#a#")].sort();
	assert.deepEqual(out, ["1", "2", "3"]);
});

test("usage records do not retain expansion trees", function() {
	var g = h.grammar({ a: "x" });
	g.flatten("#a#");
	var use = g.symbols.a.uses[0];
	assert.equal(use.node.depth, 1);
	assert.equal(use.node.parent, undefined);
});

test("subgrammars can supply missing symbols", function() {
	var ctx = h.load();
	var g = ctx.tracery.createGrammar({ a: "#b#" });
	g.subgrammars.push(ctx.tracery.createGrammar({ b: "B" }));
	assert.equal(g.flatten("#a#"), "B");
});

test("toJSON escapes keys and leaves out runtime symbols", function() {
	var g = h.grammar({ 'q"k': "x" });
	g.flatten("[v:1]");
	assert.deepEqual(Object.keys(JSON.parse(g.toJSON())), ['q"k']);
});

test("stepped expansion does not produce the text undefined", function() {
	var g = h.grammar({ a: "x" });
	var root = g.createRoot("a#a#");
	root.expand(true);
	assert.equal(root.finishedText, "");
	root.children.forEach(function(c) { c.expand(true); });
	assert.doesNotMatch(root.finishedText, /undefined/);
});

// ---- Packaging (#29, #30)

test("works through require, with the modifiers attached", function() {
	var tracery = require(path.join(h.dir, "js", "tracery", "tracery.js"));
	var g = tracery.createGrammar({ animal: "owl", origin: "#animal.a#" });
	g.addModifiers(tracery.baseEngModifiers);
	assert.equal(g.flatten("#origin#"), "an owl");
});
