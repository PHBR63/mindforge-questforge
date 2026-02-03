import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: "file" | "dir";
}

interface MapInfo {
  name: string;
  path: string;
  downloadUrl: string;
  previewUrl?: string;
  size: number;
}

// Known VTT map repositories
const VTT_REPOS = [
  {
    owner: "mbround18",
    repo: "vtt-maps",
    branch: "main",
    description: "Custom VTT maps with walls and lighting",
  },
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, owner, repo, path } = await req.json();

    if (action === "list-repos") {
      return new Response(JSON.stringify({ repos: VTT_REPOS }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list-maps") {
      const repoOwner = owner || VTT_REPOS[0].owner;
      const repoName = repo || VTT_REPOS[0].repo;
      const repoPath = path || "";

      // Fetch repository contents from GitHub API
      const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${repoPath}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "Lovable-VTT-Browser",
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const contents: GitHubContent[] = await response.json();
      
      // Filter for VTT files and directories
      const maps: MapInfo[] = [];
      const directories: { name: string; path: string }[] = [];

      for (const item of contents) {
        if (item.type === "dir") {
          directories.push({ name: item.name, path: item.path });
        } else if (
          item.name.endsWith(".uvtt") ||
          item.name.endsWith(".dd2vtt") ||
          item.name.endsWith(".df2vtt")
        ) {
          // Look for preview image
          const baseName = item.name.replace(/\.(uvtt|dd2vtt|df2vtt)$/, "");
          const previewItem = contents.find(
            (c) =>
              c.name.startsWith(baseName) &&
              (c.name.endsWith(".png") ||
                c.name.endsWith(".jpg") ||
                c.name.endsWith(".webp"))
          );

          maps.push({
            name: item.name.replace(/\.(uvtt|dd2vtt|df2vtt)$/, ""),
            path: item.path,
            downloadUrl: item.download_url || "",
            previewUrl: previewItem?.download_url || undefined,
            size: item.size,
          });
        }
      }

      return new Response(
        JSON.stringify({
          maps,
          directories,
          currentPath: repoPath,
          repo: { owner: repoOwner, name: repoName },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "download-map") {
      const downloadUrl = path;
      
      if (!downloadUrl) {
        throw new Error("Download URL is required");
      }

      // Fetch the map file
      const response = await fetch(downloadUrl, {
        headers: {
          "User-Agent": "Lovable-VTT-Browser",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download map: ${response.status}`);
      }

      const content = await response.text();

      return new Response(
        JSON.stringify({ content }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in vtt-maps-browser:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
