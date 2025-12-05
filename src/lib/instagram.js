/**
 * Instagram API Integration
 * Fetches posts from Instagram using hashtags
 */

const INSTAGRAM_API_BASE = "https://graph.instagram.com";
const INSTAGRAM_GRAPH_API_BASE = "https://graph.facebook.com/v18.0";

/**
 * Fetch Instagram posts by hashtag
 * @param {string} hashtag - The hashtag to search for (without #)
 * @param {number} limit - Number of posts to fetch
 * @returns {Promise<Array>} Array of Instagram posts
 */
export async function fetchInstagramPostsByHashtag(hashtag, limit = 50) {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

    if (!accessToken || !businessAccountId) {
      console.error("Instagram API credentials not configured");
      return [];
    }

    // Step 1: Search for hashtag ID
    const hashtagSearchUrl = `${INSTAGRAM_GRAPH_API_BASE}/ig_hashtag_search?user_id=${businessAccountId}&q=${encodeURIComponent(
      hashtag
    )}&access_token=${accessToken}`;

    const hashtagResponse = await fetch(hashtagSearchUrl);
    const hashtagData = await hashtagResponse.json();

    if (!hashtagData.data || hashtagData.data.length === 0) {
      console.log(`No hashtag found for: ${hashtag}`);
      return [];
    }

    const hashtagId = hashtagData.data[0].id;

    // Step 2: Get recent media for this hashtag
    const mediaUrl = `${INSTAGRAM_GRAPH_API_BASE}/${hashtagId}/recent_media?user_id=${businessAccountId}&fields=id,media_type,media_url,permalink,caption,timestamp,username,like_count,comments_count&limit=${limit}&access_token=${accessToken}`;

    const mediaResponse = await fetch(mediaUrl);
    const mediaData = await mediaResponse.json();

    if (!mediaData.data) {
      return [];
    }

    // Transform to our format
    return mediaData.data.map((post) => ({
      id: post.id,
      instagram_id: post.id,
      username: post.username || "instagram_user",
      caption: post.caption || "",
      media_url: post.media_url,
      media_type: post.media_type?.toLowerCase() === "video" ? "video" : "image",
      permalink: post.permalink,
      likes_count: post.like_count || 0,
      comments_count: post.comments_count || 0,
      created_at: post.timestamp,
      hashtag: hashtag,
    }));
  } catch (error) {
    console.error(`Error fetching Instagram posts for #${hashtag}:`, error);
    return [];
  }
}

/**
 * Fetch user's own Instagram media (alternative method)
 * @param {number} limit - Number of posts to fetch
 * @returns {Promise<Array>} Array of Instagram posts
 */
export async function fetchUserInstagramMedia(limit = 50) {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

    if (!accessToken || !businessAccountId) {
      console.error("Instagram API credentials not configured");
      return [];
    }

    const mediaUrl = `${INSTAGRAM_GRAPH_API_BASE}/${businessAccountId}/media?fields=id,media_type,media_url,permalink,caption,timestamp,username,like_count,comments_count&limit=${limit}&access_token=${accessToken}`;

    const response = await fetch(mediaUrl);
    const data = await response.json();

    if (!data.data) {
      return [];
    }

    return data.data.map((post) => ({
      id: post.id,
      instagram_id: post.id,
      username: post.username || "instagram_user",
      caption: post.caption || "",
      media_url: post.media_url,
      media_type: post.media_type?.toLowerCase() === "video" ? "video" : "image",
      permalink: post.permalink,
      likes_count: post.like_count || 0,
      comments_count: post.comments_count || 0,
      created_at: post.timestamp,
    }));
  } catch (error) {
    console.error("Error fetching user Instagram media:", error);
    return [];
  }
}

/**
 * Fetch posts from multiple hashtags
 * @param {Array<string>} hashtags - Array of hashtags to search
 * @param {number} limitPerTag - Number of posts per hashtag
 * @returns {Promise<Array>} Combined array of Instagram posts
 */
export async function fetchMultipleHashtags(hashtags, limitPerTag = 20) {
  try {
    const allPosts = await Promise.all(
      hashtags.map((tag) =>
        fetchInstagramPostsByHashtag(tag.replace("#", ""), limitPerTag)
      )
    );

    // Flatten and remove duplicates
    const combined = allPosts.flat();
    const unique = Array.from(
      new Map(combined.map((post) => [post.instagram_id, post])).values()
    );

    // Sort by timestamp (newest first)
    return unique.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  } catch (error) {
    console.error("Error fetching multiple hashtags:", error);
    return [];
  }
}

/**
 * Get configured hashtags from environment
 * @returns {Array<string>} Array of hashtags
 */
export function getConfiguredHashtags() {
  const hashtagsEnv = process.env.INSTAGRAM_HASHTAGS || "";
  return hashtagsEnv
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}
