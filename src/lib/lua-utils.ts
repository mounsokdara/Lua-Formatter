
import { parse } from 'full-moon';

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
 * Checks if the Lua code contains any comments.
 * @param code The input Lua code string.
 * @returns True if comments are found, false otherwise.
 */
export function hasComments(code: string): boolean {
  // Regex for multi-line comments: --[[ ... ]] or --[=[ ... ]=]
  const multiLineRegex = /--\[(=*)\[[\s\S]*?\]\1\]/;
  // Regex for single-line comments that are not part of a multi-line comment start
  const singleLineRegex = /--(?![\[=]*\[)/;
  
  return multiLineRegex.test(code) || singleLineRegex.test(code);
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
 * It can convert one-liners into multi-line formatted code.
 * @param code The input Lua code string.
 * @returns Formatted code.
 */
export function beautifyCode(code: string): string {
  try {
    const ast = parse(code);
    return JSON.stringify(ast, null, 2);
  } catch (e) {
    console.error('Error beautifying code:', e);
    return code;
  }
}
