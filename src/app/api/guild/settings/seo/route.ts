import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { apiErrorResponse, parseJsonBody } from "@/shared/api/errors";
import { ensureAppPermission } from "@/shared/auth/permissions";
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import {
  SEO_SETTINGS_CACHE_TAG,
  isMissingSeoSettingsTableError,
  getSeoSettings,
  parseSeoSettings,
} from "@/shared/seo/seo-settings";

function serializeSeoSettingsForDb(settings: ReturnType<typeof parseSeoSettings>) {
  return {
    p_id: 1,
    p_site_url: settings.site.url,
    p_site_name: settings.site.name,
    p_site_description: settings.site.description,
    p_site_og_image: settings.site.ogImage,
    p_verification_google: settings.verification.google,
    p_verification_bing: settings.verification.bing,
    p_verification_yandex: settings.verification.yandex,
    p_verification_baidu: settings.verification.baidu,
    p_verification_pinterest: settings.verification.pinterest,
    p_verification_yahoo: settings.verification.yahoo,
    p_analytics_google_analytics_id: settings.analytics.googleAnalyticsId,
    p_analytics_google_tag_manager_id: settings.analytics.googleTagManagerId,
    p_monetization_google_adsense_client_id: settings.monetization.googleAdsenseClientId,
    p_monetization_google_adsense_slot_home_inline1: settings.monetization.googleAdsenseSlots.homeInline1,
    p_monetization_google_adsense_slot_news_list_inline1: settings.monetization.googleAdsenseSlots.newsListInline1,
    p_monetization_google_adsense_slot_news_article_inline1: settings.monetization.googleAdsenseSlots.newsArticleInline1,
    p_monetization_google_adsense_slot_recruitment_inline1: settings.monetization.googleAdsenseSlots.recruitmentInline1,
    p_monetization_ads_txt_content: settings.monetization.adsTxtContent,
    p_social_twitter_site: settings.social.twitterSite,
    p_social_twitter_creator: settings.social.twitterCreator,
    p_social_facebook_app_id: settings.social.facebookAppId,
    p_cookie_consent_enabled: settings.cookieConsent.enabled,
    p_cookie_consent_cookie_name: settings.cookieConsent.cookieName,
    p_cookie_consent_consent_modal_title: settings.cookieConsent.consentModalTitle,
    p_cookie_consent_consent_modal_description: settings.cookieConsent.consentModalDescription,
    p_cookie_consent_accept_all_label: settings.cookieConsent.acceptAllLabel,
    p_cookie_consent_accept_necessary_label: settings.cookieConsent.acceptNecessaryLabel,
    p_cookie_consent_show_preferences_label: settings.cookieConsent.showPreferencesLabel,
    p_cookie_consent_preferences_title: settings.cookieConsent.preferencesTitle,
    p_cookie_consent_save_preferences_label: settings.cookieConsent.savePreferencesLabel,
    p_cookie_consent_close_label: settings.cookieConsent.closeLabel,
    p_cookie_consent_necessary_title: settings.cookieConsent.necessaryTitle,
    p_cookie_consent_necessary_description: settings.cookieConsent.necessaryDescription,
    p_cookie_consent_analytics_title: settings.cookieConsent.analyticsTitle,
    p_cookie_consent_analytics_description: settings.cookieConsent.analyticsDescription,
    p_cookie_consent_analytics_label: settings.cookieConsent.analyticsLabel,
    p_cookie_consent_analytics_enabled: settings.cookieConsent.analyticsEnabled,
    p_cookie_consent_marketing_label: settings.cookieConsent.marketingLabel,
    p_cookie_consent_marketing_description: settings.cookieConsent.marketingDescription,
    p_cookie_consent_marketing_enabled: settings.cookieConsent.marketingEnabled,
    p_cookie_consent_security_enabled: settings.cookieConsent.securityEnabled,
    p_robots_index: settings.robots.index,
    p_robots_follow: settings.robots.follow,
    p_robots_max_image_preview: settings.robots.maxImagePreview,
    p_robots_max_snippet: settings.robots.maxSnippet,
    p_robots_max_video_preview: settings.robots.maxVideoPreview,
    p_schema_organization: settings.schema.organization,
    p_schema_website: settings.schema.website,
    p_schema_breadcrumb: settings.schema.breadcrumb,
    p_schema_article: settings.schema.article,
    p_schema_news_article: settings.schema.newsArticle,
    p_custom_tag_names: settings.verification.custom.map((tag) => tag.name),
    p_custom_tag_contents: settings.verification.custom.map((tag) => tag.content),
  };
}

export async function GET() {
  try {
    await ensureAppPermission("settings", "view");
    const settings = await getSeoSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(req: Request) {
  try {
    await ensureAppPermission("settings", "edit");
    const payload = parseSeoSettings(await parseJsonBody(req, z.looseObject({})));

    const { error } = await supabaseAdmin.rpc(
      "save_seo_settings",
      serializeSeoSettingsForDb(payload),
    );

    if (error) {
      if (isMissingSeoSettingsTableError(error)) {
        return NextResponse.json(
          { error: "La estructura SEO aún no existe. Aplica la migración de normalización de seo_settings." },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidateTag(SEO_SETTINGS_CACHE_TAG, "max");
    return NextResponse.json({ success: true, settings: payload });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
