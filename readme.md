# Tracery

## About
Tracery was developed by Kate Compton, beginning March 2013 as a class assignment.

This is a fork of [galaxykate/tracery](https://github.com/galaxykate/tracery), based on its `tracery2` branch, with bugs fixed and a regression suite added. [CHANGES.md](CHANGES.md) lists every difference.

Run the tests with `npm test`. There is nothing to build, and no dependencies. In Node:

    var tracery = require("./js/tracery/tracery.js");
    var grammar = tracery.createGrammar({origin:"#animal.a#", animal:"owl"});
    grammar.addModifiers(tracery.baseEngModifiers);


## Basic usage

### Create a grammar

Create an empty grammar:

    grammar = tracery.createGrammar();

Create a grammar from a Tracery-formatted object:
	
    grammar = tracery.createGrammar({origin:"foo"});

Add modifiers to the grammar (import "mods-eng-basic.js" for basic English modifiers, or write your own)

    grammar.addModifiers(baseEngModifiers);
    
### Expand rules 
Get the fully-expanded string from a rule

    grammar.flatten("#origin#");

Get the fully-expanded node from a rule, this will return a root node containing a full expanded tree with many potentially interesting properties, including "finishedText" for each node.

    grammar.expand("#origin#");
    
Get the root node from a rule *not* fully expanded (this allows for animating the expansion of the tree). Its "finishedText" stays empty until the children are expanded.

    var root = grammar.createRoot("#origin#");
    root.expand(true);
    
    // animate the expansion over time
    var stepTimer = setInterval(function() {
                   app.stepIterator.node.expand(true);
                   var action = app.stepIterator.next();
                   if (!action)
                        clearInterval(stepTimer);
                   refreshVisualization();
                   refreshGrammarOutput();
                }, 40);
    

### Errors and limits

Expansion doesn't throw on a bad grammar. Problems appear in the text as markers like `((missing))`, and `grammar.errors` lists everything that went wrong in the most recent expansion.

One expansion stops at 1000 nested nodes, 1,000,000 nodes in all, or 10,000,000 characters. A grammar that hits a limit gets a marker, an error, and a `clearState()`. To change the limits:

    grammar = tracery.createGrammar(raw, {maxDepth: 200, maxNodes: 50000, maxLength: 100000});

Rules pushed by bare actions like `[hero:#name#]` stay in place between expansions. Call `grammar.clearState()` to start a new generation from the original grammar.

### Making Tracery deterministic

By default, Tracery uses Math.random() to generate random numbers. If you need Tracery to be deterministic, you can make it use your own random number generator using:

    tracery.setRng(myRng);

where myRng is a function that, [like Math.random()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random), returns a floating-point, pseudo-random number in the range [0, 1).

By using a local random number generator that takes a seed and controlling this seed, you can make Tracery's behavior completely deterministic.

(Alternatively, you could use something like [seedrandom](https://github.com/davidbau/seedrandom) to make Math.random() seedable, but then you need to be very careful about who uses Math.random() - it effectively becomes a global variable that anyone can modify. Using a local random number generator - perhaps from seedrandom - instead of replacing Math.random() avoids this problem.)

## Library Concepts
### Grammar

A Grammar is

* *a dictionary of symbols*: a key-value object matching keys (the names of symbols) to expansion rules
* optional metadata such as a title, edit data, and author
* optional connectivity graphs describing how symbols call each other

*clearState*: symbols and rulesets have state (the stack, and possible ruleset state recording recently called rules).  This function clears any state, returning the dictionary to its original state;

Grammars are usually created by feeding in a raw JSON grammar, which is then parsed into symbols and rules.  You can also build your own Grammar objects from scratch, without using this utility function, and can always edit the grammar after creating it.

### Symbol
A symbol is a **key** (usually a short human-readable string) and a set of expansion rules
* the key
* rulesetStack: the stack of expansion **rulesets** for this symbol.  This stack records the previous, inactive rulesets, and the current one.
* optional connectivity data, such as average depth and average expansion length

Putting a **key** in hashtags, in a Tracery syntax object, will create a expansion node for that symbol within the text.

Each top-level key-value pair in the raw JSON object creates a **symbol**.  The symbol's *key* is set from the key, and the *value* determines the **ruleset**.

### Modifier
A function that takes a string (and optionally parameters) and returns a string.  A set of these is included in mods-eng-basic.js.  Modifiers are applied, in order, after a tag is fully expanded.

To apply a modifier, add its name after a period, after the tag's main symbol:
	#animal.capitalize#
	#booktitle.capitalizeAll#
	Hundreds of #animal.s#

Modifiers can have parameters, too, and the parameters can contain tags. Spaces in parameters count. Write `\,` `\(` `\)` or `\.` for those characters literally (`\\,` and so on inside a JSON string).
	#story.replace(he,she).replace(him,her).replace(his,hers)#
	#story.replace(#oldName#,#newName#)#

A modifier is called with the current node as `this`, while the actions in its tag are still active.

### Action
An action that occurs when its node is expanded.  Built-in actions are 
* Generating some rules "[key:#rule#]" and pushing them to the "key" symbol's rule stack.  If that symbol does not exist, it creates it.
* Popping rules off of a rule stack, "[key:POP]"
* Other functions

TODO: figure out syntax and implementation for generating *arrays* of rules, or other complex rulesets to push onto symbols' rulestacks

TODO: figure out syntax and storage for calling other functions, especially for async APIs.

### Ruleset
A ruleset is an object that defines a *getRule* function.  Calling this function may change the internal state of the ruleset, such as annotating which rules were most recently returned, or drawing and removing a rule from a shuffled list of available rules.

#### Basic ruleset
A basic ruleset is just an array of options.

They can be created by raw JSON by having an *array* or a *string* as the value, like this:
"someKey":["rule0", "rule1", "some#complicated#rule"]
If there is only one rule, it is acceptable short hand to leave off the array, but this only works with Strings.
"someKey":"just one rule"

These use the default distribution of the Grammar that owns them, which itself defaults to regular stateless pseudo-randomness.

#### Rulesets with conditions, distributions, or ranked fallbacks
### **this feature is under development, coming soon
These rulesets are created when the raw JSON has an *object* rather than an *array* as the value.

Some attributes of this object can be:

* baseRules: a single ruleset,
* ruleRanking: an array of rulesets, call *getRule* on each in order until one returns a value, if none do, return *baseRules*.*getRule*,
* distribution: a new distribution to override the default)
* conditionRule: a rule to expand
* conditionValue: a value to match the expansion against
* conditionSuccess: a ruleset to use if expanding *conditionRule* returns *conditionValue*, otherwise use *baseRules*  


These can be nested, so it is possible to make a ruleset 