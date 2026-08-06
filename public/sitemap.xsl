<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
  version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  exclude-result-prefixes="sitemap image"
>
  <xsl:output method="html" encoding="UTF-8" indent="yes" />
  <xsl:template match="/">
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="noindex, follow" />
        <title>Mapa del sitio — Artic Tempest</title>
        <style>
          :root {
            --bg: #0a0a0b;
            --surface: #111114;
            --surface-hover: #1a1a1f;
            --border: rgba(255, 255, 255, 0.08);
            --text: #e4e4e7;
            --muted: rgba(255, 255, 255, 0.45);
            --accent: #3b82f6;
            --accent-soft: rgba(59, 130, 246, 0.15);
            --warn: rgba(245, 158, 11, 0.2);
            --radius: 16px;
          }

          *,
          *::before,
          *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.6;
            padding: 0;
            min-height: 100vh;
            position: relative;
          }

          body::before {
            content: "";
            position: fixed;
            inset: 0;
            background: url("/assets/images/sitemap.webp") center / cover no-repeat;
            opacity: 0.06;
            pointer-events: none;
            z-index: 0;
          }

          .hero, .container, .footer {
            position: relative;
            z-index: 1;
          }

          .hero {
            background: linear-gradient(180deg, rgba(59, 130, 246, 0.08) 0%, transparent 100%);
            border-bottom: 1px solid var(--border);
            padding: 48px 24px 40px;
            text-align: center;
          }

          .hero-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 56px;
            height: 56px;
            border-radius: 16px;
            background: var(--accent-soft);
            border: 1px solid rgba(59, 130, 246, 0.2);
            margin-bottom: 20px;
          }

          .hero-icon svg {
            width: 28px;
            height: 28px;
            color: var(--accent);
          }

          .hero h1 {
            font-size: 2rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            color: #fff;
            margin-bottom: 8px;
          }

          .hero p {
            font-size: 0.95rem;
            color: var(--muted);
            max-width: 540px;
            margin: 0 auto;
          }

          .container {
            max-width: 960px;
            margin: 0 auto;
            padding: 32px 24px 64px;
          }

          .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 12px;
            margin-bottom: 40px;
          }

          .stat-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 20px;
            text-align: center;
          }

          .stat-card .number {
            font-size: 1.75rem;
            font-weight: 700;
            color: #fff;
            line-height: 1;
          }

          .stat-card .label {
            font-size: 0.72rem;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: var(--muted);
            margin-top: 6px;
          }

          .section {
            margin-bottom: 32px;
          }

          .section-title {
            font-size: 0.68rem;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            color: var(--muted);
            margin-bottom: 12px;
            padding-left: 4px;
          }

          .url-list {
            display: grid;
            gap: 1px;
            background: var(--border);
            border-radius: var(--radius);
            overflow: hidden;
            border: 1px solid var(--border);
          }

          .url-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 14px 20px;
            background: var(--surface);
            text-decoration: none;
            color: var(--text);
            transition: background 0.15s;
            font-size: 0.92rem;
          }

          .url-row:hover {
            background: var(--surface-hover);
          }

          .url-row .path {
            font-weight: 500;
            color: #fff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .url-row .path .domain {
            color: var(--muted);
            font-weight: 400;
          }

          .url-meta {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-shrink: 0;
            font-size: 0.72rem;
          }

          .badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 3px 10px;
            border-radius: 999px;
            font-size: 0.68rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            white-space: nowrap;
          }

          .badge-priority {
            background: var(--accent-soft);
            color: var(--accent);
            border: 1px solid rgba(59, 130, 246, 0.2);
          }

          .badge-freq {
            background: rgba(255, 255, 255, 0.04);
            color: var(--muted);
            border: 1px solid rgba(255, 255, 255, 0.06);
          }

          .badge-image {
            background: var(--warn);
            color: #f59e0b;
            border: 1px solid rgba(245, 158, 11, 0.25);
          }

          .footer {
            text-align: center;
            padding: 32px 24px;
            border-top: 1px solid var(--border);
            color: var(--muted);
            font-size: 0.78rem;
          }

          .footer a {
            color: var(--accent);
            text-decoration: none;
          }

          .footer a:hover {
            text-decoration: underline;
          }

          @media (max-width: 640px) {
            .hero h1 {
              font-size: 1.5rem;
            }
            .url-row {
              flex-direction: column;
              align-items: flex-start;
              gap: 8px;
            }
            .stats {
              grid-template-columns: repeat(2, 1fr);
            }
          }
        </style>
      </head>
      <body>
        <!-- Hero -->
        <div class="hero">
          <div class="hero-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <h1>Mapa del sitio</h1>
          <p>Índice completo de páginas públicas de Artic Tempest. La Zona Raider y las rutas privadas están excluidas por seguridad.</p>
        </div>

        <div class="container">
          <!-- Stats -->
          <div class="stats">
            <div class="stat-card">
              <div class="number"><xsl:value-of select="count(sitemap:urlset/sitemap:url)" /></div>
              <div class="label">Páginas indexadas</div>
            </div>
            <div class="stat-card">
              <div class="number"><xsl:value-of select="count(sitemap:urlset/sitemap:url[image:image])" /></div>
              <div class="label">Con imagen</div>
            </div>
            <div class="stat-card">
              <xsl:variable name="highCount" select="count(sitemap:urlset/sitemap:url[number(sitemap:priority) >= 0.8])" />
              <div class="number"><xsl:value-of select="$highCount" /></div>
              <div class="label">Prioridad alta</div>
            </div>
            <div class="stat-card">
              <div class="number">
                <xsl:value-of select="count(sitemap:urlset/sitemap:url[contains(sitemap:loc, '/noticias/')])" />
              </div>
              <div class="label">Noticias</div>
            </div>
          </div>

          <!-- Alto valor -->
          <div class="section">
            <p class="section-title">&#9670; Alto valor</p>
            <div class="url-list">
              <xsl:for-each select="sitemap:urlset/sitemap:url[number(sitemap:priority) >= 0.8]">
                <a class="url-row" href="{sitemap:loc}">
                  <span class="path">
                    <xsl:value-of select="sitemap:loc" />
                  </span>
                  <span class="url-meta">
                    <span class="badge badge-priority">P<xsl:value-of select="format-number(number(sitemap:priority), '0.0')" /></span>
                    <span class="badge badge-freq"><xsl:value-of select="sitemap:changefreq" /></span>
                  </span>
                </a>
              </xsl:for-each>
            </div>
          </div>

          <!-- Comunidad + soporte -->
          <div class="section">
            <p class="section-title">&#9670; Comunidad y soporte</p>
            <div class="url-list">
              <xsl:for-each select="sitemap:urlset/sitemap:url[number(sitemap:priority) >= 0.5 and number(sitemap:priority) &lt; 0.8]">
                <a class="url-row" href="{sitemap:loc}">
                  <span class="path">
                    <xsl:value-of select="sitemap:loc" />
                  </span>
                  <span class="url-meta">
                    <span class="badge badge-priority">P<xsl:value-of select="format-number(number(sitemap:priority), '0.0')" /></span>
                    <span class="badge badge-freq"><xsl:value-of select="sitemap:changefreq" /></span>
                  </span>
                </a>
              </xsl:for-each>
            </div>
          </div>

          <!-- Legales -->
          <div class="section">
            <p class="section-title">&#9670; Páginas legales</p>
            <div class="url-list">
              <xsl:for-each select="sitemap:urlset/sitemap:url[number(sitemap:priority) &lt; 0.5 and not(contains(sitemap:loc, '/noticias/'))]">
                <a class="url-row" href="{sitemap:loc}">
                  <span class="path">
                    <xsl:value-of select="sitemap:loc" />
                  </span>
                  <span class="url-meta">
                    <span class="badge badge-priority">P<xsl:value-of select="format-number(number(sitemap:priority), '0.0')" /></span>
                    <span class="badge badge-freq"><xsl:value-of select="sitemap:changefreq" /></span>
                  </span>
                </a>
              </xsl:for-each>
            </div>
          </div>

          <!-- Noticias -->
          <xsl:if test="count(sitemap:urlset/sitemap:url[contains(sitemap:loc, '/noticias/')]) > 0">
            <div class="section">
              <p class="section-title">&#9670; Noticias (<xsl:value-of select="count(sitemap:urlset/sitemap:url[contains(sitemap:loc, '/noticias/')])" /> artículos)</p>
              <div class="url-list">
                <xsl:for-each select="sitemap:urlset/sitemap:url[contains(sitemap:loc, '/noticias/')]">
                  <a class="url-row" href="{sitemap:loc}">
                    <span class="path">
                      <xsl:value-of select="sitemap:loc" />
                    </span>
                    <span class="url-meta">
                      <xsl:if test="image:image">
                        <span class="badge badge-image">IMG</span>
                      </xsl:if>
                      <span class="badge badge-freq"><xsl:value-of select="sitemap:changefreq" /></span>
                    </span>
                  </a>
                </xsl:for-each>
              </div>
            </div>
          </xsl:if>


        </div>

        <div class="footer">
          <xsl:text>Generado el </xsl:text>
          <xsl:value-of select="sitemap:urlset/sitemap:url[1]/sitemap:lastmod" />
          <xsl:text> · </xsl:text>
          <a href="{sitemap:urlset/sitemap:url[1]/sitemap:loc}">Artic Tempest</a>
          <xsl:text> · </xsl:text>
          <a href="/robots.txt">robots.txt</a>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
