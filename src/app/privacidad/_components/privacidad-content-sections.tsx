"use client";

import {
	DataCollectionSection,
	TransferSection,
} from "./privacy-data-sections";
import {
	SecuritySection,
	RightsSection,
	CookiesSection,
	AdsSection,
	AutomatedSection,
} from "./privacy-legal-sections";

export function PrivacidadContentSections() {
	return (
		<div className="prose prose-invert max-w-none space-y-16">
			<DataCollectionSection />
			<TransferSection />
			<SecuritySection />
			<CookiesSection />
			<AdsSection />
			<RightsSection />
			<AutomatedSection />
		</div>
	);
}
