"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeftRight, Copy, Download, Trash2, Bot, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import * as lua from '@/lib/lua-utils';
import { luaBeautify } from '@/ai/flows/lua-beautify-flow';

const initialCode = `-- Example Lua Code
-- A simple function to greet a user

--[=[
  This is a multi-line comment.
  It can span several lines.
]=]

function greet(name)
    local message = "Hello, " .. name .. "!"
    if name == "Lua" then
        message = message .. " Welcome back!"
    end
  print(message) -- Print the final message
end

greet("World")
`;

export function LuaEditor() {
  const [inputCode, setInputCode] = useState<string>(initialCode);
  const [outputCode, setOutputCode] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [oneLinerDialogOpen, setOneLinerDialogOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const { toast } = useToast();

  const handleCopy = () => {
    if (!outputCode) {
      toast({ title: 'Nothing to copy!', description: 'Please process some code first.', variant: 'destructive' });
      return;
    }
    navigator.clipboard.writeText(outputCode);
    toast({ title: 'Copied to clipboard!', description: 'The output code has been copied.' });
  };
  
  const handleDownload = () => {
     if (!outputCode) {
      toast({ title: 'Nothing to download!', description: 'Please process some code first.', variant: 'destructive' });
      return;
    }
    const blob = new Blob([outputCode], { type: 'text/lua' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted_code.lua';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Download started!', description: 'Your .lua file is being downloaded.' });
  };

  const handleBeautify = async (commentOption: 'delete' | 'preserve') => {
    setIsProcessing(true);
    try {
      const result = await luaBeautify({
        code: inputCode,
        deleteComments: commentOption === 'delete',
      });

      if (result.correctedCode) {
        setOutputCode(result.correctedCode);
        toast({ title: 'Code beautified with AI!', description: 'Your code has been reformatted and corrected.' });
      } else {
        throw new Error('AI did not return any code.');
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : 'An unknown AI error occurred';
      toast({ title: 'An error occurred', description: error, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteComments = () => {
    try {
      const result = lua.deleteAllComments(inputCode);
      setOutputCode(result);
      toast({ title: 'Comments deleted!', description: 'All comments have been removed.' });
    } catch (e) {
      const error = e instanceof Error ? e.message : 'An unknown error occurred';
      toast({ title: 'An error occurred', description: error, variant: 'destructive' });
    }
  };

  const handleToOneLiner = (commentOption: 'preserve' | 'delete') => {
    try {
     const result = lua.toOneLiner(inputCode, commentOption);
     setOutputCode(result);
     toast({ title: 'Code converted to one line!', description: 'Multi-line code has been condensed.' });
   } catch (e) {
     const error = e instanceof Error ? e.message : 'An unknown error occurred';
     toast({ title: 'An error occurred', description: error, variant: 'destructive' });
   }
  };

  const handleReverse = () => {
    try {
      const result = lua.reverseCode(inputCode);
      setOutputCode(result);
      toast({ title: 'Code reversed!', description: 'The input code has been reversed.' });
    } catch (e) {
      const error = e instanceof Error ? e.message : 'An unknown error occurred';
      toast({ title: 'An error occurred', description: error, variant: 'destructive' });
    }
  };

  return (
    <>
      <Card className="w-full shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label htmlFor="input-code" className="text-sm font-medium mb-2 block text-muted-foreground">Input Code</label>
              <Textarea
                id="input-code"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Paste your Lua code here..."
                className="font-code h-96 min-h-[300px] lg:h-[500px] text-base border-primary/20 focus:border-primary"
                disabled={isProcessing}
              />
            </div>
            <div>
              <label htmlFor="output-code" className="text-sm font-medium mb-2 block text-muted-foreground">Output Code</label>
              <Textarea
                id="output-code"
                value={isProcessing ? 'AI is thinking...' : outputCode}
                readOnly
                placeholder={isProcessing ? 'AI is thinking...' : 'Processed code will appear here...'}
                className="font-code h-96 min-h-[300px] lg:h-[500px] bg-muted/30 text-base"
              />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Button onClick={() => setDialogOpen(true)} className="bg-accent hover:bg-accent/90" disabled={isProcessing}>
              <Bot className="mr-2 h-4 w-4" /> Beautify with AI
            </Button>
            <Button variant="outline" onClick={handleDeleteComments} disabled={isProcessing}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete Comments
            </Button>
            <Button variant="outline" onClick={() => setOneLinerDialogOpen(true)} disabled={isProcessing}>
              <Sparkles className="mr-2 h-4 w-4" /> To One Liner
            </Button>
            <Button variant="outline" onClick={handleReverse} disabled={isProcessing}>
              <ArrowLeftRight className="mr-2 h-4 w-4" /> Reverse
            </Button>
            <Button variant="secondary" onClick={handleCopy} disabled={isProcessing || !outputCode}>
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
            <Button variant="secondary" onClick={handleDownload} disabled={isProcessing || !outputCode}>
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Beautify Options</AlertDialogTitle>
            <AlertDialogDescription>
              How should comments be handled during beautification? The AI can either remove all comments or try to preserve them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleBeautify('delete')} className="bg-destructive hover:bg-destructive/90">Delete comments</AlertDialogAction>
            <AlertDialogAction onClick={() => handleBeautify('preserve')} className="bg-accent hover:bg-accent/90">Preserve Comments</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={oneLinerDialogOpen} onOpenChange={setOneLinerDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>One-Liner Options</AlertDialogTitle>
            <AlertDialogDescription>
              How should comments be handled when converting to a single line? You can either remove all comments or preserve them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleToOneLiner('delete')} className="bg-destructive hover:bg-destructive/90">Delete comments</AlertDialogAction>
            <AlertDialogAction onClick={() => handleToOneLiner('preserve')} className="bg-accent hover:bg-accent/90">Preserve Comments</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
