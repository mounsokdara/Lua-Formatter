// Helper function to safely handle string literals by replacing them with placeholders.
function protectStrings(code: string): { protectedCode: string; strings: string[] } {
  const strings: string[] = [];
  let stringIndex = 0;

  // This function is called iteratively to replace each found string with a placeholder
  const replacer = (match: string) => {
    const placeholder = `__LUA_STRING_${stringIndex++}__`;
    strings.push(match);
    return placeholder;
  };

  // Protect long strings first: [[...]], [=[...]=], etc.
  // Then protect single and double quoted strings. This regex handles escaped quotes.
  const protectedCode = code
    .replace(/\[(=*)\[([\s\S]*?)\]\1\]/g, replacer)
    .replace(/'([^'\\]*(\\.[^'\\]*)*)'|"([^"\\]*(\\.[^"\\]*)*)"/g, replacer);
  
  return { protectedCode, strings };
}

// Helper function to restore the original strings from placeholders.
// It iterates backward to avoid issues with nested placeholders.
function restoreStrings(protectedCode: string, strings: string[]): string {
    let code = protectedCode;
    for (let i = strings.length - 1; i >= 0; i--) {
        code = code.replace(`__LUA_STRING_${i}__`, () => strings[i]);
    }
    return code;
}


/**
 * A safer check for comments that ignores comment-like syntax inside strings.
 * @param code The input Lua code string.
 * @returns True if comments are likely present, false otherwise.
 */
export function hasComments(code: string): boolean {
  const { protectedCode } = protectStrings(code);
  return /--/.test(protectedCode);
}

/**
 * A robust function to delete comments that avoids breaking strings.
 * @param code The input Lua code string.
 * @returns Code with comments removed.
 */
export function deleteAllComments(code: string): string {
  const { protectedCode, strings } = protectStrings(code);

  // These regexes now run on code where strings have been replaced by placeholders.
  let noComments = protectedCode
    .replace(/--\[\[[\s\S]*?\]\]/g, '') // Multi-line block comments
    .replace(/--\[=\[[\s\S]*?\]=\]/g, '') // Alternative multi-line block comments
    .replace(/--[^\n]*/g, ''); // Single-line comments
  
  const codeWithCleanedLines = noComments.replace(/\n\s*\n/g, '\n').trim();

  return restoreStrings(codeWithCleanedLines, strings);
}

/**
 * Converts multi-line Lua code into a single line, safely handling strings.
 * @param code The input Lua code.
 * @param commentOption Whether to 'preserve' or 'delete' comments.
 * @returns Single-line code string.
 */
export function toOneLiner(code: string, commentOption: 'preserve' | 'delete'): string {
  let processedCode = code;
  if (commentOption === 'delete') {
    processedCode = deleteAllComments(processedCode); // This is now safe
  }

  const { protectedCode, strings } = protectStrings(processedCode);
  
  const oneLiner = protectedCode.replace(/\s*\n\s*/g, ' ').replace(/ +/g, ' ').trim();

  return restoreStrings(oneLiner, strings);
}

/**
 * Reverses the input string.
 * @param code The input string.
 * @returns The reversed string.
 */
export function reverseCode(code: string): string {
  return code.split('').reverse().join('');
}


/**
 * A much safer, smarter beautifier for Lua code using string protection.
 * @param code The input Lua code string.
 * @returns Formatted code.
 */
export function beautifyCode(code: string): string {
    const { protectedCode: initialProtectedCode, strings } = protectStrings(code);

    // Split one-liners on the protected code, so strings aren't affected
    let processedCode = initialProtectedCode
        .replace(/\)\s*([a-zA-Z_])/g, ')\n$1') // Add newline after a parenthesis if it's followed by a letter/underscore (likely a new statement)
        .replace(/\b(then)\b/g, 'then\n')
        .replace(/\b(else)\b/g, '\nelse\n')
        .replace(/\b(elseif)\b/g, '\nelseif ')
        .replace(/(\bend\b)/g, '\n$1')
        .replace(/;\s*/g, ';\n');


    const lines = processedCode.split('\n');
    let beautifiedCode = '';
    let indentLevel = 0;
    const indentChar = '    ';

    const increaseIndentKeywords = ['function', 'if', 'while', 'for', 'repeat', 'do'];
    const decreaseIndentKeywords = ['end', 'until'];
    const midBlockKeywords = ['else', 'elseif'];

    lines.forEach(line => {
        const trimmedLine = line.trim();

        if (trimmedLine.length === 0) return;

        const firstWord = trimmedLine.split(/\s+|(?=[^\w\s])/)[0];
        
        if (decreaseIndentKeywords.includes(firstWord) || midBlockKeywords.includes(firstWord)) {
            indentLevel = Math.max(0, indentLevel - 1);
        }

        beautifiedCode += indentChar.repeat(indentLevel) + trimmedLine + '\n';
        
        const lastWord = trimmedLine.split(/\s+/).pop() || '';

        if (increaseIndentKeywords.some(keyword => trimmedLine.startsWith(keyword)) || lastWord === 'then' || lastWord === 'do') {
            if (!(trimmedLine.startsWith('do') && lastWord === 'end')) {
                indentLevel++;
            }
        }
    });

    const finalProtectedCode = beautifiedCode.replace(/\n\s*\n/g, '\n').trim();

    return restoreStrings(finalProtectedCode, strings);
}
