// src/lib/bnet/client.ts

export class BnetClient {
    private clientId: string;
    private clientSecret: string;
    private _accessToken: string | null = null;
    private _tokenExpiresAt: number = 0;

    constructor() {
        this.clientId = process.env.BNET_CLIENT_ID || "";
        this.clientSecret = process.env.BNET_CLIENT_SECRET || "";
    }

    private async getAccessToken(): Promise<string> {
        if (!this.clientId || !this.clientSecret) {
            throw new Error("Missing BNET_CLIENT_ID or BNET_CLIENT_SECRET");
        }

        if (this._accessToken && Date.now() < this._tokenExpiresAt) {
            return this._accessToken;
        }

        const authString = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
        const res = await fetch("https://oauth.battle.net/token", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${authString}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: "grant_type=client_credentials"
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Failed to fetch Battle.net token: ${err}`);
        }

        const data = await res.json();
        this._accessToken = data.access_token;
        // Subtract 60 seconds as buffer
        this._tokenExpiresAt = Date.now() + ((data.expires_in - 60) * 1000);

        return this._accessToken!;
    }

    async fetchApi(url: string, namespace: 'dynamic-eu' | 'static-eu', retries = 3): Promise<any> {
        const token = await this.getAccessToken();
        // Always enforce the correct locale for game data requests
        const separator = url.includes('?') ? '&' : '?';
        const finalUrl = `${url}${separator}namespace=${namespace}&locale=es_ES`;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const res = await fetch(finalUrl, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    },
                    cache: 'no-store' // Do not cache these requests in Next.js
                });

                if (res.status === 429 || res.status >= 500) {
                    if (attempt === retries) {
                        throw new Error(`Battle.net API error (${res.status}) on ${finalUrl} after ${retries} attempts.`);
                    }
                    // Wait before retrying (exponential backoff)
                    const waitTime = Math.pow(2, attempt) * 500;
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }

                if (!res.ok) {
                    throw new Error(`Battle.net API error (${res.status}) on ${finalUrl}`);
                }

                return await res.json();
            } catch (e: any) {
                if (attempt === retries) {
                    throw e;
                }
                const waitTime = Math.pow(2, attempt) * 500;
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    // --- Specific API Endpoints ---

    async getExpansion(tierId: number) {
        return this.fetchApi(`https://eu.api.blizzard.com/data/wow/journal-expansion/${tierId}`, "static-eu");
    }

    async getInstance(instanceId: number) {
        return this.fetchApi(`https://eu.api.blizzard.com/data/wow/journal-instance/${instanceId}`, "static-eu");
    }

    async getEncounter(encounterId: number) {
        return this.fetchApi(`https://eu.api.blizzard.com/data/wow/journal-encounter/${encounterId}`, "static-eu");
    }

    async getItem(itemId: number) {
        return this.fetchApi(`https://eu.api.blizzard.com/data/wow/item/${itemId}`, "static-eu");
    }

    async getItemMedia(itemId: number) {
        return this.fetchApi(`https://eu.api.blizzard.com/data/wow/media/item/${itemId}`, "static-eu");
    }
}

export const bnet = new BnetClient();
