import type { MetadataRoute } from "next";

const publicSiteUrl = "https://a-little-invite.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: publicSiteUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
