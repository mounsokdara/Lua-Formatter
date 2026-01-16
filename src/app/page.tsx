import { LuaEditor } from '@/components/lua-editor';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="w-full py-6 px-4 text-center border-b shadow-sm">
        <h1 className="text-4xl lg:text-5xl font-headline font-bold text-primary">
          LuaForge
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Your online toolkit to beautify, clean, and refactor Lua code.
        </p>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6">
        <LuaEditor />
      </main>
      <footer className="w-full p-4 text-center text-sm text-muted-foreground border-t">
        <p>&copy; {new Date().getFullYear()} LuaForge. All rights reserved.</p>
      </footer>
    </div>
  );
}
