import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "발명씨앗 Lab",
    short_name: "발명씨앗",
    description: "학생 발명대회 아이디어 관리 및 발전 플랫폼",
    start_url: "/",
    display: "standalone",
    background_color: "#030712", // dark slate
    theme_color: "#4f46e5",      // indigo
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
