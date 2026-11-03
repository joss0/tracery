var test = require("node:test");
var assert = require("node:assert");
var h = require("./helpers");

var mods = h.load().baseEngModifiers;

function table(name, cases) {
	test("." + name, function() {
		Object.keys(cases).forEach(function(k) {
			assert.equal(mods[name](k), cases[k]);
		});
	});
}

// #32
table("a", {
	dog: "a dog", owl: "an owl", umbrella: "an umbrella", unicorn: "a unicorn",
	unit: "a unit", university: "a university", useful: "a useful", user: "a user",
	usual: "a usual", utensil: "a utensil", usher: "an usher", ugly: "an ugly",
	unidentified: "an unidentified", unimportant: "an unimportant", uninvited: "an uninvited",
	hour: "an hour", honest: "an honest", heir: "an heir", horse: "a horse",
	euro: "a euro", ewe: "a ewe", one: "a one", onion: "an onion", Owl: "an Owl", Unicorn: "a Unicorn"
});

table("s", {
	dog: "dogs", bus: "buses", box: "boxes", wish: "wishes", church: "churches",
	month: "months", path: "paths", buzz: "buzzes", fly: "flies", day: "days", "": ""
});

table("ed", {
	walk: "walked", bake: "baked", try: "tried", play: "played", pass: "passed",
	stop: "stopped", fix: "fixed", snow: "snowed", visit: "visited"
});

// #49
table("ing", {
	walk: "walking", bake: "baking", run: "running", die: "dying", see: "seeing",
	be: "being", visit: "visiting", play: "playing", fix: "fixing"
});

// #48
table("firstS", { dog: "dogs", "cup of tea": "cups of tea" });

// #15
table("capitalizeAll", {
	"the old man": "The Old Man", "don't stop": "Don't Stop", "émile zola": "Émile Zola",
	"one-eyed cat": "One-Eyed Cat", "1st place": "1st Place", "\\#tag here": "\\#Tag Here"
});

// #39
table("capitalize", {
	dog: "Dog", "\\#communism": "\\#Communism", '"hello"': '"Hello"', "émile": "Émile",
	"3 dogs": "3 dogs", "": ""
});

test(".replace", function() {
	assert.equal(mods.replace("a.b.c", [".", "-"]), "a-b-c");
	assert.equal(mods.replace("abc", ["b", "$&"]), "a$&c");
	assert.equal(mods.replace("abc", []), "abc");
	assert.equal(mods.replace("abc", ["b"]), "abc");
	assert.equal(mods.replace("abc", ["", "x"]), "abc");
});
