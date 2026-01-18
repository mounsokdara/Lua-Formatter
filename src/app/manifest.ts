import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LuaForge',
    short_name: 'LuaForge',
    description: 'Your online toolkit to beautify, clean, and refactor Lua code.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F0F2F5',
    theme_color: '#6A5ACD',
    icons: [
      {
        src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iOTYiIGN5PSI5NiIgcj0iOTYiIGZpbGw9IiM2QTVBQ0QiLz48cGF0aCBkPSJNNzIgMzZBNjAgNjAgMCAxIDAgNzIgMTU2IDYwIDYwIDAgMSAxIDcyIDM2WiIgZmlsbD0iI0YwRjJGNSIvPjwvc3ZnPg==",
        sizes: "192x192",
        type: "image/svg+xml"
      },
      {
        src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjU2IiBjeT0iMjU2IiByPSIyNTYiIGZpbGw9IiM2QTVBQ0QiLz48cGF0aCBkPSJNMTkyIDk2QTE2MCAxNjAgMCAxIDAgMTkyIDQxNiAxNjAgMTYwIDAgMSAxIDE5MiA5NloiIGZpbGw9IiNGMEYyRjUiLz48L3N2Zz4=",
        sizes: "512x512",
        type: "image/svg+xml"
      }
    ]
  }
}
