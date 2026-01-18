"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeftRight, Copy, Download, Trash2, Sparkles, Brush, Trash } from 'lucide-react';
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
  const [oneLinerDialogOpen, setOneLinerDialogOpen] = useState<boolean>(false);
  const [stats, setStats] = useState<{ linesSaved: number; sizeSaved: number } | null>(null);
  const { toast } = useToast();

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  const calculateStats = (input: string, output: string) => {
    if (!output && output !== '') {
      setStats(null);
      return;
    }
    const linesBefore = input.split('\n').length;
    const linesAfter = output.split('\n').length;
    const sizeBefore = new Blob([input]).size;
    const sizeAfter = new Blob([output]).size;

    setStats({
        linesSaved: linesBefore - linesAfter,
        sizeSaved: sizeBefore - sizeAfter,
    });
  };

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

  const handleDeleteComments = () => {
    try {
      const result = lua.deleteAllComments(inputCode);
      setOutputCode(result);
      calculateStats(inputCode, result);
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
     calculateStats(inputCode, result);
     toast({ title: 'Code converted to one line!', description: 'Multi-line code has been condensed.' });
   } catch (e) {
     const error = e instanceof Error ? e.message : 'An unknown error occurred';
     toast({ title: 'An error occurred', description: error, variant: 'destructive' });
   }
  };

  const handleToOneLinerClick = () => {
    if (lua.hasComments(inputCode)) {
      setOneLinerDialogOpen(true);
    } else {
      handleToOneLiner('preserve');
    }
  };

  const handleReverse = () => {
    try {
      const result = lua.reverseCode(inputCode);
      setOutputCode(result);
      calculateStats(inputCode, result);
      toast({ title: 'Code reversed!', description: 'The input code has been reversed.' });
    } catch (e) {
      const error = e instanceof Error ? e.message : 'An unknown error occurred';
      toast({ title: 'An error occurred', description: error, variant: 'destructive' });
    }
  };

  const handleBeautify = () => {
    try {
      const result = lua.beautifyCode(inputCode);
      setOutputCode(result);
      calculateStats(inputCode, result);
      toast({ title: 'Code beautified!', description: 'The code has been formatted.' });
    } catch (e) {
      const error = e instanceof Error ? e.message : 'An unknown error occurred';
      toast({ title: 'An error occurred', description: error, variant: 'destructive' });
    }
  };

  const handleClear = () => {
    setInputCode('');
    setOutputCode('');
    setStats(null);
    toast({ title: 'Cleared!', description: 'Input and output fields have been cleared.' });
  }

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
              />
            </div>
            <div>
              <label htmlFor="output-code" className="text-sm font-medium mb-2 block text-muted-foreground">Output Code</label>
              <Textarea
                id="output-code"
                value={outputCode}
                readOnly
                placeholder={'Processed code will appear here...'}
                className="font-code h-96 min-h-[300px] lg:h-[500px] bg-muted/30 text-base"
              />
              {stats && (outputCode || outputCode === '') && (
                <div className="mt-2 text-sm text-muted-foreground flex justify-end gap-4 pr-2">
                  <span>Lines Saved: <span className="font-medium text-foreground">{stats.linesSaved}</span></span>
                  <span>Size Saved: <span className="font-medium text-foreground">{formatBytes(stats.sizeSaved)}</span></span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Button variant="outline" onClick={handleBeautify}>
              <Brush className="mr-2 h-4 w-4" /> Beautify
            </Button>
            <Button variant="outline" onClick={handleDeleteComments} disabled={!lua.hasComments(inputCode)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete Comments
            </Button>
            <Button variant="outline" onClick={handleToOneLinerClick}>
              <Sparkles className="mr-2 h-4 w-4" /> To One Liner
            </Button>
            <Button variant="outline" onClick={handleReverse}>
              <ArrowLeftRight className="mr-2 h-4 w-4" /> Reverse
            </Button>
            <Button variant="secondary" onClick={handleCopy} disabled={!outputCode}>
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
            <Button variant="secondary" onClick={handleDownload} disabled={!outputCode}>
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
            <Button variant="destructive" onClick={handleClear}>
              <Trash className="mr-2 h-4 w-4" /> Clear
            </Button>
          </div>
        </CardContent>
      </Card>

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
