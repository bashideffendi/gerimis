import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://hujandibatam.masbash.id",
      changeFrequency: "hourly",
      priority: 1,
    },
  ];
}
