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
 * It converts single-line comments to block comments to preserve them.
 * @param code The input Lua code.
 * @returns Single-line code string.
 */
export function toOneLiner(code: string): string {
  // Convert single-line comments to block comments to preserve them.
  // This is necessary because a single-line comment would comment out the rest of the code.
  let oneLiner = code.replace(/--[ \t]*(?!\[(?:=|\[)?)(.*)/g, (match, content) => {
      const trimmed = content.trim();
      return trimmed ? ` --[[ ${trimmed} ]] ` : '';
  });
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
