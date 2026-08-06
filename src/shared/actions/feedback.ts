'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { verifyTurnstileToken } from '@/shared/api/verify-turnstile';

export async function submitFeedback(formData: {
  name: string;
  email: string;
  category: string;
  message: string;
  images: string[];
  turnstileToken?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error('No autorizado');

  if (process.env.TURNSTILE_SECRET_KEY) {
    const turnstileResult = await verifyTurnstileToken(
      formData.turnstileToken || '',
    );
    if (!turnstileResult.success) {
      return { error: 'Verificación de seguridad fallida. Recarga la página.' };
    }
  }

  const { name, email, category, message, images } = formData;

  if (!name || name.trim().length < 2) {
    return { error: 'Por favor, introduce tu nombre' };
  }

  if (!email || !email.includes('@')) {
    return { error: 'Por favor, introduce un email válido' };
  }

  if (!message || message.trim().length < 10) {
    return { error: 'Por favor, cuéntanos algo más (mínimo 10 caracteres)' };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('feedback')
      .insert({
        user_id: (session.user as any).id || null,
        user_name: name || (session.user as any).username || 'Anónimo',
        user_email: email || null,
        category: category || 'general',
        message,
        images: images || [],
      })
      .select()
      .single();

    if (error) throw error;

    // Optional: Send Email if RESEND_API_KEY is available
    if (process.env.RESEND_API_KEY) {
      after(async () => {
        try {
          const fromAddress = 'Artic Tempest <feedback@artictempest.es>';

          const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: fromAddress,
              to: 'taplatero@outlook.es',
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

                  ${
                    images && images.length > 0
                      ? `
                    <div style="margin-top: 30px;">
                      <h3 style="color: #60a5fa; margin-bottom: 15px; font-size: 18px;">Adjuntos (${images.length}):</h3>
                      <div style="font-size: 0;">
                        ${images
                          .map(
                            (img: string) => `
                          <div style="display: inline-block; margin-right: 10px; margin-bottom: 10px; border: 2px solid rgba(255,255,255,0.1); border-radius: 12px; overflow: hidden; background: #111;">
                            <a href="${img}" target="_blank" style="text-decoration: none;">
                              <img src="${img}" width="180" height="180" style="display: block; object-fit: cover; border: 0;" alt="Feedback attachment" />
                            </a>
                          </div>
                        `,
                          )
                          .join('')}
                      </div>
                      <p style="font-size: 12px; color: #60a5fa; margin-top: 5px;">Haga clic en las imágenes para verlas a tamaño completo.</p>
                    </div>
                    `
                      : ''
                  }

                  <p style="margin-top: 40px; font-size: 11px; opacity: 0.4; text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
                    Enviado automáticamente por el Sistema de Feedback de Artic Tempest
                  </p>
                </div>
              `,
            }),
          });

          if (!resendRes.ok) {
            const resendError = await resendRes.json();
            console.error('Resend API Error details:', resendError);
          }
        } catch (emailErr) {
          console.error(
            'Failed to send email notification via Resend:',
            emailErr,
          );
        }
      });
    }

    revalidatePath('/feedback');
    return { success: true, data };
  } catch (error: any) {
    console.error('Feedback Server Action Error:', error);
    return { error: error.message || 'Error al enviar el feedback' };
  }
}
