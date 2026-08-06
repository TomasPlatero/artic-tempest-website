import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Historia y cultura | Artic Tempest",
  description: "Acceso redirigido a la página de historia y cultura de la hermandad.",
};

export default function CulturaRedirect() {
  redirect("/historia-y-cultura");
}
