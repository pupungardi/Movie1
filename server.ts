import express from "express";
import http from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import {
  isTmdbConfigured,
  fetchTmdb,
  mapTmdbItemToMediaItem,
  mapTmdbDetailToMediaItem,
  mapTmdbSeason,
  fetchTmdbSeasonData,
  GENRE_NAME_TO_ID,
  setTmdbRequestKey,
} from "./server/tmdb";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use((req, _res, next) => {
  setTmdbRequestKey(req.header('X-TMDB-API-Key'));
  next();
});

// Lazy-initialized GoogleGenAI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    tmdbConfigured: isTmdbConfigured(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// TMDB Configuration check
app.get("/api/tmdb/config", (_req, res) => {
  res.json({
    configured: isTmdbConfigured(),
  });
});

// TMDB Primary Feed: aggregates trending, popular movies, and popular series
app.get("/api/tmdb/feed", async (_req, res) => {
  try {
    if (!isTmdbConfigured()) {
      return res.json({
        configured: false,
        message: "TMDB_API_KEY is not configured in environment.",
        trending: [],
        popularMovies: [],
        popularSeries: [],
        topRatedMovies: [],
        topRatedSeries: [],
      });
    }

    const [trendingRes, popMoviesRes, popSeriesRes, topMoviesRes, topSeriesRes] = await Promise.allSettled([
      fetchTmdb("/trending/all/week", { page: 1 }),
      fetchTmdb("/movie/popular", { page: 1 }),
      fetchTmdb("/tv/popular", { page: 1 }),
      fetchTmdb("/movie/top_rated", { page: 1 }),
      fetchTmdb("/tv/top_rated", { page: 1 }),
    ]);

    const trending = trendingRes.status === "fulfilled"
      ? (trendingRes.value.results || []).map((i: any) => mapTmdbItemToMediaItem(i))
      : [];

    const popularMovies = popMoviesRes.status === "fulfilled"
      ? (popMoviesRes.value.results || []).map((i: any) => mapTmdbItemToMediaItem(i, "movie"))
      : [];

    const popularSeries = popSeriesRes.status === "fulfilled"
      ? (popSeriesRes.value.results || []).map((i: any) => mapTmdbItemToMediaItem(i, "tv"))
      : [];

    const topRatedMovies = topMoviesRes.status === "fulfilled"
      ? (topMoviesRes.value.results || []).map((i: any) => mapTmdbItemToMediaItem(i, "movie"))
      : [];

    const topRatedSeries = topSeriesRes.status === "fulfilled"
      ? (topSeriesRes.value.results || []).map((i: any) => mapTmdbItemToMediaItem(i, "tv"))
      : [];

    return res.json({
      configured: true,
      trending,
      popularMovies,
      popularSeries,
      topRatedMovies,
      topRatedSeries,
    });
  } catch (error: any) {
    console.error("TMDB feed error:", error);
    return res.status(500).json({
      configured: isTmdbConfigured(),
      error: "Failed to fetch TMDB feed",
      details: error?.message || "Unknown error",
    });
  }
});

// TMDB Movies listing endpoint (with category and genre support)
app.get("/api/tmdb/movies", async (req, res) => {
  try {
    if (!isTmdbConfigured()) {
      return res.json({ configured: false, results: [], total_pages: 0 });
    }

    const category = (req.query.category as string) || "popular";
    const genre = (req.query.genre as string) || "";
    const page = Number(req.query.page) || 1;

    let data;
    if (genre && genre !== "All") {
      const genreId = GENRE_NAME_TO_ID[genre];
      data = await fetchTmdb("/discover/movie", {
        sort_by: "popularity.desc",
        with_genres: genreId ? String(genreId) : undefined,
        page,
      });
    } else {
      const validCategories = ["popular", "top_rated", "now_playing", "upcoming"];
      const targetCategory = validCategories.includes(category) ? category : "popular";
      data = await fetchTmdb(`/movie/${targetCategory}`, { page });
    }

    const items = (data.results || []).map((i: any) => mapTmdbItemToMediaItem(i, "movie"));
    return res.json({
      configured: true,
      results: items,
      page: data.page,
      total_pages: data.total_pages,
    });
  } catch (error: any) {
    console.error("TMDB movies error:", error);
    return res.status(500).json({ error: error?.message || "Failed to fetch movies" });
  }
});

