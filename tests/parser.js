/**
 * Tests for the parser/tokenizer
 */

/*jshint boss: true, laxbreak: true, node: true, maxlen:100 */

var JSHINT  = require('../jshint.js').JSHINT,
    fs      = require('fs'),
    TestRun = require("./testhelper").setup.testRun;

exports.unsafe = function () {
    var code = [
        'var a\u000a ="Here is a unsafe character";'
    ];
    
    TestRun()
        .addError(1, "Unsafe character.")
        .test(code);
};

exports.shebang = function () {
    var code = [
        '#!test'
      , 'var a = "xxx";'
      , '#!test'
    ];

    TestRun()
        .addError(3, "Expected an identifier and instead saw '#'.")
        .addError(3, "Expected an operator and instead saw '!'.")
        .addError(3, "Expected an assignment or function call and instead saw an expression.")
        .addError(3, "Missing semicolon.")
        .test(code);
};

exports.numbers = function () {
    var code = [
        'var a = 10e307;'
      , 'var b = 10e308;'
      , 'var c = 0.03;'
      , 'var d = 03;'
      , 'var f = .3;'
    ];

    TestRun()
        .addError(2, "Bad number '10e308'.")
        .addError(4, "Don't use extra leading zeros '03'.")
        .addError(5, "A leading decimal point can be confused with a dot: '.3'.")
        .test(code);
};

exports.comments = function () {
    var code = [
        '/*'
      , '/* nested */'
      , '*/'
      , '/* unclosed ...'
    ];

    TestRun()
        .addError(2, "Nested comment.")
        .addError(2, "Unbegun comment.")
        .addError(4, "Unclosed comment.")
        .test(code);
};

exports.regexp = function () {
    var code = [
        'var a1 = /\\\x1f/;'
      , 'var a2 = /[\\\x1f]/;'
      , 'var b1 = /\\</;' // only \< is unexpected?!
      , 'var b2 = /[\\<]/;' // only \< is unexpected?!
      , 'var c = /(?(a)b)/;'
      , 'var d = /)[--aa-b-cde-]/;'
      , 'var e = /[]/;'
      , 'var f = /[^]/;'
      , 'var g = /[a^[]/;'
      , 'var h = /[a-\\s-\\w-\\d\\x10-\\x20--]/;'
      , 'var i = /[/-a1-/]/;'
      , 'var j = /[a-<<-3]./;'
      , 'var k = /]}/;'
      , 'var l = /?(*)(+)({)/;'
      , 'var m = /a{b}b{2,c}c{3,2}d{4,?}x{30,40}/;'
      , 'var n = /a??b+?c*?d{3,4}? a?b+c*d{3,4}/;'
      , 'var o = /a\\/*  [a-^-22-]/;'
      , 'var p = /(?:(?=a|(?!b)))/;'
      , 'var q = /=x=/;'
      , 'var r = /dsdg;'
    ];

    TestRun()
        .addError(1, "Unsafe character.")
        .addError(1, "Unexpected control character in regular expression.")
        .addError(2, "Unsafe character.")
        .addError(2, "Unexpected control character in regular expression.")
        .addError(3, "Unexpected escaped character '<' in regular expression.")
        .addError(4, "Unexpected escaped character '<' in regular expression.")
        .addError(5, "Expected ':' and instead saw '('.")
        .addError(6, "Unescaped ')'.")
        .addError(6, "Unescaped '-'.")
        .addError(7, "Empty class.")
        .addError(8, "Unescaped '^'.")
        .addError(9, "Unescaped '^'.")
        .addError(9, "Unescaped '['.")
        .addError(10, "Unescaped '-'.")
        .addError(11, "Unescaped '/'.")
        .addError(13, "Unescaped ']'.")
        .addError(13, "Unescaped '}'.")
        .addError(14, "Unescaped '?'.")
        .addError(14, "Unescaped '*'.")
        .addError(14, "Unescaped '+'.")
        .addError(14, "Unescaped '{'.")
        .addError(15, "Expected a number and instead saw 'b'.")
        .addError(15, "Expected '}' and instead saw 'c'.")
        .addError(15, "Unescaped '}'.")
        .addError(15, "Expected '}' and instead saw '?'.")
        .addError(15, "'3' should not be greater than '2'.")
        .addError(17, "Spaces are hard to count. Use {2}.")
        .addError(17, "Unescaped '^'.")
        .addError(17, "Unescaped '-'.")
        .addError(19, "A regular expression literal can be confused with '/='.")
        .addError(19, "Missing semicolon.") // ?
        .addError(19, "Unclosed regular expression.") // line?
        .test(code);
};

exports.strings = function () {
    var code = [
        'var a = "\u0012\\r";'
      , 'var b = \'\\g\';'
      , 'var c = "\\u0022\\u0070\\u005C";'
      , 'var x = "ax'
    ];

    TestRun()
        .addError(1, "Control character in string: .")
        .addError(1, "Unsafe character.")
        .addError(2, "Bad escapement.")
        .addError(3, "Unnecessary escapement.")
        .addError(4, "Unclosed string.")
        .test(code);
};

exports.ownProperty = function () {
    var code = [
        'hasOwnProperty: for(;;) {break;}'
    ];

    TestRun()
        .addError(1, "'hasOwnProperty' is a really bad name.")
        .test(code);
};

exports.jsonMode = function () {
    var code = [
        '{'
      , '   a: 2,'
      , '   \'b\': "hallo\\"\\v\\x12\\\'world",'
      , '   "c\\"\\v\\x12": \'4\','
      , '   "d": "4\\'
      , '   ",'
      , '   "e": 0x332,'
      , '   "x": 0'
      , '}'
    ];

    TestRun()
        .addError(2, "Expected a string and instead saw a.")
        .addError(3, "Strings must use doublequote.")
        .addError(3, "Avoid \\v.")
        .addError(3, "Avoid \\x-.")
        .addError(3, "Avoid \\'.")
        .addError(4, "Avoid \\v.")
        .addError(4, "Avoid \\x-.")
        .addError(4, "Strings must use doublequote.")
        .addError(5, "Avoid EOL escapement.")
        .addError(7, "Avoid 0x-. '0x332'.")
        .test(code, {multistr: true});
};