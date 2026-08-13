import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
	title: "Feedback | Artic Tempest",
	description: "Redirección al centro de ayuda y feedback de Artic Tempest.",
};

export default function FeedbackRedirect() {
	redirect("/ayuda");
}
