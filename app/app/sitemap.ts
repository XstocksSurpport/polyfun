import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL;
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/markets`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/launch`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/portfolio`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/docs`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
  ];
}
