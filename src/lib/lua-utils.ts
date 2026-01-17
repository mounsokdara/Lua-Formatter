/**
 * Removes all single-line and multi-line comments from Lua code.
 * @param code The input Lua code string.
 * @returns Code with comments removed.
 */
export function deleteAllComments(code: string): string {
  // Remove multi-line comments, including nested ones of the form --[=[ ... ]=]
  let result = code.replace(/--\[(=*)\[[\s\S]*?\]\1\]/g, '');
  // Remove single-line comments that are not part of a multi-line comment start
  result = result.replace(/--(?![\[=]*\[).*/g, '');
  // Remove resulting empty lines
  result = result.replace(/^\s*[\r\n]/gm, '');
  return result;
}

/**
 * Converts multi-line Lua code into a single line.
 * @param code The input Lua code.
 * @param commentOption Whether to 'preserve' or 'delete' comments.
 * @returns Single-line code string.
 */
export function toOneLiner(code: string, commentOption: 'preserve' | 'delete'): string {
  let oneLiner = code;
  if (commentOption === 'delete') {
    oneLiner = deleteAllComments(oneLiner);
  } else {
    // Preserve: Convert single-line comments to block comments to preserve them.
    // This is necessary because a single-line comment would comment out the rest of the code.
    oneLiner = oneLiner.replace(/--[ \t]*(?!\[(?:=|\[)?)(.*)/g, (match, content) => {
        const trimmed = content.trim();
        return trimmed ? ` --[[ ${trimmed} ]] ` : '';
    });
  }
  
  // Replace newlines and tabs with a space, then collapse multiple spaces.
  oneLiner = oneLiner.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  return oneLiner;
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
 * Beautifies Lua code with basic indentation. Note: this is a simple formatter and may not be perfect.
 * @param code The input Lua code string.
 * @returns Formatted code.
 */
export function beautifyCode(code: string): string {
  const lines = code.split('\n');
  let result = '';
  let indent = 0;
  const indentUnit = '  ';

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      result += '\n';
      continue;
    }

    if (
      line.startsWith('end') ||
      line.startsWith('else') ||
      line.startsWith('elseif') ||
      line.startsWith('until')
    ) {
      indent = Math.max(0, indent - 1);
    }

    result += indentUnit.repeat(indent) + line + '\n';
    
    if (
      line.startsWith('function') ||
      line.startsWith('if') ||
      line.startsWith('for') ||
      line.startsWith('while') ||
      line.startsWith('repeat') ||
      /\b(then|do)$/.test(line)
    ) {
        indent++;
    }
  }
  return result.replace(/\n{2,}/g, '\n').trim();
}
