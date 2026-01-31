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

// Helper to escape regex special characters
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/**
 * Deletes comments from Lua code based on a set of options.
 * @param code The input Lua code.
 * @param options An object specifying which comments to delete.
 * @returns Code with specified comments removed.
 */
export function deleteCustomComments(
  code: string, 
  options: {
    singleLine: boolean;
    multiLine: boolean;
    customSingle: string;
    customMultiStart: string;
    customMultiEnd: string;
  }
): string {
  const { protectedCode, strings } = protectStrings(code);
  let processedCode = protectedCode;

  // Standard single-line comments
  if (options.singleLine) {
    processedCode = processedCode.replace(/--[^\n]*/g, '');
  }
  // Standard multi-line comments
  if (options.multiLine) {
    processedCode = processedCode
      .replace(/--\[\[[\s\S]*?\]\]/g, '')
      .replace(/--\[=\[[\s\S]*?\]=\]/g, '');
  }

  // Custom single-line comments
  if (options.customSingle) {
    const customSinglePrefix = escapeRegExp(options.customSingle);
    const regex = new RegExp(`${customSinglePrefix}[^\\n]*`, 'g');
    processedCode = processedCode.replace(regex, '');
  }

  // Custom multi-line comments
  if (options.customMultiStart && options.customMultiEnd) {
    const customStart = escapeRegExp(options.customMultiStart);
    const customEnd = escapeRegExp(options.customMultiEnd);
    const regex = new RegExp(`${customStart}[\\s\\S]*?${customEnd}`, 'g');
    processedCode = processedCode.replace(regex, '');
  }
  
  const codeWithCleanedLines = processedCode.replace(/\n\s*\n/g, '\n').trim();

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

  // If preserving comments, we need to convert single-line comments to block comments
  // to prevent them from consuming the rest of the one-liner.
  if (commentOption === 'preserve') {
    const { protectedCode, strings } = protectStrings(code);
    
    const lines = protectedCode.split('\n');
    const newLines = lines.map(line => {
      const commentIndex = line.indexOf('--');
      
      // Check if it's a true single-line comment (and not a block comment starter)
      if (commentIndex !== -1 && !line.substring(commentIndex).startsWith('--[')) {
        const codePart = line.substring(0, commentIndex);
        const commentPart = line.substring(commentIndex + 2);

        // If the original comment text contains the block comment terminator,
        // this simple wrapping will break. As a safe fallback, we'll just remove
        // such problematic comments instead of trying complex wrapping.
        if (commentPart.includes(']]')) {
          return codePart;
        }

        // Wrap the single-line comment into a block comment.
        return codePart + ' --[[' + commentPart + ']]';
      }
      return line;
    });
    // Join lines with a space, now that single-line comments are safely wrapped.
    processedCode = restoreStrings(newLines.join(' '), strings);
  } else {
    // If deleting comments, just use the existing safe function.
    processedCode = deleteAllComments(processedCode);
  }

  // Final step: collapse all newlines and extra spaces from the processed code.
  // This handles both the 'preserve' and 'delete' paths.
  const { protectedCode: finalProtectedCode, strings: finalStrings } = protectStrings(processedCode);
  const oneLiner = finalProtectedCode
    .replace(/\s*\n\s*/g, ' ') // Replace any remaining newlines with spaces
    .replace(/ +/g, ' ')       // Collapse multiple spaces into one
    .trim();

  return restoreStrings(oneLiner, finalStrings);
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

    // Add newlines after parentheses only if they are followed by a word character (likely a new statement)
    let processedCode = initialProtectedCode
        .replace(/\)\s*(\w)/g, ')\n$1') 
        .replace(/\b(then)\b/g, 'then\n')
        .replace(/\b(else)\b/g, '\nelse\n')
        .replace(/\b(elseif)\b/g, '\nelseif ')
        .replace(/(\bend\b|end\))/g, '\n$1') // handle "end" and "end)"
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
        
        if (decreaseIndentKeywords.includes(firstWord) || midBlockKeywords.includes(firstWord) || trimmedLine.startsWith('end)')) {
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

/**
 * Extracts all comments from a Lua code string for inspection.
 * Note: This function is for display/inspection and may find false positives within complex string literals.
 * The deletion functions are safer.
 * @param code The input Lua code.
 * @returns An array of objects containing the line number and content of each comment.
 */
export function extractAllComments(code: string): { line: number, content: string }[] {
    const comments: { line: number, content: string }[] = [];
    // This regex finds both multi-line block comments and single-line comments.
    const commentRegex = /--\[(=*)\[[\s\S]*?\]\1\]|--[^\n]*/g;
    
    let match;
    while ((match = commentRegex.exec(code)) !== null) {
      // Calculate the line number where the comment starts.
      const line = (code.substring(0, match.index).match(/\n/g) || []).length + 1;
      comments.push({ line, content: match[0] });
    }

    return comments;
}
