"use client";

import { useState } from "react";
import {
  IconPlus,
  IconTrash,
  IconChevronDown,
  IconChevronRight,
} from "@/shared/ui/tabler-icons";
import type { ReactNode } from "react";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import type { SeoSettings, SeoVerificationTag } from "@/shared/seo/seo-types";
import { SeoSwitchField, SeoTextField, SeoTextareaField } from "./seo-settings-shared";

const defaultVerificationRow = (): SeoVerificationTag => ({
  id: crypto.randomUUID(),
  name: "",
  content: "",
});

function SeoPanel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-white/10 bg-card/25 shadow-xl shadow-black/10 backdrop-blur-sm">
      <header className="border-b border-white/10 px-6 py-5 lg:px-7 lg:py-6">
        <h2 className="text-xl font-semibold text-white lg:text-[1.35rem]">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/55">{description}</p>
      </header>
      <div className="space-y-8 p-6 lg:p-7">{children}</div>
    </section>
  );
}

type TabProps = {
  settings: SeoSettings;
  onChange: (updater: (prev: SeoSettings) => SeoSettings) => void;
  canEdit: boolean;
};

// ─── 1. Mi sitio ────────────────────────────────────────────────────────────

export function SeoSiteTab({ settings, onChange, canEdit: _canEdit }: TabProps) {
  const [showMoreVerification, setShowMoreVerification] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateSite = (key: keyof SeoSettings["site"], value: string) =>
    onChange((prev) => ({ ...prev, site: { ...prev.site, [key]: value } }));

  const updateSocial = (key: keyof SeoSettings["social"], value: string) =>
    onChange((prev) => ({ ...prev, social: { ...prev.social, [key]: value } }));

  const updateVerification = (key: Exclude<keyof SeoSettings["verification"], "custom">, value: string) =>
    onChange((prev) => ({ ...prev, verification: { ...prev.verification, [key]: value } }));

  const updateCustomVerification = (index: number, key: keyof SeoVerificationTag, value: string) =>
    onChange((prev) => ({
      ...prev,
      verification: {
        ...prev.verification,
        custom: prev.verification.custom.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
      },
    }));

  const addCustomVerification = () =>
    onChange((prev) => ({
      ...prev,
      verification: { ...prev.verification, custom: [...prev.verification.custom, defaultVerificationRow()] },
    }));

  const removeCustomVerification = (index: number) =>
    onChange((prev) => ({
      ...prev,
      verification: { ...prev.verification, custom: prev.verification.custom.filter((_, i) => i !== index) },
    }));

  const updateRobots = (key: keyof SeoSettings["robots"], value: string | boolean | number) =>
    onChange((prev) => ({ ...prev, robots: { ...prev.robots, [key]: value } }));

  const updateSchema = (key: keyof SeoSettings["schema"], value: boolean) =>
    onChange((prev) => ({ ...prev, schema: { ...prev.schema, [key]: value } }));

  const hasCustomVerifications = settings.verification.custom.length > 0;

  return (
    <div className="space-y-6">
      {/* Identidad del sitio */}
      <SeoPanel
        title="Identidad del sitio"
        description="Así ve Google tu web. El nombre, la URL y la descripción aparecen en los resultados de búsqueda."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <SeoTextField label="Nombre del sitio" value={settings.site.name} onChange={(v) => updateSite("name", v)} />
          <SeoTextField label="URL principal" value={settings.site.url} onChange={(v) => updateSite("url", v)} placeholder="https://artictempest.es" />
        </div>
        <SeoTextareaField label="Descripción" value={settings.site.description} onChange={(v) => updateSite("description", v)} rows={4} />
        <SeoTextField label="Imagen al compartir" value={settings.site.ogImage} onChange={(v) => updateSite("ogImage", v)} placeholder="/assets/images/artic-tempest-og.webp" />
      </SeoPanel>

      {/* Al compartir en redes */}
      <SeoPanel
        title="Al compartir en redes"
        description="Controla cómo se ve tu sitio cuando alguien comparte un enlace en Twitter, Discord u otras plataformas."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <SeoTextField label="Twitter de la hermandad" value={settings.social.twitterSite} onChange={(v) => updateSocial("twitterSite", v)} placeholder="@artictempestWoW" />
          <SeoTextField label="Twitter del creador de contenido" value={settings.social.twitterCreator} onChange={(v) => updateSocial("twitterCreator", v)} placeholder="@artictempestWoW" />
          <SeoTextField label="Facebook App ID" value={settings.social.facebookAppId} onChange={(v) => updateSocial("facebookAppId", v)} placeholder="123456789012345" />
        </div>
      </SeoPanel>

      {/* Verificación en Google */}
      <SeoPanel
        title="Verificación en buscadores"
        description="Demuestra que eres el dueño del sitio en Google y otros buscadores."
      >
        <div className="space-y-4">
          <SeoTextField
            label="Google Search Console"
            value={settings.verification.google}
            onChange={(v) => updateVerification("google", v)}
            placeholder="google-site-verification=..."
          />

          <button
            type="button"
            onClick={() => setShowMoreVerification(!showMoreVerification)}
            className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/70 transition-colors"
          >
            {showMoreVerification ? <IconChevronDown className="size-4" /> : <IconChevronRight className="size-4" />}
            Más buscadores
          </button>

          {showMoreVerification && (
            <div className="space-y-4 pt-2">
              <div className="grid gap-4 md:grid-cols-2">
                <SeoTextField label="Bing" value={settings.verification.bing} onChange={(v) => updateVerification("bing", v)} placeholder="msvalidate.01=..." />
                <SeoTextField label="Yandex" value={settings.verification.yandex} onChange={(v) => updateVerification("yandex", v)} />
                <SeoTextField label="Baidu" value={settings.verification.baidu} onChange={(v) => updateVerification("baidu", v)} />
                <SeoTextField label="Pinterest" value={settings.verification.pinterest} onChange={(v) => updateVerification("pinterest", v)} />
                <SeoTextField label="Yahoo" value={settings.verification.yahoo} onChange={(v) => updateVerification("yahoo", v)} />
              </div>

              <Separator className="bg-white/8" />

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-sm font-medium text-white/70">Etiquetas personalizadas</p>
                  <Button type="button" variant="outline" size="sm" onClick={addCustomVerification} className="gap-2 rounded-xl border-white/10 bg-white/5 hover:bg-white/10">
                    <IconPlus className="size-4" /> Añadir
                  </Button>
                </div>
                {hasCustomVerifications ? (
                  <div className="space-y-3">
                    {settings.verification.custom.map((entry, index) => (
                      <div key={entry.id} className="grid gap-3 md:grid-cols-[1fr_1.2fr_auto] rounded-2xl border border-white/10 bg-black/15 p-4">
                        <SeoTextField label="Nombre" value={entry.name} onChange={(v) => updateCustomVerification(index, "name", v)} />
                        <SeoTextField label="Contenido" value={entry.content} onChange={(v) => updateCustomVerification(index, "content", v)} />
                        <div className="flex items-end justify-end">
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeCustomVerification(index)} aria-label="Eliminar verificacion" className="rounded-xl hover:bg-white/10">
                            <IconTrash className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/55">
                    Añade etiquetas de verificación adicionales sin tocar el código.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </SeoPanel>

      {/* Avanzado: Indexación */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex w-full items-center gap-2 rounded-[30px] border border-white/10 bg-card/15 px-6 py-5 text-left hover:bg-card/25 transition-colors"
      >
        {showAdvanced ? <IconChevronDown className="size-5 text-white/50" /> : <IconChevronRight className="size-5 text-white/50" />}
        <div>
          <h2 className="text-lg font-semibold text-white">Avanzado: Indexación y schema</h2>
          <p className="mt-1 text-sm text-white/50">Controla cómo los buscadores rastrean y entienden tu sitio.</p>
        </div>
      </button>

      {showAdvanced && (
        <div className="space-y-6">
          <SeoPanel
            title="Rastreo e indexación"
            description="Controla qué pueden ver los buscadores en tus páginas."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <SeoSwitchField label="Permitir que Google indexe mi sitio" checked={settings.robots.index} onCheckedChange={(v) => updateRobots("index", v)} description="Si lo desactivas, tu web no aparecerá en resultados de búsqueda." />
              <SeoSwitchField label="Permitir que Google siga los enlaces" checked={settings.robots.follow} onCheckedChange={(v) => updateRobots("follow", v)} description="Si lo desactivas, Google no seguirá los enlaces de tus páginas." />
              <SeoTextField label="Tamaño de imágenes en resultados" value={settings.robots.maxImagePreview} onChange={(v) => updateRobots("maxImagePreview", v)} placeholder="large" />
              <SeoTextField label="Longitud máxima del snippet" value={String(settings.robots.maxSnippet)} onChange={(v) => updateRobots("maxSnippet", Number.parseInt(v || "0", 10) || 0)} placeholder="-1" />
              <SeoTextField label="Vista previa de vídeo" value={String(settings.robots.maxVideoPreview)} onChange={(v) => updateRobots("maxVideoPreview", Number.parseInt(v || "0", 10) || 0)} placeholder="-1" />
            </div>
          </SeoPanel>

          <SeoPanel
            title="Google entiende mi sitio"
            description="Activa el marcado estructurado para que Google entienda mejor tu web y muestre resultados enriquecidos."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <SeoSwitchField label="Organización" checked={settings.schema.organization} onCheckedChange={(v) => updateSchema("organization", v)} description="Identidad de la hermandad." />
              <SeoSwitchField label="Sitio web" checked={settings.schema.website} onCheckedChange={(v) => updateSchema("website", v)} description="Buscador interno y estructura del sitio." />
              <SeoSwitchField label="Migas de pan" checked={settings.schema.breadcrumb} onCheckedChange={(v) => updateSchema("breadcrumb", v)} description="Ruta de navegación en resultados." />
              <SeoSwitchField label="Artículos" checked={settings.schema.article} onCheckedChange={(v) => updateSchema("article", v)} description="Contenidos editoriales y guías." />
              <SeoSwitchField label="Noticias" checked={settings.schema.newsArticle} onCheckedChange={(v) => updateSchema("newsArticle", v)} description="Noticias y actualizaciones de la hermandad." />
            </div>
          </SeoPanel>
        </div>
      )}
    </div>
  );
}

// ─── 2. Analítica y anuncios ────────────────────────────────────────────────

export function SeoAnalyticsTab({ settings, onChange, canEdit: _canEdit }: TabProps) {
  const updateAnalytics = (key: keyof SeoSettings["analytics"], value: string) =>
    onChange((prev) => ({ ...prev, analytics: { ...prev.analytics, [key]: value } }));

  const updateMonetization = (key: keyof SeoSettings["monetization"], value: string | SeoSettings["monetization"]["googleAdsenseSlots"]) =>
    onChange((prev) => ({ ...prev, monetization: { ...prev.monetization, [key]: value } }));

  const updateAdsenseSlots = (key: keyof SeoSettings["monetization"]["googleAdsenseSlots"], value: string) =>
    onChange((prev) => ({
      ...prev,
      monetization: {
        ...prev.monetization,
        googleAdsenseSlots: { ...prev.monetization.googleAdsenseSlots, [key]: value },
      },
    }));

  return (
    <div className="space-y-6">
      {/* Google Analytics */}
      <SeoPanel
        title="Mide las visitas a tu web"
        description="Conecta Google Analytics para saber cuánta gente visita tu sitio, qué páginas ven y desde dónde llegan."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <SeoTextField
            label="ID de Google Analytics (GA4)"
            value={settings.analytics.googleAnalyticsId}
            onChange={(v) => updateAnalytics("googleAnalyticsId", v)}
            placeholder="G-XXXXXXXXXX"
          />
          <SeoTextField
            label="ID de Google Tag Manager"
            value={settings.analytics.googleTagManagerId}
            onChange={(v) => updateAnalytics("googleTagManagerId", v)}
            placeholder="GTM-XXXXXXX"
          />
        </div>
      </SeoPanel>

      {/* Google AdSense */}
      <SeoPanel
        title="Gestiona los anuncios"
        description="Configura Google AdSense para mostrar anuncios en tu web y generar ingresos para la hermandad."
      >
        <div className="space-y-6">
          <SeoTextField
            label="ID de publicador de AdSense"
            value={settings.monetization.googleAdsenseClientId}
            onChange={(v) => updateMonetization("googleAdsenseClientId", v)}
            placeholder="ca-pub-1234567890123456"
          />

          <div className="space-y-4">
            <p className="text-sm font-medium text-white/70">Espacios publicitarios</p>
            <div className="grid gap-4 md:grid-cols-2">
              <SeoTextField label="Inicio" value={settings.monetization.googleAdsenseSlots.homeInline1} onChange={(v) => updateAdsenseSlots("homeInline1", v)} placeholder="1234567890" />
              <SeoTextField label="Lista de noticias" value={settings.monetization.googleAdsenseSlots.newsListInline1} onChange={(v) => updateAdsenseSlots("newsListInline1", v)} placeholder="1234567890" />
              <SeoTextField label="Artículo de noticia" value={settings.monetization.googleAdsenseSlots.newsArticleInline1} onChange={(v) => updateAdsenseSlots("newsArticleInline1", v)} placeholder="1234567890" />
              <SeoTextField label="Reclutamiento" value={settings.monetization.googleAdsenseSlots.recruitmentInline1} onChange={(v) => updateAdsenseSlots("recruitmentInline1", v)} placeholder="1234567890" />
            </div>
          </div>
        </div>
      </SeoPanel>

      {/* ads.txt */}
      <SeoPanel
        title="Archivo ads.txt"
        description="Los anunciantes verifican este archivo para saber quién está autorizado a vender anuncios en tu sitio."
      >
        <SeoTextareaField
          label="Contenido de ads.txt"
          value={settings.monetization.adsTxtContent}
          onChange={(v) => updateMonetization("adsTxtContent", v)}
          rows={8}
          placeholder="google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0"
        />
      </SeoPanel>
    </div>
  );
}
