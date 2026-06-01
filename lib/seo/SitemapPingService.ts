/**
 * Sitemap Ping Service
 * 
 * Purpose: Notify Google/Bing of sitemap updates
 */

const GOOGLE_PING_URL = 'https://www.google.com/ping?sitemap=';
const BING_PING_URL = 'https://www.bing.com/ping?sitemap=';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://zeva360.com';

export interface PingResult {
  service: 'google' | 'bing';
  success: boolean;
  statusCode?: number;
  error?: string;
}

/**
 * Ping Google with sitemap URL
 */
export async function pingGoogle(sitemapUrl?: string): Promise<PingResult> {
  const url = sitemapUrl || `${BASE_URL}/sitemap.xml`;
  const pingUrl = `${GOOGLE_PING_URL}${encodeURIComponent(url)}`;

  try {
    const response = await fetch(pingUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Zeva360-SitemapPing/1.0',
      },
    });

    if (response.ok) {
      console.log(`✅ Google ping successful: ${url}`);
      return {
        service: 'google',
        success: true,
        statusCode: response.status,
      };
    } else {
      console.warn(`⚠️ Google ping returned status ${response.status}: ${url}`);
      return {
        service: 'google',
        success: false,
        statusCode: response.status,
        error: `HTTP ${response.status}`,
      };
    }
  } catch (error: any) {
    console.error(`❌ Google ping failed: ${error.message}`);
    return {
      service: 'google',
      success: false,
      error: error.message,
    };
  }
}

/**
 * Ping Bing with sitemap URL
 */
export async function pingBing(sitemapUrl?: string): Promise<PingResult> {
  const url = sitemapUrl || `${BASE_URL}/sitemap.xml`;
  const pingUrl = `${BING_PING_URL}${encodeURIComponent(url)}`;

  try {
    const response = await fetch(pingUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Zeva360-SitemapPing/1.0',
      },
    });

    if (response.ok) {
      console.log(`✅ Bing ping successful: ${url}`);
      return {
        service: 'bing',
        success: true,
        statusCode: response.status,
      };
    } else {
      console.warn(`⚠️ Bing ping returned status ${response.status}: ${url}`);
      return {
        service: 'bing',
        success: false,
        statusCode: response.status,
        error: `HTTP ${response.status}`,
      };
    }
  } catch (error: any) {
    console.error(`❌ Bing ping failed: ${error.message}`);
    return {
      service: 'bing',
      success: false,
      error: error.message,
    };
  }
}

/**
 * Ping all search engines
 */
export async function pingAll(sitemapUrl?: string): Promise<PingResult[]> {
  const results = await Promise.all([
    pingGoogle(sitemapUrl),
    pingBing(sitemapUrl),
  ]);

  return results;
}

/**
 * Ping search engines after sitemap update
 */
export async function pingAfterUpdate(sitemapUrl?: string): Promise<PingResult[]> {
  // Wait a bit to ensure sitemap is accessible
  await new Promise(resolve => setTimeout(resolve, 1000));

  return await pingAll(sitemapUrl);
}