// TMDB Series listing endpoint (with category and genre support)
app.get("/api/tmdb/series", async (req, res) => {
  try {
    if (!isTmdbConfigured()) {
      return res.json({ configured: false, results: [], total_pages: 0 });
    }

    const category = (req.query.category as string) || "popular";
    const genre = (req.query.genre as string) || "";
    const page = Number(req.query.page) || 1;

    let data;
    if (genre && genre !== "All") {
      const genreId = GENRE_NAME_TO_ID[genre];
      data = await fetchTmdb("/discover/tv", {
        sort_by: "popularity.desc",
        with_genres: genreId ? String(genreId) : undefined,
        page,
      });
    } else {
      const validCategories = ["popular", "top_rated", "on_the_air", "airing_today"];
      const targetCategory = validCategories.includes(category) ? category : "popular";
      data = await fetchTmdb(`/tv/${targetCategory}`, { page });
    }

    const items = (data.results || []).map((i: any) => mapTmdbItemToMediaItem(i, "tv"));
    return res.json({
      configured: true,
      results: items,
      page: data.page,
      total_pages: data.total_pages,
    });
  } catch (error: any) {
    console.error("TMDB series error:", error);
    return res.status(500).json({ error: error?.message || "Failed to fetch series" });
  }
});

// TMDB Search endpoint
app.get("/api/tmdb/search", async (req, res) => {
  try {
    if (!isTmdbConfigured()) {
      return res.json({ configured: false, results: [], total_pages: 0 });
    }

    const query = (req.query.query as string || "").trim();
    if (!query) {
      return res.json({ configured: true, results: [], total_pages: 0 });
    }

    const type = (req.query.type as string) || "all";
    const page = Number(req.query.page) || 1;

    let endpoint = "/search/multi";
    if (type === "movie") endpoint = "/search/movie";
    if (type === "tv") endpoint = "/search/tv";

    const data = await fetchTmdb(endpoint, { query, page, include_adult: "false" });
    const items = (data.results || [])
      .filter((i: any) => i.media_type !== "person")
      .map((i: any) => mapTmdbItemToMediaItem(i));

    return res.json({
      configured: true,
      results: items,
      page: data.page,
      total_pages: data.total_pages,
    });
  } catch (error: any) {
    console.error("TMDB search error:", error);
    return res.status(500).json({ error: error?.message || "Search failed" });
  }
});

// TMDB Single Item Detail with full append_to_response (credits, videos, watch providers, certifications)
app.get("/api/tmdb/item/:type/:id", async (req, res) => {
  try {
    if (!isTmdbConfigured()) {
      return res.status(400).json({ error: "TMDB_API_KEY is not configured" });
    }

    const rawType = req.params.type;
    const type: "movie" | "tv" = rawType === "tv" ? "tv" : "movie";
    const rawId = req.params.id.replace(/^(m-|tv-)/, "");

    const append = type === "movie"
      ? "credits,videos,recommendations,similar,watch/providers,release_dates"
      : "credits,videos,recommendations,similar,watch/providers,content_ratings";

    const data = await fetchTmdb(`/${type}/${rawId}`, {
      append_to_response: append,
    });

    const mapped = mapTmdbDetailToMediaItem(data, type);

    // If TV show, populate real episodes for Season 1
    if (type === "tv" && mapped.seasons && mapped.seasons.length > 0) {
      const firstSeason = mapped.seasons.find((s) => s.seasonNumber === 1) || mapped.seasons[0];
      if (firstSeason) {
        try {
          const seasonData = await fetchTmdb(`/tv/${rawId}/season/${firstSeason.seasonNumber}`);
          const populatedSeason = mapTmdbSeason(seasonData, mapped.backdropUrl);
          const sIdx = mapped.seasons.findIndex((s) => s.seasonNumber === firstSeason.seasonNumber);
          if (sIdx !== -1) {
            mapped.seasons[sIdx] = populatedSeason;
          }
        } catch (sErr) {
          console.warn(`Could not preload season ${firstSeason.seasonNumber} episodes for ${rawId}:`, sErr);
        }
      }
    }

    return res.json(mapped);
  } catch (error: any) {
    console.error("TMDB item detail error:", error);
    return res.status(500).json({ error: error?.message || "Failed to fetch item detail" });
  }
});

