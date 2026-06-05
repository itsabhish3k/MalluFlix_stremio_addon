# MalluFlix Stremio Addon

MalluFlix is a Malayalam movie catalog addon for Stremio. It uses TMDB to discover Malayalam movies, converts TMDB movie IDs to IMDb IDs, and lets Stremio/Cinemeta provide normal metadata compatibility.

MalluFlix does not host, store, scrape, or distribute video content. It only provides catalog and metadata entries.

## Features

- Malayalam movie catalogs
- New releases, OTT releases, future releases, and genre catalogs
- Stremio-compatible IMDb IDs
- Catalog search support
- Local in-memory API cache

## Requirements

- Node.js
- npm
- A TMDB API key is recommended

The project includes the original public TMDB key as a fallback, but for reliable use you should set your own key.

## Run Locally

From this folder:

```powershell
npm.cmd install
npm.cmd start
```

If your terminal allows npm scripts directly, this also works:

```bash
npm install
npm start
```

The addon starts on:

```text
http://127.0.0.1:7000/
```

The Stremio manifest is:

```text
http://127.0.0.1:7000/manifest.json
```

## Optional TMDB Credentials

PowerShell:

```powershell
$env:TMDB_API_KEY="your_tmdb_key"
$env:TMDB_ACCESS_TOKEN="your_tmdb_read_access_token"
npm.cmd start
```

Command Prompt:

```bat
set TMDB_API_KEY=your_tmdb_key
set TMDB_ACCESS_TOKEN=your_tmdb_read_access_token
npm.cmd start
```

macOS/Linux:

```bash
TMDB_API_KEY=your_tmdb_key TMDB_ACCESS_TOKEN=your_tmdb_read_access_token npm start
```

## Install In Stremio

After the server is running, open this in a browser:

```text
stremio://127.0.0.1:7000/manifest.json
```

You can also open the landing page at `http://127.0.0.1:7000/` and click the install button.

## Configure TMDB Credentials

Open the landing page:

```text
http://127.0.0.1:7000/
```

Paste your TMDB API key and TMDB read access token into the configuration fields. The page will generate a configured manifest URL like:

```text
http://127.0.0.1:7000/configure/{encoded_config}/manifest.json
```

Use the `Open in Stremio Web` link for browser-based install, or copy the generated manifest URL into Stremio manually.

## Permanent Render Deployment

Local URLs and tunnel URLs are only for testing. For a permanent addon, deploy this project to Render and install from the Render HTTPS URL.

This repo includes `render.yaml`, so Render can use:

- Build command: `npm install`
- Start command: `npm start`
- Health check: `/manifest.json`

After deploying, open:

```text
https://your-render-service.onrender.com/configure
```

Paste your TMDB API key and read access token, then install using `Open in Stremio Web` or copy the generated manifest URL. The permanent configured manifest will look like:

```text
https://your-render-service.onrender.com/configure/{encoded_config}/manifest.json
```

Do not install from `127.0.0.1` or a temporary tunnel if you need the addon to keep working after your computer is off.

## Endpoints

- `/manifest.json`
- `/configure/{encoded_config}/manifest.json`
- `/catalog/movie/malluflix_catalog.json`
- `/catalog/movie/malluflix_ott.json`
- `/catalog/movie/malluflix_future.json`
- `/catalog/movie/malluflix_genre_action.json`
- `/meta/movie/{imdb_id}.json`

## Notes

- On Windows PowerShell, `npm` may be blocked by execution policy. Use `npm.cmd` as shown above.
- `node server.js` and `node index.js` both start the addon.
- Configured URLs contain encoded TMDB credentials. Treat configured manifest URLs like secrets.
