interface TurnstileVerifyResponse {
	success: boolean;
	"error-codes"?: string[];
	challenge_ts?: string;
	hostname?: string;
}

export async function verifyTurnstileToken(
	token: string,
	remoteIp?: string,
): Promise<{ success: boolean; error?: string }> {
	const secret = process.env.TURNSTILE_SECRET_KEY;

	if (!secret) {
		return { success: false, error: "Turnstile not configured" };
	}

	if (!token) {
		return { success: false, error: "Missing token" };
	}

	try {
		const formData = new FormData();
		formData.append("secret", secret);
		formData.append("response", token);

		if (remoteIp) {
			formData.append("remoteip", remoteIp);
		}

		const response = await fetch(
			"https://challenges.cloudflare.com/turnstile/v0/siteverify",
			{
				method: "POST",
				body: formData,
			},
		);

		if (!response.ok) {
			return {
				success: false,
				error: `Verification request failed with status ${response.status}`,
			};
		}

		const data: TurnstileVerifyResponse = await response.json();

		if (!data.success) {
			const errorCode = data["error-codes"]?.join(", ") || "unknown";
			return { success: false, error: `Verification failed: ${errorCode}` };
		}

		return { success: true };
	} catch (err) {
		console.error("Turnstile verification error:", err);
		return { success: false, error: "Network error during verification" };
	}
}
