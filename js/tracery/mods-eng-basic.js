/**
 * @author Kate
 *
 * Modified from upstream galaxykate/tracery (tracery2 branch). See CHANGES.md.
 */

function isVowel(c) {
	var c2 = c.toLowerCase();
	return (c2 === 'a') || (c2 === 'e') || (c2 === 'i') || (c2 === 'o') || (c2 === 'u');
};

function isAlphaNum(c) {
	return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9');
};

// Vowel letters with a consonant sound ("a unicorn"), and the reverse ("an hour")
var consonantSoundVowels = /^(uni(corn|form|on|que|t|vers|cycl|lateral|son|fy|fi|sex)|us[eau]|ut[eio]|ubi|uku|ur[aeio]|eu|ewe|one($|[^a-z])|once)/;
var vowelSoundConsonants = /^(hour|honest|honou?r|heir)/;

// "stop" -> "stopp": one short vowel between single consonants, at the end of a one-syllable word
function doubleFinalConsonant(s) {
	var word = s.match(/[a-zA-Z]+$/);
	if (word && /^[^aeiou]+[aeiou][^aeiouwxy]$/i.test(word[0]))
		return s + s.charAt(s.length - 1);
	return s;
}

var baseEngModifiers = {

	replace : function(s, params) {
		// An empty search would match between every character
		if (!params || !params[0] || params[1] === undefined)
			return s;

		return s.split(params[0]).join(params[1]);
	},

	capitalizeAll : function(s) {
		return s.replace(/[\p{L}\p{N}\p{M}]+(?:['’][\p{L}\p{N}\p{M}]+)*/gu, function(word) {
			var first = Array.from(word)[0];
			return first.toUpperCase() + word.substring(first.length);
		});
	},

	// Capitalizes the first letter, passing over any leading punctuation.
	//  Text that begins with a digit is left alone.
	capitalize : function(s) {
		// A "((missing symbol))" marker should keep showing the real name
		if (s.indexOf("((") === 0)
			return s;

		return s.replace(/^([^\p{L}\p{N}]*)(\p{L})/u, function(match, prefix, letter) {
			return prefix + letter.toUpperCase();
		});
	},

	a : function(s) {
		var lower = s.toLowerCase();

		if (consonantSoundVowels.test(lower))
			return "a " + s;

		if (vowelSoundConsonants.test(lower))
			return "an " + s;

		if (s.length > 0 && isVowel(s.charAt(0)))
			return "an " + s;

		return "a " + s;
	},

	firstS : function(s) {
		var words = s.split(" ");
		words[0] = baseEngModifiers.s(words[0]);
		return words.join(" ");
	},

	s : function(s) {
		if (s.length === 0)
			return s;

		if (/(s|x|z|ch|sh)$/i.test(s))
			return s + "es";

		if (/y$/i.test(s) && !isVowel(s.charAt(s.length - 2)))
			return s.substring(0, s.length - 1) + "ies";

		return s + "s";
	},

	ed : function(s) {
		if (/e$/i.test(s))
			return s + "d";

		if (/y$/i.test(s) && !isVowel(s.charAt(s.length - 2)))
			return s.substring(0, s.length - 1) + "ied";

		return doubleFinalConsonant(s) + "ed";
	},

	ing : function(s) {
		if (/ie$/i.test(s))
			return s.substring(0, s.length - 2) + "ying";

		if (/e$/i.test(s) && !/[eoy]e$/i.test(s) && s.length > 2)
			return s.substring(0, s.length - 1) + "ing";

		return doubleFinalConsonant(s) + "ing";
	}
};

if ( typeof module !== "undefined" && module.exports) {
	module.exports = baseEngModifiers;
}
