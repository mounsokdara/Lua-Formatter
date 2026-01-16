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
 * It removes all comments and extra whitespace.
 * @param code The input Lua code.
 * @returns Single-line code string.
 */
export function toOneLiner(code: string): string {
  // First, remove all comments.
  let oneLiner = deleteAllComments(code);
  // Replace newlines and tabs with a space, then collapse multiple spaces.
  oneLiner = oneLiner.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  return oneLiner;
}

/**
 * A basic Lua code beautifier.
 * NOTE: This is a simple formatter based on keywords and may not handle all complex Lua syntax correctly.
 * @param code The input Lua code.
 * @param commentOption How to handle comments: 'delete' or 'convert' single-line to block comments.
 * @returns Formatted code string.
 */
export function beautifyCode(code: string, commentOption: 'delete' | 'convert'): string {
  let currentCode = code;
  if (commentOption === 'delete') {
    currentCode = deleteAllComments(code);
  } else if (commentOption === 'convert') {
    // Convert single-line comments to block comments (--[[...]])
    currentCode = currentCode.replace(/--[ \t]*(?!\[(?:=|\[)?)(.*)/g, (match, content) => {
        const trimmed = content.trim();
        return trimmed ? `--[[ ${trimmed} ]]` : '';
    });
  }

  const lines = currentCode.split('\n');
  let indentLevel = 0;
  const indentUnit = '  ';
  const formattedLines: string[] = [];

  const increaseKeywords = ['function', 'if', 'for', 'while', 'repeat'];
  const decreaseKeywords = ['end', 'until'];
  const middleKeywords = ['else', 'elseif'];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Don't process empty lines
    if (trimmedLine === '') {
        formattedLines.push('');
        continue;
    }

    const startsWithDecrease = decreaseKeywords.some(kw => trimmedLine.startsWith(kw));
    const startsWithMiddle = middleKeywords.some(kw => trimmedLine.startsWith(kw));
    
    if (startsWithDecrease || startsWithMiddle) {
        indentLevel = Math.max(0, indentLevel - 1);
    }

    formattedLines.push(indentUnit.repeat(indentLevel) + trimmedLine);
    
    const hasIncreaseKeyword = increaseKeywords.some(kw => trimmedLine.startsWith(kw));
    const endsWithDoOrThen = trimmedLine.endsWith('do') || trimmedLine.endsWith('then');
    const isOneLiner = decreaseKeywords.some(kw => trimmedLine.includes(kw));

    if ((hasIncreaseKeyword || endsWithDoOrThen) && !isOneLiner) {
        indentLevel++;
    }
    
    if (startsWithMiddle) {
        indentLevel++;
    }
  }

  return formattedLines.join('\n');
}
