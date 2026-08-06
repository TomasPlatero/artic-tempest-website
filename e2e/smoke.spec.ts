import { test, expect } from "@playwright/test";

const PUBLIC_PAGES = [
  { path: "/", title: /Artic Tempest/i },
  { path: "/noticias", title: /Noticias/i },
  { path: "/progreso", title: /Progreso/i },
  { path: "/reclutamiento", title: /Reclutamiento/i },
  { path: "/roster", title: /Roster/i },
  { path: "/accesibilidad", title: /Accesibilidad/i },
  { path: "/ayuda", title: /Ayuda/i },
  { path: "/privacidad", title: /Privacidad/i },
  { path: "/cookies", title: /Cookies/i },
  { path: "/contacto", title: /Contacto/i },
];

for (const { path, title } of PUBLIC_PAGES) {
  test(`public page ${path} returns 200`, async ({ page }) => {
     await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(title);
  });
}

test("/cultura redirects to /noticias", async ({ page }) => {
   await page.goto("/cultura");
  const url = page.url();
  expect(url).toContain("/noticias");
});

test("/feedback redirects to /contacto", async ({ page }) => {
   await page.goto("/feedback");
  const url = page.url();
  expect(url).toContain("/contacto");
});
