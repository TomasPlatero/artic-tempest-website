import { Metadata } from "next"
import { DashboardLayoutClient } from "./dashboard-layout-client"

export const metadata: Metadata = {
  title: "Dashboard | Artic Tempest",
  robots: {
    index: false,
    follow: false,
  },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>
}
