import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as os from 'os';
const isWin32 = os.platform() === 'win32';

import {
  globParent,
  globPart,
  isGlob,
  isAbsolute,
  isWin32Pattern,
  removeLeadingDot,
  resolvePattern,
  unixlike
} from '../src/lib/pattern';

describe('pattern', function () {
  describe('globParent', function () {
    it('keep the trailing slash for lonly windows device root', function () {
      expect(globParent('c:')).to.equal('c:/');
      expect(globParent('c:/')).to.equal('c:/');
      expect(globParent('c:/a/..')).to.equal('c:/');
    });

    it('non-glob pattern', function () {
      expect(globParent('')).to.equal('.');
      expect(globParent('!')).to.equal('.');

      expect(globParent('.')).to.equal('.');
      expect(globParent('..')).to.equal('..');

      expect(globParent('/')).to.equal('/');
      expect(globParent('\\')).to.equal('/');

      expect(globParent('./')).to.equal('.');
      expect(globParent('.\\')).to.equal('.');
    });

    it('mixing slash and backslash', function () {
      // Relative.
      expect(globParent('a\\b\\c')).to.equal('a/b/c');
      expect(globParent('a/b\\c')).to.equal('a/b/c');
      expect(globParent('a/b\\\\c')).to.equal('a/b/c');
      expect(globParent('!a/b\\\\c')).to.equal('a/b/c');

      // Start with slash.
      expect(globParent('//a\\b\\c')).to.equal('/a/b/c');
      expect(globParent('//a/b\\c')).to.equal('/a/b/c');
      expect(globParent('//a/b\\\\c')).to.equal('/a/b/c');
      expect(globParent('!//a/b\\\\c')).to.equal('/a/b/c');

      // Start with backslash.
      expect(globParent('\\\\a\\b\\c')).to.equal('/a/b/c');
      expect(globParent('\\\\a/b\\c')).to.equal('/a/b/c');
      expect(globParent('\\\\a/b\\\\c')).to.equal('/a/b/c');
      expect(globParent('!\\\\a/b\\\\c')).to.equal('/a/b/c');

      // Start with drive number.
      expect(globParent('c://a\\b\\c')).to.equal('c:/a/b/c');
      expect(globParent('c://a/b\\c')).to.equal('c:/a/b/c');
      expect(globParent('c://a/b\\\\c')).to.equal('c:/a/b/c');
      expect(globParent('!c://a/b\\\\c')).to.equal('c:/a/b/c');
      expect(globParent('c:\\\\a\\b\\c')).to.equal('c:/a/b/c');
      expect(globParent('c:\\\\a/b\\c')).to.equal('c:/a/b/c');
      expect(globParent('c:\\\\a/b\\\\c')).to.equal('c:/a/b/c');
      expect(globParent('!c:\\\\a/b\\\\c')).to.equal('c:/a/b/c');
    });

    it('pattern with slash', function () {
      expect(globParent('/.*')).to.equal('/');
      expect(globParent('/.*/')).to.equal('/');
      expect(globParent('a/.*/b')).to.equal('a');
      expect(globParent('a*/.*/b')).to.equal('.');
      expect(globParent('*/a/b/c')).to.equal('.');
      expect(globParent('*')).to.equal('.');
      expect(globParent('*/')).to.equal('.');
      expect(globParent('*/*')).to.equal('.');
      expect(globParent('*/*/')).to.equal('.');
      expect(globParent('**')).to.equal('.');
      expect(globParent('**/')).to.equal('.');
      expect(globParent('**/*')).to.equal('.');
      expect(globParent('**/*/')).to.equal('.');
      expect(globParent('/*.js')).to.equal('/');
      expect(globParent('*.js')).to.equal('.');
      expect(globParent('**/*.js')).to.equal('.');
      expect(globParent('{a,b}')).to.equal('.');
      expect(globParent('/{a,b}')).to.equal('/');
      expect(globParent('/{a,b}/')).to.equal('/');
      expect(globParent('(a|b)')).to.equal('.');
      expect(globParent('/(a|b)')).to.equal('/');
      expect(globParent('./(a|b)')).to.equal('.');
      expect(globParent('a/(b c)')).to.equal('a/(b c)'); // not an extglob
      expect(globParent('a/(b c)/')).to.equal('a/(b c)'); // not an extglob
      expect(globParent('a/(b c)/d')).to.equal('a/(b c)/d'); // not an extglob
      expect(globParent('path/to/*.js')).to.equal('path/to');
      expect(globParent('/root/path/to/*.js')).to.equal('/root/path/to');
      expect(globParent('chapter/foo [bar]/')).to.equal('chapter');
      expect(globParent('path/[a-z]')).to.equal('path');
      expect(globParent('[a-z]')).to.equal('.');
      expect(globParent('path/{to,from}')).to.equal('path');
      expect(globParent('path/(to|from)')).to.equal('path');
      expect(globParent('(foo bar)/subdir/foo.*')).to.equal('(foo bar)/subdir');
      expect(globParent('path/!(to|from)')).to.equal('path');
      expect(globParent('path/?(to|from)')).to.equal('path');
      expect(globParent('path/+(to|from)')).to.equal('path');
      expect(globParent('path/*(to|from)')).to.equal('path');
      expect(globParent('path/@(to|from)')).to.equal('path');

      expect(globParent('path/!/foo')).to.equal('path/!/foo');
      expect(globParent('path/?/foo')).to.equal('path/?/foo');
      expect(globParent('path/+/foo')).to.equal('path/+/foo');
      expect(globParent('path/*/foo')).to.equal('path');
      expect(globParent('path/@/foo')).to.equal('path/@/foo');
      expect(globParent('path/!/foo/')).to.equal('path/!/foo');
      expect(globParent('path/?/foo/')).to.equal('path/?/foo');
      expect(globParent('path/+/foo/')).to.equal('path/+/foo');
      expect(globParent('path/*/foo/')).to.equal('path');
      expect(globParent('path/@/foo/')).to.equal('path/@/foo');
      expect(globParent('path/**/*')).to.equal('path');
      expect(globParent('path/**/subdir/foo.*')).to.equal('path');
      expect(globParent('path/subdir/**/foo.js')).to.equal('path/subdir');
      expect(globParent('path/!subdir/foo.js')).to.equal('path/!subdir/foo.js');
      expect(globParent('path/{foo,bar}/')).to.equal('path');
    });

    it('pattern with backslash', function () {
      expect(globParent('\\.*')).to.equal('/');
      expect(globParent('\\.*\\')).to.equal('/');
      expect(globParent('a\\.*\\b')).to.equal('a');
      expect(globParent('a*\\.*\\b')).to.equal('.');
      expect(globParent('*\\a\\b\\c')).to.equal('.');
      expect(globParent('*')).to.equal('.');
      expect(globParent('*\\')).to.equal('.');
      expect(globParent('*\\*')).to.equal('.');
      expect(globParent('*\\*\\')).to.equal('.');
      expect(globParent('**')).to.equal('.');
      expect(globParent('**\\')).to.equal('.');
      expect(globParent('**\\*')).to.equal('.');
      expect(globParent('**\\*\\')).to.equal('.');
      expect(globParent('\\*.js')).to.equal('/');
      expect(globParent('*.js')).to.equal('.');
      expect(globParent('**\\*.js')).to.equal('.');
      expect(globParent('{a,b}')).to.equal('.');
      expect(globParent('\\{a,b}')).to.equal('/');
      expect(globParent('\\{a,b}\\')).to.equal('/');
      expect(globParent('(a|b)')).to.equal('.');
      expect(globParent('\\(a|b)')).to.equal('/');
      expect(globParent('.\\(a|b)')).to.equal('.');
      expect(globParent('a\\(b c)')).to.equal('a/(b c)'); // not an extglob
      expect(globParent('a\\(b c)\\')).to.equal('a/(b c)'); // not an extglob
      expect(globParent('a\\(b c)\\d')).to.equal('a/(b c)/d'); // not an extglob
      expect(globParent('path\\to\\*.js')).to.equal('path/to');
      expect(globParent('\\root\\path\\to\\*.js')).to.equal('/root/path/to');
      expect(globParent('chapter\\foo [bar]\\')).to.equal('chapter');
      expect(globParent('path\\[a-z]')).to.equal('path');
      expect(globParent('[a-z]')).to.equal('.');
      expect(globParent('path\\{to,from}')).to.equal('path');
      expect(globParent('path\\(to|from)')).to.equal('path');
      expect(globParent('path\\(foo bar)\\subdir\\foo.*')).to.equal('path/(foo bar)/subdir');
      expect(globParent('path\\!(to|from)')).to.equal('path');
      expect(globParent('path\\?(to|from)')).to.equal('path');
      expect(globParent('path\\+(to|from)')).to.equal('path');
      expect(globParent('path\\*(to|from)')).to.equal('path');
      expect(globParent('path\\@(to|from)')).to.equal('path');

      expect(globParent('path\\!\\foo')).to.equal('path/!/foo');
      expect(globParent('path\\?\\foo')).to.equal('path/?/foo');
      expect(globParent('path\\+\\foo')).to.equal('path/+/foo');
      expect(globParent('path\\*\\foo')).to.equal('path');
      expect(globParent('path\\@\\foo')).to.equal('path/@/foo');
      expect(globParent('path\\!\\foo\\')).to.equal('path/!/foo');
      expect(globParent('path\\?\\foo\\')).to.equal('path/?/foo');
      expect(globParent('path\\+\\foo\\')).to.equal('path/+/foo');
      expect(globParent('path\\*\\foo\\')).to.equal('path');
      expect(globParent('path\\@\\foo\\')).to.equal('path/@/foo');
      expect(globParent('path\\**\\*')).to.equal('path');
      expect(globParent('path\\**\\subdir\\foo.*')).to.equal('path');
      expect(globParent('path\\subdir\\**\\foo.js')).to.equal('path/subdir');
      expect(globParent('path\\!subdir\\foo.js')).to.equal('path/!subdir/foo.js');
      expect(globParent('path\\{foo,bar}\\')).to.equal('path');
    });
  });

  describe('globPart', function () {
    it('non-glob pattern', function () {
      expect(globPart('')).to.equal('');
      expect(globPart('!')).to.equal('');

      expect(globPart('.')).to.equal('');
      expect(globPart('..')).to.equal('');

      expect(globPart('/')).to.equal('');
      expect(globPart('\\')).to.equal('');

      expect(globPart('./')).to.equal('');
      expect(globPart('.\\')).to.equal('');
    });

    it('mixing slash and backslash', function () {
      // Relative.
      expect(globPart('a\\b\\c')).to.equal('');
      expect(globPart('a/b\\c')).to.equal('');
      expect(globPart('a/b\\\\c')).to.equal('');
      expect(globPart('!a/b\\\\c')).to.equal('');

      // Start with slash.
      expect(globPart('//a\\b\\c')).to.equal('');
      expect(globPart('//a/b\\c')).to.equal('');
      expect(globPart('//a/b\\\\c')).to.equal('');
      expect(globPart('!//a/b\\\\c')).to.equal('');

      // Start with backslash.
      expect(globPart('\\\\a\\b\\c')).to.equal('');
      expect(globPart('\\\\a/b\\c')).to.equal('');
      expect(globPart('\\\\a/b\\\\c')).to.equal('');
      expect(globPart('!\\\\a/b\\\\c')).to.equal('');

      // Start with drive number.
      expect(globPart('c://a\\b\\c')).to.equal('');
      expect(globPart('c://a/b\\c')).to.equal('');
      expect(globPart('c://a/b\\\\c')).to.equal('');
      expect(globPart('!c://a/b\\\\c')).to.equal('');
      expect(globPart('c:\\\\a\\b\\c')).to.equal('');
      expect(globPart('c:\\\\a/b\\c')).to.equal('');
      expect(globPart('c:\\\\a/b\\\\c')).to.equal('');
      expect(globPart('!c:\\\\a/b\\\\c')).to.equal('');
    });

    it('pattern with slash', function () {
      expect(globPart('/.*')).to.equal('.*');
      expect(globPart('/.*/')).to.equal('.*');
      expect(globPart('a/.*/b')).to.equal('.*/b');
      expect(globPart('a*/.*/b')).to.equal('a*/.*/b');
      expect(globPart('*/a/b/c')).to.equal('*/a/b/c');
      expect(globPart('*')).to.equal('*');
      expect(globPart('*/')).to.equal('*');
      expect(globPart('*/*')).to.equal('*/*');
      expect(globPart('*/*/')).to.equal('*/*');
      expect(globPart('**')).to.equal('**');
      expect(globPart('**/')).to.equal('**');
      expect(globPart('**/*')).to.equal('**/*');
      expect(globPart('**/*/')).to.equal('**/*');
      expect(globPart('/*.js')).to.equal('*.js');
      expect(globPart('*.js')).to.equal('*.js');
      expect(globPart('**/*.js')).to.equal('**/*.js');
      expect(globPart('{a,b}')).to.equal('{a,b}');
      expect(globPart('/{a,b}')).to.equal('{a,b}');
      expect(globPart('/{a,b}/')).to.equal('{a,b}');
      expect(globPart('(a|b)')).to.equal('(a|b)');
      expect(globPart('/(a|b)')).to.equal('(a|b)');
      expect(globPart('./(a|b)')).to.equal('(a|b)');
      expect(globPart('a/(b c)')).to.equal(''); // not an extglob
      expect(globPart('a/(b c)/')).to.equal(''); // not an extglob
      expect(globPart('a/(b c)/d')).to.equal(''); // not an extglob
      expect(globPart('path/to/*.js')).to.equal('*.js');
      expect(globPart('/root/path/to/*.js')).to.equal('*.js');
      expect(globPart('chapter/foo [bar]/')).to.equal('foo [bar]');
      expect(globPart('path/[a-z]')).to.equal('[a-z]');
      expect(globPart('[a-z]')).to.equal('[a-z]');
      expect(globPart('path/{to,from}')).to.equal('{to,from}');
      expect(globPart('path/(to|from)')).to.equal('(to|from)');
      expect(globPart('(foo bar)/subdir/foo.*')).to.equal('foo.*');
      expect(globPart('path/!(to|from)')).to.equal('!(to|from)');
      expect(globPart('path/?(to|from)')).to.equal('?(to|from)');
      expect(globPart('path/+(to|from)')).to.equal('+(to|from)');
      expect(globPart('path/*(to|from)')).to.equal('*(to|from)');
      expect(globPart('path/@(to|from)')).to.equal('@(to|from)');

      expect(globPart('path/!/foo')).to.equal('');
      expect(globPart('path/?/foo')).to.equal('');
      expect(globPart('path/+/foo')).to.equal('');
      expect(globPart('path/*/foo')).to.equal('*/foo');
      expect(globPart('path/@/foo')).to.equal('');
      expect(globPart('path/!/foo/')).to.equal('');
      expect(globPart('path/?/foo/')).to.equal('');
      expect(globPart('path/+/foo/')).to.equal('');
      expect(globPart('path/*/foo/')).to.equal('*/foo');
      expect(globPart('path/@/foo/')).to.equal('');
      expect(globPart('path/**/*')).to.equal('**/*');
      expect(globPart('path/**/subdir/foo.*')).to.equal('**/subdir/foo.*');
      expect(globPart('path/subdir/**/foo.js')).to.equal('**/foo.js');
      expect(globPart('path/!subdir/foo.js')).to.equal('');
      expect(globPart('path/{foo,bar}/')).to.equal('{foo,bar}');
    });

    it('pattern with backslash', function () {
      expect(globPart('\\.*')).to.equal('.*');
      expect(globPart('\\.*\\')).to.equal('.*');
      expect(globPart('a\\.*\\b')).to.equal('.*/b');
      expect(globPart('a*\\.*\\b')).to.equal('a*/.*/b');
      expect(globPart('*\\a\\b\\c')).to.equal('*/a/b/c');
      expect(globPart('*')).to.equal('*');
      expect(globPart('*\\')).to.equal('*');
      expect(globPart('*\\*')).to.equal('*/*');
      expect(globPart('*\\*\\')).to.equal('*/*');
      expect(globPart('**')).to.equal('**');
      expect(globPart('**\\')).to.equal('**');
      expect(globPart('**\\*')).to.equal('**/*');
      expect(globPart('**\\*\\')).to.equal('**/*');
      expect(globPart('\\*.js')).to.equal('*.js');
      expect(globPart('*.js')).to.equal('*.js');
      expect(globPart('**\\*.js')).to.equal('**/*.js');
      expect(globPart('{a,b}')).to.equal('{a,b}');
      expect(globPart('\\{a,b}')).to.equal('{a,b}');
      expect(globPart('\\{a,b}\\')).to.equal('{a,b}');
      expect(globPart('(a|b)')).to.equal('(a|b)');
      expect(globPart('\\(a|b)')).to.equal('(a|b)');
      expect(globPart('.\\(a|b)')).to.equal('(a|b)');
      expect(globPart('a\\(b c)')).to.equal(''); // not an extglob
      expect(globPart('a\\(b c)\\')).to.equal(''); // not an extglob
      expect(globPart('a\\(b c)\\d')).to.equal(''); // not an extglob
      expect(globPart('path\\to\\*.js')).to.equal('*.js');
      expect(globPart('\\root\\path\\to\\*.js')).to.equal('*.js');
      expect(globPart('chapter\\foo [bar]\\')).to.equal('foo [bar]');
      expect(globPart('path\\[a-z]')).to.equal('[a-z]');
      expect(globPart('[a-z]')).to.equal('[a-z]');
      expect(globPart('path\\{to,from}')).to.equal('{to,from}');
      expect(globPart('path\\(to|from)')).to.equal('(to|from)');
      expect(globPart('(foo bar)\\subdir\\foo.*')).to.equal('foo.*');
      expect(globPart('path\\!(to|from)')).to.equal('!(to|from)');
      expect(globPart('path\\?(to|from)')).to.equal('?(to|from)');
      expect(globPart('path\\+(to|from)')).to.equal('+(to|from)');
      expect(globPart('path\\*(to|from)')).to.equal('*(to|from)');
      expect(globPart('path\\@(to|from)')).to.equal('@(to|from)');

      expect(globPart('path\\!\\foo')).to.equal('');
      expect(globPart('path\\?\\foo')).to.equal('');
      expect(globPart('path\\+\\foo')).to.equal('');
      expect(globPart('path\\*\\foo')).to.equal('*/foo');
      expect(globPart('path\\@\\foo')).to.equal('');
      expect(globPart('path\\!\\foo\\')).to.equal('');
      expect(globPart('path\\?\\foo\\')).to.equal('');
      expect(globPart('path\\+\\foo\\')).to.equal('');
      expect(globPart('path\\*\\foo\\')).to.equal('*/foo');
      expect(globPart('path\\@\\foo\\')).to.equal('');
      expect(globPart('path\\**\\*')).to.equal('**/*');
      expect(globPart('path\\**\\subdir\\foo.*')).to.equal('**/subdir/foo.*');
      expect(globPart('path\\subdir\\**\\foo.js')).to.equal('**/foo.js');
      expect(globPart('path\\!subdir\\foo.js')).to.equal('');
      expect(globPart('path\\{foo,bar}\\')).to.equal('{foo,bar}');
    });
  });

  it('isGlob', function () {
    // Empty string should return false.
    expect(isGlob('')).to.false;

    // Non-glob pattern should return false.
    expect(isGlob('c:/foo\\bar')).to.false;
    expect(isGlob('/foo\\bar')).to.false;
    expect(isGlob('c:\\foo\\\\bar')).to.false;
    expect(isGlob('/foo/\\\\bar')).to.false;

    // Should return true for patterns that include common glob symbols.
    expect(isGlob('*')).to.true;
    expect(isGlob('abc/*')).to.true;
    expect(isGlob('!abc')).to.true;

    // Should return false for single question ?.
    expect(isGlob('?')).to.false;
    expect(isGlob('abc/?')).to.false;

    // Should return true for patterns that include regex group symbols.
    expect(isGlob('(a|)')).to.true;
    expect(isGlob('(a|b)')).to.true;
    expect(isGlob('abc/(a|b)')).to.true;

    // Should return true for patterns that include regex character class symbols.
    expect(isGlob('[abc]')).to.true;
    expect(isGlob('abc/[abc]')).to.true;
    expect(isGlob('[^abc]')).to.true;
    expect(isGlob('abc/[^abc]')).to.true;
    expect(isGlob('[1-3]')).to.true;
    expect(isGlob('abc/[1-3]')).to.true;
    expect(isGlob('[[:alpha:][:digit:]]')).to.true;
    expect(isGlob('abc/[[:alpha:][:digit:]]')).to.true;

    // Should return true for patterns that include glob extension symbols.
    expect(isGlob('@()')).to.true;
    expect(isGlob('@(a)')).to.true;
    expect(isGlob('@(a|b)')).to.true;
    expect(isGlob('abc/!(a|b)')).to.true;
    expect(isGlob('*(a|b)')).to.true;
    expect(isGlob('?(a|b)')).to.true;
    expect(isGlob('+(a|b)')).to.true;

    // 'should return true for patterns that include brace expansions symbols.
    expect(isGlob('{,}')).to.true;
    expect(isGlob('{a,}')).to.true;
    expect(isGlob('{,b}')).to.true;
    expect(isGlob('{a,b}')).to.true;
    expect(isGlob('{1..3}')).to.true;

    // Should return false for "!" symbols when a symbol is not specified first in the string.
    expect(isGlob('abc!')).to.false;

    // Should return false for a completely static pattern.
    expect(isGlob('')).to.false;
    expect(isGlob('.')).to.false;
    expect(isGlob('abc')).to.false;
    expect(isGlob('~abc')).to.false;
    expect(isGlob('~/abc')).to.false;
    expect(isGlob('+~/abc')).to.false;
    expect(isGlob('@.(abc)')).to.false;
    expect(isGlob('(a b)')).to.false;
    expect(isGlob('(a b)')).to.false;
    expect(isGlob('[abc')).to.false;

    // Should return false for unfinished regex character class.
    expect(isGlob('[')).to.false;
    expect(isGlob('[abc')).to.false;

    // Should return false for unfinished regex group.
    expect(isGlob('(a|b')).to.false;
    expect(isGlob('abc/(a|b')).to.false;

    // Should return false for unfinished glob extension.
    expect(isGlob('@(')).to.false;
    expect(isGlob('@(a')).to.false;
    expect(isGlob('@(a|')).to.false;
    expect(isGlob('@(a|b')).to.false;

    // Should return false for unfinished brace expansions.
    expect(isGlob('{')).to.false;
    expect(isGlob('{a')).to.false;
    expect(isGlob('{,')).to.false;
    expect(isGlob('{a,')).to.false;
    expect(isGlob('{a,b')).to.false;
  });

  it('isAbsolute', function () {
    // Obvious windows pattern.
    expect(isAbsolute('c:/foo\\bar')).to.true;
    expect(isAbsolute('c:\\foo\\\\bar')).to.true;

    // Start with salsh, rely on the platform.
    if (isWin32) {
      expect(isAbsolute('/foo\\bar')).to.false;
      expect(isAbsolute('/foo/\\\\bar')).to.false;
    } else {
      expect(isAbsolute('/foo\\bar')).to.true;
      expect(isAbsolute('/foo/\\\\bar')).to.true;
    }

    // Unknow non-glob pattern, not absolute.
    if (isWin32) {
      expect(isAbsolute('')).to.false;
      expect(isAbsolute('foo\\bar')).to.false;
      expect(isAbsolute('\\foo\\bar')).to.false;
    } else {
      expect(isAbsolute('')).to.false;
      expect(isAbsolute('foo\\bar')).to.false;
      expect(isAbsolute('\\foo\\bar')).to.false;
    }

    // Glob pattern.
    if (isWin32) {
      // Patterns that include common glob symbols.
      expect(isAbsolute('*')).to.false;
      expect(isAbsolute('abc/*')).to.false;
      expect(isAbsolute('!abc')).to.false;

      // Single question ?.
      expect(isAbsolute('?')).to.false;
      expect(isAbsolute('abc/?')).to.false;

      // Patterns that include regex group symbols.
      expect(isAbsolute('(a|)')).to.false;
      expect(isAbsolute('(a|b)')).to.false;
      expect(isAbsolute('abc/(a|b)')).to.false;

      // Ptterns that include regex character class symbols.
      expect(isAbsolute('[abc]')).to.false;
      expect(isAbsolute('abc/[abc]')).to.false;
      expect(isAbsolute('[^abc]')).to.false;
      expect(isAbsolute('abc/[^abc]')).to.false;
      expect(isAbsolute('[1-3]')).to.false;
      expect(isAbsolute('abc/[1-3]')).to.false;
      expect(isAbsolute('[[:alpha:][:digit:]]')).to.false;
      expect(isAbsolute('abc/[[:alpha:][:digit:]]')).to.false;

      // Patterns that include glob extension symbols.
      expect(isAbsolute('@()')).to.false;
      expect(isAbsolute('@(a)')).to.false;
      expect(isAbsolute('@(a|b)')).to.false;
      expect(isAbsolute('abc/!(a|b)')).to.false;
      expect(isAbsolute('*(a|b)')).to.false;
      expect(isAbsolute('?(a|b)')).to.false;
      expect(isAbsolute('+(a|b)')).to.false;

      // Patterns that include brace expansions symbols.
      expect(isAbsolute('{,}')).to.false;
      expect(isAbsolute('{a,}')).to.false;
      expect(isAbsolute('{,b}')).to.false;
      expect(isAbsolute('{a,b}')).to.false;
      expect(isAbsolute('{1..3}')).to.false;

      // Pattern with middle `!` symbol.
      expect(isAbsolute('abc!')).to.false;

      // Completely static pattern.
      expect(isAbsolute('')).to.false;
      expect(isAbsolute('.')).to.false;
      expect(isAbsolute('abc')).to.false;
      expect(isAbsolute('~abc')).to.false;
      expect(isAbsolute('~/abc')).to.false;
      expect(isAbsolute('+~/abc')).to.false;
      expect(isAbsolute('@.(abc)')).to.false;
      expect(isAbsolute('(a b)')).to.false;
      expect(isAbsolute('(a b)')).to.false;
      expect(isAbsolute('[abc')).to.false;

      // Unfinished regex character class.
      expect(isAbsolute('[')).to.false;
      expect(isAbsolute('[abc')).to.false;

      // Unfinished regex group.
      expect(isAbsolute('(a|b')).to.false;
      expect(isAbsolute('abc/(a|b')).to.false;

      // Unfinished glob extension.
      expect(isAbsolute('@(')).to.false;
      expect(isAbsolute('@(a')).to.false;
      expect(isAbsolute('@(a|')).to.false;
      expect(isAbsolute('@(a|b')).to.false;

      // Unfinished brace expansions.
      expect(isAbsolute('{')).to.false;
      expect(isAbsolute('{a')).to.false;
      expect(isAbsolute('{,')).to.false;
      expect(isAbsolute('{a,')).to.false;
      expect(isAbsolute('{a,b')).to.false;
    } else {
      // Patterns that include common glob symbols.
      expect(isAbsolute('*')).to.false;
      expect(isAbsolute('abc/*')).to.false;
      expect(isAbsolute('!abc')).to.false;

      // Single question ?.
      expect(isAbsolute('?')).to.false;
      expect(isAbsolute('abc/?')).to.false;

      // Patterns that include regex group symbols.
      expect(isAbsolute('(a|)')).to.false;
      expect(isAbsolute('(a|b)')).to.false;
      expect(isAbsolute('abc/(a|b)')).to.false;

      // Ptterns that include regex character class symbols.
      expect(isAbsolute('[abc]')).to.false;
      expect(isAbsolute('abc/[abc]')).to.false;
      expect(isAbsolute('[^abc]')).to.false;
      expect(isAbsolute('abc/[^abc]')).to.false;
      expect(isAbsolute('[1-3]')).to.false;
      expect(isAbsolute('abc/[1-3]')).to.false;
      expect(isAbsolute('[[:alpha:][:digit:]]')).to.false;
      expect(isAbsolute('abc/[[:alpha:][:digit:]]')).to.false;

      // Patterns that include glob extension symbols.
      expect(isAbsolute('@()')).to.false;
      expect(isAbsolute('@(a)')).to.false;
      expect(isAbsolute('@(a|b)')).to.false;
      expect(isAbsolute('abc/!(a|b)')).to.false;
      expect(isAbsolute('*(a|b)')).to.false;
      expect(isAbsolute('?(a|b)')).to.false;
      expect(isAbsolute('+(a|b)')).to.false;

      // Patterns that include brace expansions symbols.
      expect(isAbsolute('{,}')).to.false;
      expect(isAbsolute('{a,}')).to.false;
      expect(isAbsolute('{,b}')).to.false;
      expect(isAbsolute('{a,b}')).to.false;
      expect(isAbsolute('{1..3}')).to.false;

      // Pattern with middle `!` symbol.
      expect(isAbsolute('abc!')).to.false;

      // Completely static pattern.
      expect(isAbsolute('')).to.false;
      expect(isAbsolute('.')).to.false;
      expect(isAbsolute('abc')).to.false;
      expect(isAbsolute('~abc')).to.false;
      expect(isAbsolute('~/abc')).to.false;
      expect(isAbsolute('+~/abc')).to.false;
      expect(isAbsolute('@.(abc)')).to.false;
      expect(isAbsolute('(a b)')).to.false;
      expect(isAbsolute('(a b)')).to.false;
      expect(isAbsolute('[abc')).to.false;

      // Unfinished regex character class.
      expect(isAbsolute('[')).to.false;
      expect(isAbsolute('[abc')).to.false;

      // Unfinished regex group.
      expect(isAbsolute('(a|b')).to.false;
      expect(isAbsolute('abc/(a|b')).to.false;

      // Unfinished glob extension.
      expect(isAbsolute('@(')).to.false;
      expect(isAbsolute('@(a')).to.false;
      expect(isAbsolute('@(a|')).to.false;
      expect(isAbsolute('@(a|b')).to.false;

      // Unfinished brace expansions.
      expect(isAbsolute('{')).to.false;
      expect(isAbsolute('{a')).to.false;
      expect(isAbsolute('{,')).to.false;
      expect(isAbsolute('{a,')).to.false;
      expect(isAbsolute('{a,b')).to.false;
    }
  });

  it('isWin32Pattern', function () {
    // Obvious windows pattern.
    expect(isWin32Pattern('c:/foo\\bar')).to.true;
    expect(isWin32Pattern('c:\\foo\\\\bar')).to.true;

    // Unknow non-glob pattern, rely on the platform.
    if (isWin32) {
      expect(isWin32Pattern('')).to.true;
      expect(isWin32Pattern('foo\\bar')).to.true;
      expect(isWin32Pattern('\\foo\\bar')).to.true;
      expect(isWin32Pattern('/foo\\bar')).to.true;
      expect(isWin32Pattern('/foo/\\\\bar')).to.true;
    } else {
      expect(isWin32Pattern('')).to.false;
      expect(isWin32Pattern('foo\\bar')).to.false;
      expect(isWin32Pattern('\\foo\\bar')).to.false;
      expect(isWin32Pattern('/foo\\bar')).to.false;
      expect(isWin32Pattern('/foo/\\\\bar')).to.false;
    }

    // Glob pattern, rely on platform.
    if (isWin32) {
      // Patterns that include common glob symbols.
      expect(isWin32Pattern('*')).to.true;
      expect(isWin32Pattern('abc/*')).to.true;
      expect(isWin32Pattern('!abc')).to.true;

      // Single question ?.
      expect(isWin32Pattern('?')).to.true;
      expect(isWin32Pattern('abc/?')).to.true;

      // Patterns that include regex group symbols.
      expect(isWin32Pattern('(a|)')).to.true;
      expect(isWin32Pattern('(a|b)')).to.true;
      expect(isWin32Pattern('abc/(a|b)')).to.true;

      // Ptterns that include regex character class symbols.
      expect(isWin32Pattern('[abc]')).to.true;
      expect(isWin32Pattern('abc/[abc]')).to.true;
      expect(isWin32Pattern('[^abc]')).to.true;
      expect(isWin32Pattern('abc/[^abc]')).to.true;
      expect(isWin32Pattern('[1-3]')).to.true;
      expect(isWin32Pattern('abc/[1-3]')).to.true;
      expect(isWin32Pattern('[[:alpha:][:digit:]]')).to.true;
      expect(isWin32Pattern('abc/[[:alpha:][:digit:]]')).to.true;

      // Patterns that include glob extension symbols.
      expect(isWin32Pattern('@()')).to.true;
      expect(isWin32Pattern('@(a)')).to.true;
      expect(isWin32Pattern('@(a|b)')).to.true;
      expect(isWin32Pattern('abc/!(a|b)')).to.true;
      expect(isWin32Pattern('*(a|b)')).to.true;
      expect(isWin32Pattern('?(a|b)')).to.true;
      expect(isWin32Pattern('+(a|b)')).to.true;

      // Patterns that include brace expansions symbols.
      expect(isWin32Pattern('{,}')).to.true;
      expect(isWin32Pattern('{a,}')).to.true;
      expect(isWin32Pattern('{,b}')).to.true;
      expect(isWin32Pattern('{a,b}')).to.true;
      expect(isWin32Pattern('{1..3}')).to.true;

      // Pattern with middle `!` symbol.
      expect(isWin32Pattern('abc!')).to.true;

      // Completely static pattern.
      expect(isWin32Pattern('')).to.true;
      expect(isWin32Pattern('.')).to.true;
      expect(isWin32Pattern('abc')).to.true;
      expect(isWin32Pattern('~abc')).to.true;
      expect(isWin32Pattern('~/abc')).to.true;
      expect(isWin32Pattern('+~/abc')).to.true;
      expect(isWin32Pattern('@.(abc)')).to.true;
      expect(isWin32Pattern('(a b)')).to.true;
      expect(isWin32Pattern('(a b)')).to.true;
      expect(isWin32Pattern('[abc')).to.true;

      // Unfinished regex character class.
      expect(isWin32Pattern('[')).to.true;
      expect(isWin32Pattern('[abc')).to.true;

      // Unfinished regex group.
      expect(isWin32Pattern('(a|b')).to.true;
      expect(isWin32Pattern('abc/(a|b')).to.true;

      // Unfinished glob extension.
      expect(isWin32Pattern('@(')).to.true;
      expect(isWin32Pattern('@(a')).to.true;
      expect(isWin32Pattern('@(a|')).to.true;
      expect(isWin32Pattern('@(a|b')).to.true;

      // Unfinished brace expansions.
      expect(isWin32Pattern('{')).to.true;
      expect(isWin32Pattern('{a')).to.true;
      expect(isWin32Pattern('{,')).to.true;
      expect(isWin32Pattern('{a,')).to.true;
      expect(isWin32Pattern('{a,b')).to.true;
    } else {
      // Patterns that include common glob symbols.
      expect(isWin32Pattern('*')).to.false;
      expect(isWin32Pattern('abc/*')).to.false;
      expect(isWin32Pattern('!abc')).to.false;

      // Single question ?.
      expect(isWin32Pattern('?')).to.false;
      expect(isWin32Pattern('abc/?')).to.false;

      // Patterns that include regex group symbols.
      expect(isWin32Pattern('(a|)')).to.false;
      expect(isWin32Pattern('(a|b)')).to.false;
      expect(isWin32Pattern('abc/(a|b)')).to.false;

      // Ptterns that include regex character class symbols.
      expect(isWin32Pattern('[abc]')).to.false;
      expect(isWin32Pattern('abc/[abc]')).to.false;
      expect(isWin32Pattern('[^abc]')).to.false;
      expect(isWin32Pattern('abc/[^abc]')).to.false;
      expect(isWin32Pattern('[1-3]')).to.false;
      expect(isWin32Pattern('abc/[1-3]')).to.false;
      expect(isWin32Pattern('[[:alpha:][:digit:]]')).to.false;
      expect(isWin32Pattern('abc/[[:alpha:][:digit:]]')).to.false;

      // Patterns that include glob extension symbols.
      expect(isWin32Pattern('@()')).to.false;
      expect(isWin32Pattern('@(a)')).to.false;
      expect(isWin32Pattern('@(a|b)')).to.false;
      expect(isWin32Pattern('abc/!(a|b)')).to.false;
      expect(isWin32Pattern('*(a|b)')).to.false;
      expect(isWin32Pattern('?(a|b)')).to.false;
      expect(isWin32Pattern('+(a|b)')).to.false;

      // Patterns that include brace expansions symbols.
      expect(isWin32Pattern('{,}')).to.false;
      expect(isWin32Pattern('{a,}')).to.false;
      expect(isWin32Pattern('{,b}')).to.false;
      expect(isWin32Pattern('{a,b}')).to.false;
      expect(isWin32Pattern('{1..3}')).to.false;

      // Pattern with middle `!` symbol.
      expect(isWin32Pattern('abc!')).to.false;

      // Completely static pattern.
      expect(isWin32Pattern('')).to.false;
      expect(isWin32Pattern('.')).to.false;
      expect(isWin32Pattern('abc')).to.false;
      expect(isWin32Pattern('~abc')).to.false;
      expect(isWin32Pattern('~/abc')).to.false;
      expect(isWin32Pattern('+~/abc')).to.false;
      expect(isWin32Pattern('@.(abc)')).to.false;
      expect(isWin32Pattern('(a b)')).to.false;
      expect(isWin32Pattern('(a b)')).to.false;
      expect(isWin32Pattern('[abc')).to.false;

      // Unfinished regex character class.
      expect(isWin32Pattern('[')).to.false;
      expect(isWin32Pattern('[abc')).to.false;

      // Unfinished regex group.
      expect(isWin32Pattern('(a|b')).to.false;
      expect(isWin32Pattern('abc/(a|b')).to.false;

      // Unfinished glob extension.
      expect(isWin32Pattern('@(')).to.false;
      expect(isWin32Pattern('@(a')).to.false;
      expect(isWin32Pattern('@(a|')).to.false;
      expect(isWin32Pattern('@(a|b')).to.false;

      // Unfinished brace expansions.
      expect(isWin32Pattern('{')).to.false;
      expect(isWin32Pattern('{a')).to.false;
      expect(isWin32Pattern('{,')).to.false;
      expect(isWin32Pattern('{a,')).to.false;
      expect(isWin32Pattern('{a,b')).to.false;
    }
  });

  it('removeLeadingDot', function () {
    expect(removeLeadingDot('')).to.equal('');
    expect(removeLeadingDot('./a')).to.equal('a');
    expect(removeLeadingDot('.')).to.equal('.');
    expect(removeLeadingDot('./')).to.equal('');
    expect(removeLeadingDot('.\\')).to.equal('');
  });

  describe('resolvePattern', function () {
    it('invalid context throws', function () {
      // Context is glob.
      expect(function () {
        resolvePattern('*.js', '**')
      }).to.throw('Context must be non glob.');
      expect(function () {
        resolvePattern('a/b', '**')
      }).to.throw('Context must be non glob.');

      // Context is relative.
      expect(function () {
        resolvePattern('*.js', 'path/from')
      }).to.throw('Context must be an absolute directory.');
      expect(function () {
        resolvePattern('a/b', 'path/from')
      }).to.throw('Context must be an absolute directory.');

      // Context start with slash.
      if (isWin32) {
        expect(function () {
          resolvePattern('*.js', '/path/from')
        }).to.throw('Context must be an absolute directory.');
        expect(function () {
          resolvePattern('a/b', '/path/from')
        }).to.throw('Context must be an absolute directory.');
      } else {
        expect(function () {
          resolvePattern('*.js', '/path/from')
        }).to.not.throw('Context must be an absolute directory.');
        expect(function () {
          resolvePattern('a/b', '/path/from')
        }).to.not.throw('Context must be an absolute directory.');
      }
    });

    it('absolute pattern', function () {
      // Non glob.
      if (isWin32) {
        expect(resolvePattern('c:/')).to.equal('c:/');
      } else {
        expect(resolvePattern('/')).to.equal('/');
      }
    });

    it('relative pattern', function () {
      // Non glob pattern.
      if (isWin32) {
        expect(resolvePattern('.', 'c:/a')).to.equal('c:/a');
        expect(resolvePattern('..', 'c:/a')).to.equal('c:/');
        expect(resolvePattern('a', 'c:/')).to.equal('c:/a');
      } else {
        expect(resolvePattern('.', '/a')).to.equal('/a');
        expect(resolvePattern('..', '/a')).to.equal('/');
        expect(resolvePattern('a', '/')).to.equal('/a');
      }

      // Glob pattern.
      if (isWin32) {
        // Patterns that include common glob symbols.
        expect(resolvePattern('*', 'c:/')).to.equal('c:/*');
        expect(resolvePattern('abc/*', 'c:/')).to.equal('c:/abc/*');
        expect(resolvePattern('!abc', 'c:/')).to.equal('!c:/abc');

        // Single question ?.
        expect(resolvePattern('?', 'c:/')).to.equal('c:/?');
        expect(resolvePattern('abc/?', 'c:/')).to.equal('c:/abc/?');

        // Patterns that include regex group symbols.
        expect(resolvePattern('(a|)', 'c:/')).to.equal('c:/(a|)');
        expect(resolvePattern('(a|b)', 'c:/')).to.equal('c:/(a|b)');
        expect(resolvePattern('abc/(a|b)', 'c:/')).to.equal('c:/abc/(a|b)');

        // Ptterns that include regex character class symbols.
        expect(resolvePattern('[abc]', 'c:/')).to.equal('c:/[abc]');
        expect(resolvePattern('abc/[abc]', 'c:/')).to.equal('c:/abc/[abc]');
        expect(resolvePattern('[^abc]', 'c:/')).to.equal('c:/[^abc]');
        expect(resolvePattern('abc/[^abc]', 'c:/')).to.equal('c:/abc/[^abc]');
        expect(resolvePattern('[1-3]', 'c:/')).to.equal('c:/[1-3]');
        expect(resolvePattern('abc/[1-3]', 'c:/')).to.equal('c:/abc/[1-3]');
        expect(resolvePattern('[[:alpha:][:digit:]]', 'c:/')).to.equal('c:/[[:alpha:][:digit:]]');
        expect(resolvePattern('abc/[[:alpha:][:digit:]]', 'c:/')).to.equal('c:/abc/[[:alpha:][:digit:]]');

        // Patterns that include glob extension symbols.
        expect(resolvePattern('@()', 'c:/')).to.equal('c:/@()');
        expect(resolvePattern('@(a)', 'c:/')).to.equal('c:/@(a)');
        expect(resolvePattern('@(a|b)', 'c:/')).to.equal('c:/@(a|b)');
        expect(resolvePattern('abc/!(a|b)', 'c:/')).to.equal('c:/abc/!(a|b)');
        expect(resolvePattern('*(a|b)', 'c:/')).to.equal('c:/*(a|b)');
        expect(resolvePattern('?(a|b)', 'c:/')).to.equal('c:/?(a|b)');
        expect(resolvePattern('+(a|b)', 'c:/')).to.equal('c:/+(a|b)');

        // Patterns that include brace expansions symbols.
        expect(resolvePattern('{,}', 'c:/')).to.equal('c:/{,}');
        expect(resolvePattern('{a,}', 'c:/')).to.equal('c:/{a,}');
        expect(resolvePattern('{,b}', 'c:/')).to.equal('c:/{,b}');
        expect(resolvePattern('{a,b}', 'c:/')).to.equal('c:/{a,b}');
        expect(resolvePattern('{1..3}', 'c:/')).to.equal('c:/{1..3}');

        // Pattern with middle `!` symbol.
        expect(resolvePattern('abc!', 'c:/')).to.equal('c:/abc!');

        // Completely static pattern.
        expect(resolvePattern('', 'c:/')).to.equal('c:/');
        expect(resolvePattern('.', 'c:/')).to.equal('c:/');
        expect(resolvePattern('abc', 'c:/')).to.equal('c:/abc');
        expect(resolvePattern('~abc', 'c:/')).to.equal('c:/~abc');
        expect(resolvePattern('~/abc', 'c:/')).to.equal('c:/~/abc');
        expect(resolvePattern('+~/abc', 'c:/')).to.equal('c:/+~/abc');
        expect(resolvePattern('@.(abc)', 'c:/')).to.equal('c:/@.(abc)');
        expect(resolvePattern('(a b)', 'c:/')).to.equal('c:/(a b)');
        expect(resolvePattern('(a b)', 'c:/')).to.equal('c:/(a b)');
        expect(resolvePattern('[abc', 'c:/')).to.equal('c:/[abc');

        // Unfinished regex character class.
        expect(resolvePattern('[', 'c:/')).to.equal('c:/[');
        expect(resolvePattern('[abc', 'c:/')).to.equal('c:/[abc');

        // Unfinished regex group.
        expect(resolvePattern('(a|b', 'c:/')).to.equal('c:/(a|b');
        expect(resolvePattern('abc/(a|b', 'c:/')).to.equal('c:/abc/(a|b');

        // Unfinished glob extension.
        expect(resolvePattern('@(', 'c:/')).to.equal('c:/@(');
        expect(resolvePattern('@(a', 'c:/')).to.equal('c:/@(a');
        expect(resolvePattern('@(a|', 'c:/')).to.equal('c:/@(a|');
        expect(resolvePattern('@(a|b', 'c:/')).to.equal('c:/@(a|b');

        // Unfinished brace expansions.
        expect(resolvePattern('{', 'c:/')).to.equal('c:/{');
        expect(resolvePattern('{a', 'c:/')).to.equal('c:/{a');
        expect(resolvePattern('{,', 'c:/')).to.equal('c:/{,');
        expect(resolvePattern('{a,', 'c:/')).to.equal('c:/{a,');
        expect(resolvePattern('{a,b', 'c:/')).to.equal('c:/{a,b');
      } else {
        // Patterns that include common glob symbols.
        expect(resolvePattern('*', '/path/')).to.equal('/path/*');
        expect(resolvePattern('abc/*', '/path/')).to.equal('/path/abc/*');
        expect(resolvePattern('!abc', '/path/')).to.equal('!/path/abc');

        // Single question ?.
        expect(resolvePattern('?', '/path/')).to.equal('/path/?');
        expect(resolvePattern('abc/?', '/path/')).to.equal('/path/abc/?');

        // Patterns that include regex group symbols.
        expect(resolvePattern('(a|)', '/path/')).to.equal('/path/(a|)');
        expect(resolvePattern('(a|b)', '/path/')).to.equal('/path/(a|b)');
        expect(resolvePattern('abc/(a|b)', '/path/')).to.equal('/path/abc/(a|b)');

        // Ptterns that include regex character class symbols.
        expect(resolvePattern('[abc]', '/path/')).to.equal('/path/[abc]');
        expect(resolvePattern('abc/[abc]', '/path/')).to.equal('/path/abc/[abc]');
        expect(resolvePattern('[^abc]', '/path/')).to.equal('/path/[^abc]');
        expect(resolvePattern('abc/[^abc]', '/path/')).to.equal('/path/abc/[^abc]');
        expect(resolvePattern('[1-3]', '/path/')).to.equal('/path/[1-3]');
        expect(resolvePattern('abc/[1-3]', '/path/')).to.equal('/path/abc/[1-3]');
        expect(resolvePattern('[[:alpha:][:digit:]]', '/path/')).to.equal('/path/[[:alpha:][:digit:]]');
        expect(resolvePattern('abc/[[:alpha:][:digit:]]', '/path/')).to.equal('/path/abc/[[:alpha:][:digit:]]');

        // Patterns that include glob extension symbols.
        expect(resolvePattern('@()', '/path/')).to.equal('/path/@()');
        expect(resolvePattern('@(a)', '/path/')).to.equal('/path/@(a)');
        expect(resolvePattern('@(a|b)', '/path/')).to.equal('/path/@(a|b)');
        expect(resolvePattern('abc/!(a|b)', '/path/')).to.equal('/path/abc/!(a|b)');
        expect(resolvePattern('*(a|b)', '/path/')).to.equal('/path/*(a|b)');
        expect(resolvePattern('?(a|b)', '/path/')).to.equal('/path/?(a|b)');
        expect(resolvePattern('+(a|b)', '/path/')).to.equal('/path/+(a|b)');

        // Patterns that include brace expansions symbols.
        expect(resolvePattern('{,}', '/path/')).to.equal('/path/{,}');
        expect(resolvePattern('{a,}', '/path/')).to.equal('/path/{a,}');
        expect(resolvePattern('{,b}', '/path/')).to.equal('/path/{,b}');
        expect(resolvePattern('{a,b}', '/path/')).to.equal('/path/{a,b}');
        expect(resolvePattern('{1..3}', '/path/')).to.equal('/path/{1..3}');

        // Pattern with middle `!` symbol.
        expect(resolvePattern('abc!', '/path/')).to.equal('/path/abc!');

        // Completely static pattern.
        expect(resolvePattern('', '/path/')).to.equal('/path');
        expect(resolvePattern('.', '/path/')).to.equal('/path');
        expect(resolvePattern('abc', '/path/')).to.equal('/path/abc');
        expect(resolvePattern('~abc', '/path/')).to.equal('/path/~abc');
        expect(resolvePattern('~/abc', '/path/')).to.equal('/path/~/abc');
        expect(resolvePattern('+~/abc', '/path/')).to.equal('/path/+~/abc');
        expect(resolvePattern('@.(abc)', '/path/')).to.equal('/path/@.(abc)');
        expect(resolvePattern('(a b)', '/path/')).to.equal('/path/(a b)');
        expect(resolvePattern('(a b)', '/path/')).to.equal('/path/(a b)');
        expect(resolvePattern('[abc', '/path/')).to.equal('/path/[abc');

        // Unfinished regex character class.
        expect(resolvePattern('[', '/path/')).to.equal('/path/[');
        expect(resolvePattern('[abc', '/path/')).to.equal('/path/[abc');

        // Unfinished regex group.
        expect(resolvePattern('(a|b', '/path/')).to.equal('/path/(a|b');
        expect(resolvePattern('abc/(a|b', '/path/')).to.equal('/path/abc/(a|b');

        // Unfinished glob extension.
        expect(resolvePattern('@(', '/path/')).to.equal('/path/@(');
        expect(resolvePattern('@(a', '/path/')).to.equal('/path/@(a');
        expect(resolvePattern('@(a|', '/path/')).to.equal('/path/@(a|');
        expect(resolvePattern('@(a|b', '/path/')).to.equal('/path/@(a|b');

        // Unfinished brace expansions.
        expect(resolvePattern('{', '/path/')).to.equal('/path/{');
        expect(resolvePattern('{a', '/path/')).to.equal('/path/{a');
        expect(resolvePattern('{,', '/path/')).to.equal('/path/{,');
        expect(resolvePattern('{a,', '/path/')).to.equal('/path/{a,');
        expect(resolvePattern('{a,b', '/path/')).to.equal('/path/{a,b');
      }
    });
  });

  describe('unixlike', function () {
    it('non-glob pattern', function () {
      expect(unixlike('')).to.equal('.');
      expect(unixlike('!')).to.equal('!.');

      expect(unixlike('.')).to.equal('.');
      expect(unixlike('..')).to.equal('..');

      expect(unixlike('/')).to.equal('/');
      expect(unixlike('\\')).to.equal('/');

      expect(unixlike('./')).to.equal('./');
      expect(unixlike('.\\')).to.equal('./');
    });

    it('mixing slash and backslash', function () {
      // Relative.
      expect(unixlike('a\\b\\c')).to.equal('a/b/c');
      expect(unixlike('a/b\\c')).to.equal('a/b/c');
      expect(unixlike('a/b\\\\c')).to.equal('a/b/c');
      expect(unixlike('!a/b\\\\c')).to.equal('!a/b/c');

      // Start with slash.
      expect(unixlike('//a\\b\\c')).to.equal('/a/b/c');
      expect(unixlike('//a/b\\c')).to.equal('/a/b/c');
      expect(unixlike('//a/b\\\\c')).to.equal('/a/b/c');
      expect(unixlike('!//a/b\\\\c')).to.equal('!/a/b/c');

      // Start with backslash.
      expect(unixlike('\\\\a\\b\\c')).to.equal('/a/b/c');
      expect(unixlike('\\\\a/b\\c')).to.equal('/a/b/c');
      expect(unixlike('\\\\a/b\\\\c')).to.equal('/a/b/c');
      expect(unixlike('!\\\\a/b\\\\c')).to.equal('!/a/b/c');

      // Start with drive number.
      expect(unixlike('c://a\\b\\c')).to.equal('c:/a/b/c');
      expect(unixlike('c://a/b\\c')).to.equal('c:/a/b/c');
      expect(unixlike('c://a/b\\\\c')).to.equal('c:/a/b/c');
      expect(unixlike('!c://a/b\\\\c')).to.equal('!c:/a/b/c');
      expect(unixlike('c:\\\\a\\b\\c')).to.equal('c:/a/b/c');
      expect(unixlike('c:\\\\a/b\\c')).to.equal('c:/a/b/c');
      expect(unixlike('c:\\\\a/b\\\\c')).to.equal('c:/a/b/c');
      expect(unixlike('!c:\\\\a/b\\\\c')).to.equal('!c:/a/b/c');
    });

    it('pattern with slash', function () {
      expect(unixlike('/.*')).to.equal('/.*');
      expect(unixlike('/.*/')).to.equal('/.*/');
      expect(unixlike('a/.*/b')).to.equal('a/.*/b');
      expect(unixlike('a*/.*/b')).to.equal('a*/.*/b');
      expect(unixlike('*/a/b/c')).to.equal('*/a/b/c');
      expect(unixlike('*')).to.equal('*');
      expect(unixlike('*/')).to.equal('*/');
      expect(unixlike('*/*')).to.equal('*/*');
      expect(unixlike('*/*/')).to.equal('*/*/');
      expect(unixlike('**')).to.equal('**');
      expect(unixlike('**/')).to.equal('**/');
      expect(unixlike('**/*')).to.equal('**/*');
      expect(unixlike('**/*/')).to.equal('**/*/');
      expect(unixlike('/*.js')).to.equal('/*.js');
      expect(unixlike('*.js')).to.equal('*.js');
      expect(unixlike('**/*.js')).to.equal('**/*.js');
      expect(unixlike('{a,b}')).to.equal('{a,b}');
      expect(unixlike('/{a,b}')).to.equal('/{a,b}');
      expect(unixlike('/{a,b}/')).to.equal('/{a,b}/');
      expect(unixlike('(a|b)')).to.equal('(a|b)');
      expect(unixlike('/(a|b)')).to.equal('/(a|b)');
      expect(unixlike('./(a|b)')).to.equal('(a|b)');
      expect(unixlike('a/(b c)')).to.equal('a/(b c)'); // not an extglob
      expect(unixlike('a/(b c)/')).to.equal('a/(b c)/'); // not an extglob
      expect(unixlike('a/(b c)/d')).to.equal('a/(b c)/d'); // not an extglob
      expect(unixlike('path/to/*.js')).to.equal('path/to/*.js');
      expect(unixlike('/root/path/to/*.js')).to.equal('/root/path/to/*.js');
      expect(unixlike('chapter/foo [bar]/')).to.equal('chapter/foo [bar]/');
      expect(unixlike('path/[a-z]')).to.equal('path/[a-z]');
      expect(unixlike('[a-z]')).to.equal('[a-z]');
      expect(unixlike('path/{to,from}')).to.equal('path/{to,from}');
      expect(unixlike('path/(to|from)')).to.equal('path/(to|from)');
      expect(unixlike('(foo bar)/subdir/foo.*')).to.equal('(foo bar)/subdir/foo.*');
      expect(unixlike('path/!(to|from)')).to.equal('path/!(to|from)');
      expect(unixlike('path/?(to|from)')).to.equal('path/?(to|from)');
      expect(unixlike('path/+(to|from)')).to.equal('path/+(to|from)');
      expect(unixlike('path/*(to|from)')).to.equal('path/*(to|from)');
      expect(unixlike('path/@(to|from)')).to.equal('path/@(to|from)');

      expect(unixlike('path/!/foo')).to.equal('path/!/foo');
      expect(unixlike('path/?/foo')).to.equal('path/?/foo');
      expect(unixlike('path/+/foo')).to.equal('path/+/foo');
      expect(unixlike('path/*/foo')).to.equal('path/*/foo');
      expect(unixlike('path/@/foo')).to.equal('path/@/foo');
      expect(unixlike('path/!/foo/')).to.equal('path/!/foo/');
      expect(unixlike('path/?/foo/')).to.equal('path/?/foo/');
      expect(unixlike('path/+/foo/')).to.equal('path/+/foo/');
      expect(unixlike('path/*/foo/')).to.equal('path/*/foo/');
      expect(unixlike('path/@/foo/')).to.equal('path/@/foo/');
      expect(unixlike('path/**/*')).to.equal('path/**/*');
      expect(unixlike('path/**/subdir/foo.*')).to.equal('path/**/subdir/foo.*');
      expect(unixlike('path/subdir/**/foo.js')).to.equal('path/subdir/**/foo.js');
      expect(unixlike('path/!subdir/foo.js')).to.equal('path/!subdir/foo.js');
      expect(unixlike('path/{foo,bar}/')).to.equal('path/{foo,bar}/');
    });

    it('pattern with backslash', function () {
      expect(unixlike('\\.*')).to.equal('/.*');
      expect(unixlike('\\.*\\')).to.equal('/.*/');
      expect(unixlike('a\\.*\\b')).to.equal('a/.*/b');
      expect(unixlike('a*\\.*\\b')).to.equal('a*/.*/b');
      expect(unixlike('*\\a\\b\\c')).to.equal('*/a/b/c');
      expect(unixlike('*')).to.equal('*');
      expect(unixlike('*\\')).to.equal('*/');
      expect(unixlike('*\\*')).to.equal('*/*');
      expect(unixlike('*\\*\\')).to.equal('*/*/');
      expect(unixlike('**')).to.equal('**');
      expect(unixlike('**\\')).to.equal('**/');
      expect(unixlike('**\\*')).to.equal('**/*');
      expect(unixlike('**\\*\\')).to.equal('**/*/');
      expect(unixlike('\\*.js')).to.equal('/*.js');
      expect(unixlike('*.js')).to.equal('*.js');
      expect(unixlike('**\\*.js')).to.equal('**/*.js');
      expect(unixlike('{a,b}')).to.equal('{a,b}');
      expect(unixlike('\\{a,b}')).to.equal('/{a,b}');
      expect(unixlike('\\{a,b}\\')).to.equal('/{a,b}/');
      expect(unixlike('(a|b)')).to.equal('(a|b)');
      expect(unixlike('\\(a|b)')).to.equal('/(a|b)');
      expect(unixlike('.\\(a|b)')).to.equal('(a|b)');
      expect(unixlike('a\\(b c)')).to.equal('a/(b c)'); // not an extglob
      expect(unixlike('a\\(b c)\\')).to.equal('a/(b c)/'); // not an extglob
      expect(unixlike('a\\(b c)\\d')).to.equal('a/(b c)/d'); // not an extglob
      expect(unixlike('path\\to\\*.js')).to.equal('path/to/*.js');
      expect(unixlike('\\root\\path\\to\\*.js')).to.equal('/root/path/to/*.js');
      expect(unixlike('chapter\\foo [bar]\\')).to.equal('chapter/foo [bar]/');
      expect(unixlike('path\\[a-z]')).to.equal('path/[a-z]');
      expect(unixlike('[a-z]')).to.equal('[a-z]');
      expect(unixlike('path\\{to,from}')).to.equal('path/{to,from}');
      expect(unixlike('path\\(to|from)')).to.equal('path/(to|from)');
      expect(unixlike('path\\(foo bar)\\subdir\\foo.*')).to.equal('path/(foo bar)/subdir/foo.*');
      expect(unixlike('path\\!(to|from)')).to.equal('path/!(to|from)');
      expect(unixlike('path\\?(to|from)')).to.equal('path/?(to|from)');
      expect(unixlike('path\\+(to|from)')).to.equal('path/+(to|from)');
      expect(unixlike('path\\*(to|from)')).to.equal('path/*(to|from)');
      expect(unixlike('path\\@(to|from)')).to.equal('path/@(to|from)');

      expect(unixlike('path\\!\\foo')).to.equal('path/!/foo');
      expect(unixlike('path\\?\\foo')).to.equal('path/?/foo');
      expect(unixlike('path\\+\\foo')).to.equal('path/+/foo');
      expect(unixlike('path\\*\\foo')).to.equal('path/*/foo');
      expect(unixlike('path\\@\\foo')).to.equal('path/@/foo');
      expect(unixlike('path\\!\\foo\\')).to.equal('path/!/foo/');
      expect(unixlike('path\\?\\foo\\')).to.equal('path/?/foo/');
      expect(unixlike('path\\+\\foo\\')).to.equal('path/+/foo/');
      expect(unixlike('path\\*\\foo\\')).to.equal('path/*/foo/');
      expect(unixlike('path\\@\\foo\\')).to.equal('path/@/foo/');
      expect(unixlike('path\\**\\*')).to.equal('path/**/*');
      expect(unixlike('path\\**\\subdir\\foo.*')).to.equal('path/**/subdir/foo.*');
      expect(unixlike('path\\subdir\\**\\foo.js')).to.equal('path/subdir/**/foo.js');
      expect(unixlike('path\\!subdir\\foo.js')).to.equal('path/!subdir/foo.js');
      expect(unixlike('path\\{foo,bar}\\')).to.equal('path/{foo,bar}/');
    });
  });
});
