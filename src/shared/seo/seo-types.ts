export type SeoVerificationTag = {
  id: string;
  name: string;
  content: string;
};

export type SeoSettings = {
  site: {
    name: string;
    url: string;
    description: string;
    ogImage: string;
  };
  verification: {
    google: string;
    bing: string;
    yandex: string;
    baidu: string;
    pinterest: string;
    yahoo: string;
    custom: SeoVerificationTag[];
  };
  analytics: {
    googleAnalyticsId: string;
    googleTagManagerId: string;
  };
  monetization: {
    googleAdsenseClientId: string;
    googleAdsenseSlots: {
      homeInline1: string;
      newsListInline1: string;
      newsArticleInline1: string;
      recruitmentInline1: string;
    };
    adsTxtContent: string;
  };
  social: {
    twitterSite: string;
    twitterCreator: string;
    facebookAppId: string;
  };
  cookieConsent: {
    enabled: boolean;
    cookieName: string;
    consentModalTitle: string;
    consentModalDescription: string;
    acceptAllLabel: string;
    acceptNecessaryLabel: string;
    showPreferencesLabel: string;
    preferencesTitle: string;
    savePreferencesLabel: string;
    closeLabel: string;
    necessaryTitle: string;
    necessaryDescription: string;
    analyticsTitle: string;
    analyticsDescription: string;
    analyticsLabel: string;
    analyticsEnabled: boolean;
    marketingLabel: string;
    marketingDescription: string;
    marketingEnabled: boolean;
    securityEnabled: boolean;
  };
  robots: {
    index: boolean;
    follow: boolean;
    maxImagePreview: "none" | "standard" | "large";
    maxSnippet: number;
    maxVideoPreview: number;
  };
  schema: {
    organization: boolean;
    website: boolean;
    breadcrumb: boolean;
    article: boolean;
    newsArticle: boolean;
  };
};
