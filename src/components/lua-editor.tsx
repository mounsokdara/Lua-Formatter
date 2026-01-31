"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftRight, Copy, Download, Trash2, Sparkles, Brush, Trash, Upload, ClipboardPaste, Search, Undo, Redo } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ScrollArea } from './ui/scroll-area';

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

type FoundComment = {
  line: number;
  content: string;
};

export function LuaEditor() {
  const [inputCode, setInputCode] = useState<string>(initialCode);
  const [outputCode, setOutputCode] = useState<string>('');
  const [oneLinerDialogOpen, setOneLinerDialogOpen] = useState<boolean>(false);
  const [deleteOptions, setDeleteOptions] = useState({
    singleLine: true,
    multiLine: true,
    customSingle: '',
    customMultiStart: '',
    customMultiEnd: '',
  });
  
  const [history, setHistory] = useState<string[]>([initialCode]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [stats, setStats] = useState<{ linesSaved: number; sizeSaved: number } | null>(null);
  const [wrapLines, setWrapLines] = useState<boolean>(true);
  const { toast } = useToast();
  
  const [foundComments, setFoundComments] = useState<FoundComment[]>([]);
  const [commentSearch, setCommentSearch] = useState('');

  const updateInputCode = (newCode: string, fromHistory = false) => {
    setInputCode(newCode);
    if (!fromHistory) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newCode);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };
  
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      updateInputCode(history[newIndex], true);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      updateInputCode(history[newIndex], true);
    }
  };

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

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(outputCode)
        .then(() => {
          toast({ title: 'Copied to clipboard!', description: 'The output code has been copied.' });
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          toast({ title: 'Failed to copy!', description: 'Could not copy text to clipboard.', variant: 'destructive' });
        });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = outputCode;
      
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        toast({ title: 'Copied to clipboard!', description: 'The output code has been copied.' });
      } catch (err) {
        console.error('Fallback failed to copy: ', err);
        toast({ title: 'Failed to copy!', description: 'Could not copy text to clipboard.', variant: 'destructive' });
      } finally {
        document.body.removeChild(textArea);
      }
    }
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

  const handleCustomDelete = () => {
    try {
      const result = lua.deleteCustomComments(inputCode, deleteOptions);
      setOutputCode(result);
      calculateStats(inputCode, result);
      toast({ title: 'Comments deleted!', description: 'Custom comments have been removed.' });
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
    updateInputCode('');
    setOutputCode('');
    setStats(null);
    toast({ title: 'Cleared!', description: 'Input and output fields have been cleared.' });
  }

  const handlePasteFromClipboard = async () => {
    if (!navigator.clipboard?.readText) {
        toast({
            title: 'Clipboard API not supported',
            description: 'Your browser does not support this feature.',
            variant: 'destructive',
        });
        return;
    }
    try {
        const text = await navigator.clipboard.readText();
        if (text) {
            updateInputCode(text);
            toast({ title: 'Pasted from clipboard!', description: 'Code loaded from your clipboard.' });
        } else {
            toast({ title: 'Clipboard is empty!', variant: 'destructive' });
        }
    } catch (err) {
        console.error('Failed to read clipboard contents: ', err);
        toast({ title: 'Failed to paste', description: 'Could not read from clipboard. Check permissions.', variant: 'destructive' });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        updateInputCode(text);
        toast({ title: 'File loaded!', description: `${file.name} has been loaded.` });
    };
    reader.onerror = () => {
         toast({
            title: 'Error reading file',
            description: 'Could not read the contents of the file.',
            variant: 'destructive',
        });
    };
    reader.readAsText(file);
    
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleFindComments = () => {
    const comments = lua.extractAllComments(inputCode);
    setFoundComments(comments);
    toast({ title: `Found ${comments.length} comments.`});
  };

  const filteredComments = foundComments.filter(comment => 
    comment.content.toLowerCase().includes(commentSearch.toLowerCase())
  );

  return (
    <>
      <Card className="w-full shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <Tabs defaultValue="editor" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-2">
                  <TabsTrigger value="editor">Editor</TabsTrigger>
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                  <TabsTrigger value="clipboard">Clipboard</TabsTrigger>
                </TabsList>
                <TabsContent value="editor">
                  <Textarea
                    id="input-code"
                    value={inputCode}
                    onChange={(e) => updateInputCode(e.target.value)}
                    placeholder="Paste your Lua code here..."
                    className={cn(
                      "font-code h-96 min-h-[300px] lg:h-[500px] text-base border-primary/20 focus:border-primary",
                      !wrapLines && "whitespace-pre overflow-x-auto"
                    )}
                  />
                </TabsContent>
                <TabsContent value="upload">
                  <div className="relative flex flex-col items-center justify-center rounded-md border border-dashed h-96 min-h-[300px] lg:h-[500px] text-center p-4">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold">Upload a file</h3>
                      <p className="mb-4 mt-2 text-sm text-muted-foreground">
                        Select a .lua or text file from your device.
                      </p>
                      <Input
                        id="file-upload"
                        type="file"
                        className="relative block w-full max-w-xs cursor-pointer rounded-lg border bg-background text-sm focus:z-10"
                        onChange={handleFileChange}
                        accept=".lua,text/plain"
                      />
                  </div>
                </TabsContent>
                <TabsContent value="clipboard">
                  <div className="flex flex-col items-center justify-center rounded-md border border-dashed h-96 min-h-[300px] lg:h-[500px] text-center p-4">
                      <ClipboardPaste className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold">Load from Clipboard</h3>
                      <p className="mb-4 mt-2 text-sm text-muted-foreground">
                        Click the button to paste code from your clipboard.
                      </p>
                      <Button onClick={handlePasteFromClipboard}>
                          <ClipboardPaste className="mr-2 h-4 w-4" /> Load from Clipboard
                      </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div>
              <label htmlFor="output-code" className="text-sm font-medium mb-2 block text-muted-foreground">Output Code</label>
              <Textarea
                id="output-code"
                value={outputCode}
                readOnly
                placeholder={'Processed code will appear here...'}
                className={cn(
                  "font-code h-96 min-h-[300px] lg:h-[500px] bg-muted/30 text-base",
                   !wrapLines && "whitespace-pre overflow-x-auto"
                )}
              />
              {stats && (outputCode || outputCode === '') && (
                <div className="mt-2 text-sm text-muted-foreground flex justify-end gap-4 pr-2">
                  <span>Lines Saved: <span className="font-medium text-foreground">{stats.linesSaved}</span></span>
                  <span>Size Saved: <span className="font-medium text-foreground">{formatBytes(stats.sizeSaved)}</span></span>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-end space-x-2">
            <Checkbox id="wrap-lines" checked={wrapLines} onCheckedChange={(checked) => setWrapLines(Boolean(checked))} />
            <Label htmlFor="wrap-lines">Wrap lines</Label>
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
            <Button variant="outline" onClick={handleUndo} disabled={historyIndex === 0}>
                <Undo className="mr-2 h-4 w-4" /> Undo
            </Button>
            <Button variant="outline" onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
                <Redo className="mr-2 h-4 w-4" /> Redo
            </Button>
            <Button variant="destructive" onClick={handleClear}>
              <Trash className="mr-2 h-4 w-4" /> Clear
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mt-6 w-full shadow-lg">
        <CardHeader>
          <CardTitle>Advanced Tools</CardTitle>
          <CardDescription>
            Inspect or selectively remove comments from your code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="custom-delete" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="custom-delete">Custom Delete</TabsTrigger>
              <TabsTrigger value="inspector">Comment Inspector</TabsTrigger>
            </TabsList>
            <TabsContent value="custom-delete" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Delete by Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="singleLine" 
                                  checked={deleteOptions.singleLine} 
                                  onCheckedChange={(checked) => setDeleteOptions(prev => ({...prev, singleLine: !!checked}))}
                                />
                                <Label htmlFor="singleLine" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Delete single-line comments (e.g. -- comment)
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="multiLine" 
                                  checked={deleteOptions.multiLine}
                                  onCheckedChange={(checked) => setDeleteOptions(prev => ({...prev, multiLine: !!checked}))}
                                />
                                <Label htmlFor="multiLine" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Delete multi-line block comments (e.g. --[[...]])
                                </Label>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle className="text-lg">Delete by Custom Marker</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <div className="grid gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="customSingle">Custom single-line prefix</Label>
                            <Input 
                              id="customSingle" 
                              placeholder="e.g. #" 
                              value={deleteOptions.customSingle}
                              onChange={(e) => setDeleteOptions(prev => ({...prev, customSingle: e.target.value}))}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="customMultiStart">Block start marker</Label>
                              <Input 
                                id="customMultiStart" 
                                placeholder="e.g. /*"
                                value={deleteOptions.customMultiStart}
                                onChange={(e) => setDeleteOptions(prev => ({...prev, customMultiStart: e.target.value}))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="customMultiEnd">Block end marker</Label>
                              <Input 
                                id="customMultiEnd" 
                                placeholder="e.g. */" 
                                value={deleteOptions.customMultiEnd}
                                onChange={(e) => setDeleteOptions(prev => ({...prev, customMultiEnd: e.target.value}))}
                              />
                            </div>
                          </div>
                       </div>
                    </CardContent>
                </Card>
                <div className="mt-4 flex justify-end">
                    <Button onClick={handleCustomDelete}>
                    <Trash2 className="mr-2 h-4 w-4" /> Apply Custom Delete
                    </Button>
                </div>
            </TabsContent>
            <TabsContent value="inspector" className="mt-4">
               <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col space-y-4">
                          <div className="flex space-x-2">
                            <Input 
                              placeholder="Search comments..."
                              value={commentSearch}
                              onChange={(e) => setCommentSearch(e.target.value)}
                            />
                            <Button onClick={handleFindComments} variant="outline">
                              <Search className="mr-2 h-4 w-4" />
                              Find Comments
                            </Button>
                          </div>
                          <ScrollArea className="h-72 w-full rounded-md border">
                            <div className="p-4 text-sm">
                              {filteredComments.length > 0 ? (
                                filteredComments.map((comment, index) => (
                                  <div key={index} className="border-b p-2">
                                    <span className="font-semibold text-muted-foreground">Line {comment.line}:</span>
                                    <p className="font-code whitespace-pre-wrap">{comment.content}</p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-muted-foreground text-center p-4">
                                  No comments found, or clear your search.
                                </p>
                              )}
                            </div>
                          </ScrollArea>
                      </div>
                    </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
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
