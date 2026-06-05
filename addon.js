const { addonBuilder } = require("stremio-addon-sdk");
const axios = require("axios");

const DEFAULT_TMDB_KEY = process.env.TMDB_API_KEY || process.env.TMDB_KEY || "b8e31efed6de570178942a39601e84b0";
const DEFAULT_TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN || process.env.TMDB_READ_ACCESS_TOKEN || "";
const TMDB_DISCOVER_URL = "https://api.themoviedb.org/3/discover/movie";
const TMDB_SEARCH_URL = "https://api.themoviedb.org/3/search/movie";
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

const GENRES = {
    "Action": 28,
    "Adventure": 12,
    "Comedy": 35,
    "Crime": 80,
    "Documentary": 99,
    "Drama": 18,
    "Family": 10751,
    "Fantasy": 14,
    "History": 36,
    "Horror": 27,
    "Music": 10402,
    "Mystery": 9648,
    "Romance": 10749,
    "Science Fiction": 878,
    "Thriller": 53
};

function createManifest() {
    return {
        id: "org.mallu.flix",
        version: "3.2.0",
        name: "MalluFlix",
        description: "Malayalam movie catalog using TMDB discovery + Cinemeta compatibility",
        logo: "https://forzayt.github.io/MalluFlix_stremio_addon/images/logo.jpg",
        resources: ["catalog", "meta"],
        types: ["movie"],
        catalogs: [
            {
                type: "movie",
                id: "malluflix_catalog",
                name: "MalluFlix New Releases",
                extra: [{ name: "search" }, { name: "skip" }]
            },
            {
                type: "movie",
                id: "malluflix_ott",
                name: "MalluFlix OTT Released",
                extra: [{ name: "search" }, { name: "skip" }]
            },
            {
                type: "movie",
                id: "malluflix_future",
                name: "MalluFlix Future Releases",
                extra: [{ name: "search" }, { name: "skip" }]
            },
            ...Object.keys(GENRES).map(name => ({
                type: "movie",
                id: `malluflix_genre_${name.toLowerCase().replace(/\s+/g, "_")}`,
                name: `MalluFlix ${name}`,
                extra: [{ name: "search" }, { name: "skip" }]
            }))
        ],
        idPrefixes: ["tt"],
        behaviorHints: {
            adult: false,
            p2p: false
        }
    };
}

function createAddonInterface(options = {}) {
    const tmdbKey = options.tmdbKey || DEFAULT_TMDB_KEY;
    const tmdbAccessToken = (options.tmdbAccessToken || DEFAULT_TMDB_ACCESS_TOKEN).replace(/^Bearer\s+/i, "");
    const cache = new Map();
    const builder = new addonBuilder(createManifest());

    async function fetchWithCache(url, config = {}) {
        const key = url + JSON.stringify(config.params || {}) + JSON.stringify(config.headers || {});
        const cached = cache.get(key);

        if (cached && (Date.now() - cached.timestamp < CACHE_EXPIRY)) {
            console.log(`Cache hit for: ${url}`);
            return cached.data;
        }

        console.log(`Cache miss for: ${url}. Fetching...`);
        const response = await axios.get(url, config);
        cache.set(key, {
            data: response.data,
            timestamp: Date.now()
        });
        return response.data;
    }

    function tmdbRequestConfig(params = {}) {
        const request = {
            params: {
                ...params,
                api_key: tmdbKey
            }
        };

        if (tmdbAccessToken) {
            request.headers = {
                Authorization: `Bearer ${tmdbAccessToken}`
            };
        }

        return request;
    }

    function getGenreIdFromCatalogId(id) {
        const genreName = id.replace("malluflix_genre_", "");
        return Object.entries(GENRES).find(([name]) => (
            name.toLowerCase().replace(/\s+/g, "_") === genreName
        ))?.[1];
    }

    async function tmdbToImdb(tmdbId) {
        try {
            const data = await fetchWithCache(
                `https://api.themoviedb.org/3/movie/${tmdbId}/external_ids`,
                tmdbRequestConfig()
            );
            return data.imdb_id;
        } catch {
            return null;
        }
    }

    async function toStremioMeta(movie) {
        const imdb = await tmdbToImdb(movie.id);
        if (!imdb) return null;

        return {
            id: imdb,
            type: "movie",
            name: movie.title,
            poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
            description: movie.overview,
            releaseInfo: movie.release_date ? movie.release_date.slice(0, 4) : undefined
        };
    }

    async function mapMoviesToMetas(results) {
        const batchSize = 5;
        const validMetas = [];
        const seen = new Set();

        for (let i = 0; i < results.length; i += batchSize) {
            const chunkResults = await Promise.all(results.slice(i, i + batchSize).map(toStremioMeta));

            for (const meta of chunkResults) {
                if (!meta || seen.has(meta.id)) continue;
                seen.add(meta.id);
                validMetas.push(meta);
            }
        }

        return validMetas;
    }

    builder.defineCatalogHandler(async ({ type, id, extra }) => {
        const isGenreCatalog = id.startsWith("malluflix_genre_");
        const supportedCatalogs = ["malluflix_catalog", "malluflix_ott", "malluflix_future"];

        if (type !== "movie" || (!supportedCatalogs.includes(id) && !isGenreCatalog)) {
            return { metas: [] };
        }

        const skip = extra?.skip ? parseInt(extra.skip, 10) : 0;
        const page = Math.floor(skip / 20) + 1;
        const today = new Date().toISOString().split("T")[0];
        const search = extra?.search?.trim();

        const params = {
            with_original_language: "ml"
        };

        if (search) {
            params.query = search;
            params.include_adult = false;
        } else if (id === "malluflix_ott") {
            params["release_date.lte"] = today;
            params.with_release_type = "4|5";
            params.region = "IN";
            params.sort_by = "release_date.desc";
        } else if (id === "malluflix_future") {
            params["primary_release_date.gte"] = today;
            params.sort_by = "primary_release_date.asc";
        } else if (isGenreCatalog) {
            const genreId = getGenreIdFromCatalogId(id);

            if (genreId) {
                params["primary_release_date.lte"] = today;
                params.with_genres = genreId.toString();
                params.sort_by = "primary_release_date.desc";
            }
        } else {
            params["primary_release_date.lte"] = today;
            params.sort_by = "primary_release_date.desc";
        }

        const requestUrl = search ? TMDB_SEARCH_URL : TMDB_DISCOVER_URL;
        const pages = search ? [page] : [page, page + 1, page + 2];
        const responses = await Promise.all(pages.map(p =>
            fetchWithCache(requestUrl, tmdbRequestConfig({ ...params, page: p }))
        ));

        const results = responses
            .flatMap(r => r.results || [])
            .filter(movie => movie.original_language === "ml");

        return { metas: await mapMoviesToMetas(results) };
    });

    builder.defineMetaHandler(async ({ type, id }) => {
        if (type !== "movie") return { meta: null };

        const data = await fetchWithCache(
            `https://v3-cinemeta.strem.io/meta/movie/${id}.json`
        );
        return { meta: data.meta || data };
    });

    return builder.getInterface();
}

module.exports = createAddonInterface();
module.exports.createAddonInterface = createAddonInterface;
module.exports.DEFAULT_TMDB_KEY = DEFAULT_TMDB_KEY;
module.exports.DEFAULT_TMDB_ACCESS_TOKEN = DEFAULT_TMDB_ACCESS_TOKEN;
