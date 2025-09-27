import { db } from "./db";
import { platforms } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function seedPlatforms() {
  try {
    console.log("🌱 Инициализация платформ...");
    
    // Insert platforms with proper icon and color values
    await db.insert(platforms)
      .values([
        {
          name: "instagram",
          displayName: "Instagram",
          icon: "instagram",
          color: "#E4405F",
          apiEndpoint: "https://graph.instagram.com",
          isActive: true,
        },
        {
          name: "tiktok", 
          displayName: "TikTok",
          icon: "tiktok",
          color: "#000000",
          apiEndpoint: "https://open-api.tiktok.com",
          isActive: true,
        },
        {
          name: "youtube",
          displayName: "YouTube", 
          icon: "youtube",
          color: "#FF0000",
          apiEndpoint: "https://www.googleapis.com/youtube/v3",
          isActive: true,
        },
        {
          name: "telegram",
          displayName: "Telegram",
          icon: "telegram",
          color: "#0088CC", 
          apiEndpoint: "https://api.telegram.org",
          isActive: true,
        }
      ])
      .onConflictDoUpdate({
        target: platforms.name,
        set: {
          displayName: sql`excluded.display_name`,
          icon: sql`excluded.icon`, 
          color: sql`excluded.color`,
          apiEndpoint: sql`excluded.api_endpoint`,
          isActive: sql`excluded.is_active`,
        }
      });

    console.log("✅ Платформы успешно инициализированы");
  } catch (error) {
    console.error("Ошибка инициализации платформ:", error);
    throw error;
  }
}