// TMDB TV Season Episodes endpoint
app.get("/api/tmdb/tv/:id/season/:seasonNumber", async (req, res) => {
  try {
    if (!isTmdbConfigured()) {
      return res.status(400).json({ error: "TMDB_API_KEY is not configured" });
    }

    const rawId = req.params.id.replace(/^(m-|tv-)/, "");
    const seasonNumber = parseInt(req.params.seasonNumber, 10) || 1;

    const seasonData = await fetchTmdb(`/tv/${rawId}/season/${seasonNumber}`);
    const mapped = mapTmdbSeason(seasonData);
    return res.json(mapped);
  } catch (error: any) {
    console.error("TMDB season episodes error:", error);
    return res.status(500).json({ error: error?.message || "Failed to fetch season episodes" });
  }
});

// AI Recommendation & Mood Matcher endpoint
app.post("/api/recommendations", async (req, res) => {
  try {
    const { prompt, currentWatchlist = [], favoriteGenres = [], mediaType = "all" } = req.body;

    const ai = getGeminiClient();

    if (!ai) {
      // Fallback if no API key is set
      return res.json({
        source: "curated",
        message: "API key not configured in environment. Using curated recommendations.",
        recommendations: [
          {
            title: "Inception",
            type: "movie",
            year: 2010,
            rating: 8.8,
            reason: "A mind-bending masterclass in storytelling and visual execution, matching high-stakes suspense.",
            genres: ["Sci-Fi", "Action", "Thriller"]
          },
          {
            title: "Severance",
            type: "tv",
            year: 2022,
            rating: 8.7,
            reason: "Exceptional mystery thriller exploring corporate surrealism with sharp pacing and twists.",
            genres: ["Sci-Fi", "Mystery", "Thriller"]
          },
          {
            title: "Interstellar",
            type: "movie",
            year: 2014,
            rating: 8.7,
            reason: "An emotional cosmic journey with breathtaking scientific grounding and Hans Zimmer score.",
            genres: ["Sci-Fi", "Drama", "Adventure"]
          }
        ]
      });
    }

    const systemPrompt = `You are CineMatch, an expert film and television critic and recommendation engine.
Provide personalized movie and TV series recommendations based on user prompts, watchlist history, and mood.
Always return your recommendations as a valid JSON object matching this structure:
{
  "summary": "Brief 1-2 sentence tailored overview of the picks",
  "recommendations": [
    {
      "title": "Exact standard Title",
      "type": "movie" | "tv",
      "year": 2023,
      "rating": 8.5,
      "genres": ["Genre1", "Genre2"],
      "reason": "Why this specifically matches the user query (1-2 compelling sentences)",
      "vibe": "e.g., Mind-bending & Gripping or Cozy & Wholesome",
      "streamingMatch": "e.g., Netflix, HBO Max, Prime Video, or Apple TV+"
    }
  ]
}
Recommend 4 to 6 standout titles. Prioritize quality and relevance. Do NOT return markdown formatting outside the JSON if responseMimeType is json.`;

    const userPromptText = `User request: "${prompt || 'Suggest top acclaimed must-watch movies and TV series'}"
Preferred media type: ${mediaType}
Favorite genres: ${favoriteGenres.join(", ") || 'Various'}
Known watchlist titles: ${currentWatchlist.join(", ") || 'None provided'}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: userPromptText,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      // Clean possible fences
      const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedData = JSON.parse(cleaned);
    }

    return res.json({
      source: "gemini",
      ...parsedData,
    });
  } catch (error: any) {
    console.error("Gemini recommendation error:", error);
    return res.status(500).json({
      error: "Failed to generate recommendations",
      details: error?.message || "Unknown error",
    });
  }
});

async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer,
        },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
