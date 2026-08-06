import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Guía Zona Raider | Artic Tempest",
  description: "Redirección a la guía de Zona Raider para miembros de Artic Tempest.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ZonaRaiderGuideRedirect() {
  redirect("/zona-raider/guia-zona-raider");
}
