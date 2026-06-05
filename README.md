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
- TMDB API key
- TMDB read access token

TMDB credentials are configured on the server. Users do not enter TMDB credentials in Stremio.

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

## TMDB Credentials

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

For local testing, after the server is running, open this in a browser:

```text
stremio://127.0.0.1:7000/manifest.json
```

You can also open the landing page at `http://127.0.0.1:7000/` and click the install button.

For a hosted deployment, users install:

```text
https://your-render-service.onrender.com/manifest.json
```

## Permanent Render Deployment

Local URLs and tunnel URLs are only for testing. For a permanent addon, deploy this project to Render and install from the Render HTTPS manifest URL.

This repo includes `render.yaml`, so Render can use:

- Build command: `npm install`
- Start command: `npm start`
- Health check: `/manifest.json`

Set these Render environment variables:

- `TMDB_API_KEY`
- `TMDB_ACCESS_TOKEN`

After deploying, open:

```text
https://your-render-service.onrender.com/
```

Users install this manifest:

```text
https://your-render-service.onrender.com/manifest.json
```

Do not install from `127.0.0.1` or a temporary tunnel if you need the addon to keep working after your computer is off.

## Endpoints

- `/manifest.json`
- `/catalog/movie/malluflix_catalog.json`
- `/catalog/movie/malluflix_ott.json`
- `/catalog/movie/malluflix_future.json`
- `/catalog/movie/malluflix_genre_action.json`
- `/meta/movie/{imdb_id}.json`

## Notes

- On Windows PowerShell, `npm` may be blocked by execution policy. Use `npm.cmd` as shown above.
- `node server.js` and `node index.js` both start the addon.
- Do not commit TMDB credentials to GitHub. Put them in Render environment variables.
