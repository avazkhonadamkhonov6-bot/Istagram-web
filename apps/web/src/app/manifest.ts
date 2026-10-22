import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Instagram",
    short_name: "Instagram",
    description: "Photos, reels, stories and Direct messages.",
    start_url: "/",
    display: "standalone",
    background_color: "#0C1014",
    theme_color: "#0C1014",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
