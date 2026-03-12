import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options";

/**
 * API Route to handle user feedback.
 * Saves to Supabase 'feedback' table and optionally sends an email if configured.
 * 
 * To enable email sending, the user should provide RESEND_API_KEY in the environment.
 */
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    try {
        const body = await req.json();
        const { name, email, category, message, images } = body;

        if (!name || !email || !message) {
            return NextResponse.json({ error: "Nombre, email y mensaje son obligatorios" }, { status: 400 });
        }

        // 1. Save to Database (Reliable storage)
        const { data, error } = await supabaseAdmin.from("feedback")
            .insert({
                user_id: session?.user?.id || null,
                user_name: name || session?.user?.username || "Anónimo",
                user_email: email || null,
                category: category || "general",
                message,
                images: images || []
            })
            .select()
            .single();

        if (error) throw error;

        // 2. Optional: Send Email if RESEND_API_KEY is available
        if (process.env.RESEND_API_KEY) {
            try {
                // Domain verified! Using official address
                const fromAddress = "Artic Tempest <feedback@artictempest.es>";

                const resendRes = await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                    },
                    body: JSON.stringify({
                        from: fromAddress,
                        to: "taplatero@outlook.es",
                        subject: `[FEEDB] ${category.toUpperCase()} - ${name || 'Anónimo'}`,
                        html: `
                            <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #111; padding: 30px; background: #000; color: #fff; border-radius: 20px;">
                                <h1 style="color: #60a5fa; margin-top: 0; font-size: 24px;">Nuevo Feedback</h1>
                                <p style="font-size: 14px; opacity: 0.7;">Has recibido una nueva sugerencia desde la web de Artic Tempest.</p>
                                
                                <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin: 20px 0;">
                                    <p><strong>De:</strong> ${name || 'Anónimo'} (${email || 'Sin email'})</p>
                                    <p><strong>Categoría:</strong> ${category}</p>
                                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); white-space: pre-wrap; font-size: 16px; line-height: 1.6;">
                                        ${message}
                                    </div>
                                </div>

                                 ${images && images.length > 0 ? `
                                    <div style="margin-top: 30px;">
                                        <h3 style="color: #60a5fa; margin-bottom: 15px; font-size: 18px;">Adjuntos (${images.length}):</h3>
                                        <div style="font-size: 0;">
                                            ${images.map((img: string) => `
                                                <div style="display: inline-block; margin-right: 10px; margin-bottom: 10px; border: 2px solid rgba(255,255,255,0.1); border-radius: 12px; overflow: hidden; background: #111;">
                                                    <a href="${img}" target="_blank" style="text-decoration: none;">
                                                        <img src="${img}" width="180" height="180" style="display: block; object-fit: cover; border: 0;" alt="Feedback attachment" />
                                                    </a>
                                                </div>
                                            `).join('')}
                                        </div>
                                        <p style="font-size: 12px; color: #60a5fa; margin-top: 5px;">Haga clic en las imágenes para verlas a tamaño completo.</p>
                                    </div>
                                ` : ''}

                                <p style="margin-top: 40px; font-size: 11px; opacity: 0.4; text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
                                    Enviado automáticamente por el Sistema de Feedback de Artic Tempest
                                </p>
                            </div>
                        `,
                    }),
                });

                if (!resendRes.ok) {
                    const resendError = await resendRes.json();
                    console.error("Resend API Error details:", resendError);
                } else {
                    console.log("Feedback email sent successfully to taplatero@outlook.es");
                }
            } catch (emailErr) {
                console.error("Failed to send email notification via Resend:", emailErr);
            }
        } else {
            console.warn("Feedback saved to DB, but email was NOT sent because RESEND_API_KEY is missing in .env");
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("Feedback API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
