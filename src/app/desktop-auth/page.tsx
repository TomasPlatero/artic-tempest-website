import type { Metadata } from "next";
import DesktopAuthBridge from "./desktop-auth-client";

export const metadata: Metadata = {
  title: "Desktop auth | Artic Tempest",
  description: "Puente de autenticación para abrir la app de escritorio.",
};

export default function Page() {
  return <DesktopAuthBridge />;
}
