'use server';
/**
 * @fileOverview An AI flow to beautify and correct Lua code.
 *
 * - luaBeautify - A function that handles the Lua code formatting process.
 * - LuaBeautifyInput - The input type for the luaBeautify function.
 * - LuaBeautifyOutput - The return type for the luaBeautify function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LuaBeautifyInputSchema = z.object({
  code: z.string().describe('The Lua code to reformat and correct.'),
  deleteComments: z.boolean().describe('Whether to delete comments from the code.'),
});
export type LuaBeautifyInput = z.infer<typeof LuaBeautifyInputSchema>;

const LuaBeautifyOutputSchema = z.object({
  correctedCode: z.string().describe('The reformatted and syntactically corrected Lua code.'),
});
export type LuaBeautifyOutput = z.infer<typeof LuaBeautifyOutputSchema>;

const prompt = ai.definePrompt({
  name: 'luaBeautifyPrompt',
  input: {schema: LuaBeautifyInputSchema},
  output: {schema: LuaBeautifyOutputSchema},
  prompt: `You are an expert Lua programmer. Your task is to take a given piece of Lua code, reformat it for readability and consistency, and correct any syntax errors you find.

- Ensure proper indentation.
- Standardize spacing around operators.
- Fix any clear syntactical mistakes.
{{#if deleteComments}}
- Remove all comments.
{{else}}
- Preserve all comments and the original intent of the code.
{{/if}}
- Return only the corrected Lua code as a single block, without any additional explanations or markdown formatting.

The user's code is below:
\'\'\'lua
{{{code}}}
\'\'\'`,
});

const luaBeautifyFlow = ai.defineFlow(
  {
    name: 'luaBeautifyFlow',
    inputSchema: LuaBeautifyInputSchema,
    outputSchema: LuaBeautifyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

export async function luaBeautify(input: LuaBeautifyInput): Promise<LuaBeautifyOutput> {
  return luaBeautifyFlow(input);
}
