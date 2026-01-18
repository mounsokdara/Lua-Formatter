/**
 * A simplified check for comments. May have false positives inside strings.
 * @param code The input Lua code string.
 * @returns True if comments are likely present, false otherwise.
 */
export function hasComments(code: string): boolean {
  // This is a simplified check. It will be true if '--' appears anywhere.
  return /--/.test(code);
}

/**
 * A simplified function to delete comments.
 * WARNING: This can break code if comment-like syntax appears inside strings.
 * @param code The input Lua code string.
 * @returns Code with comments removed.
 */
export function deleteAllComments(code: string): string {
  // This regex is basic and can fail on complex cases (e.g., -- in a string)
  // Remove multi-line comments first to avoid conflicts
  let noComments = code.replace(/--\[\[[\s\S]*?\]\]/g, '');
  noComments = noComments.replace(/--\[=\[[\s\S]*?\]=\]/g, '');
  // Then remove single-line comments
  noComments = noComments.replace(/--[^\n]*/g, '');
  return noComments.replace(/\n\s*\n/g, '\n').trim(); // Clean up extra blank lines
}

/**
 * Converts multi-line Lua code into a single line.
 * @param code The input Lua code.
 * @param commentOption Whether to 'preserve' or 'delete' comments.
 * @returns Single-line code string.
 */
export function toOneLiner(code: string, commentOption: 'preserve' | 'delete'): string {
  let processedCode = code;
  if (commentOption === 'delete') {
    processedCode = deleteAllComments(processedCode);
  }
  // Replace newlines with spaces, then collapse multiple spaces into one.
  return processedCode.replace(/\s*\n\s*/g, ' ').replace(/ +/g, ' ').trim();
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
 * A simple line-by-line beautifier for Lua code.
 * It does not handle one-liners perfectly but will indent existing multi-line code.
 * @param code The input Lua code string.
 * @returns Formatted code.
 */
export function beautifyCode(code: string): string {
    // First, attempt to split common one-liner patterns
    let processedCode = code
        .replace(/\b(then)\b/g, 'then\n')
        .replace(/(\bdo\b)(?!.*\bdo\b)/g, 'do\n') // only the last do in a line
        .replace(/\b(else)\b/g, '\nelse\n')
        .replace(/\b(elseif)\b/g, '\nelseif ')
        .replace(/(\bend\b)/g, '\n$1')
        .replace(/;\s*/g, ';\n');

    const lines = processedCode.split('\n');
    let beautifiedCode = '';
    let indentLevel = 0;
    const indentChar = '    '; // 4 spaces

    const increaseIndentKeywords = ['function', 'if', 'while', 'for', 'repeat'];
    const decreaseIndentKeywords = ['end', 'until'];
    const midBlockKeywords = ['else', 'elseif'];

    lines.forEach(line => {
        const trimmedLine = line.trim();

        if (trimmedLine.length === 0) {
            return;
        }

        const firstWord = trimmedLine.split(/\s+/)[0];

        if (decreaseIndentKeywords.includes(firstWord) || midBlockKeywords.includes(firstWord)) {
            indentLevel = Math.max(0, indentLevel - 1);
        }

        beautifiedCode += indentChar.repeat(indentLevel) + trimmedLine + '\n';
        
        const lastWord = trimmedLine.split(/\s+/).pop();
        if (increaseIndentKeywords.includes(firstWord) || lastWord === 'then' || lastWord === 'do') {
             if (!(firstWord === 'do' && lastWord === 'end')) {
                indentLevel++;
            }
        }
    });

    return beautifiedCode.trim().replace(/\n\s*\n/g, '\n');
}
