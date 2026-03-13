import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/auth/auth-options';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // 1. Secret validation (Vercel Cron security)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        console.log('Cron: Starting Weekly Vault cleanup...');

        // 2. Fetch uploads older than 60 days
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const dateString = sixtyDaysAgo.toISOString();

        const { data: expiredUploads, error: fetchError } = await supabaseAdmin
            .from('weekly_vault_screenshots')
            .select('id, image_url')
            .lt('created_at', dateString);

        if (fetchError) {
            console.error('Cron Error: Failed to fetch expired uploads', fetchError);
            return NextResponse.json({ error: 'Failed to fetch expired uploads' }, { status: 500 });
        }

        if (!expiredUploads || expiredUploads.length === 0) {
            console.log('Cron: No expired uploads found. Done.');
            return NextResponse.json({ success: true, deleted: 0 });
        }

        console.log(`Cron: Found ${expiredUploads.length} expired uploads. Deleting...`);

        // 3. Extract storage object paths from image URLs
        const storagePaths = expiredUploads.map(upload => {
            // image_url format: https://[URL]/storage/v1/object/public/weekly-vault/[path]
            const urlParts = upload.image_url.split('/weekly-vault/');
            return urlParts.length > 1 ? urlParts[1] : null;
        }).filter(Boolean) as string[];

        // 4. Delete files from Supabase Storage
        if (storagePaths.length > 0) {
            const { error: storageError } = await supabaseAdmin
                .storage
                .from('weekly-vault')
                .remove(storagePaths);

            if (storageError) {
                console.error('Cron Error: Failed to delete files from storage', storageError);
                // Continue with DB deletion anyway to avoid orphans
            }
        }

        // 5. Delete rows from the database
        const uploadIds = expiredUploads.map(u => u.id);
        const { error: dbDeleteError } = await supabaseAdmin
            .from('weekly_vault_screenshots')
            .delete()
            .in('id', uploadIds);

        if (dbDeleteError) {
            console.error('Cron Error: Failed to delete db records', dbDeleteError);
            throw dbDeleteError;
        }

        console.log(`Cron: Successfully deleted ${expiredUploads.length} expired uploads.`);

        return NextResponse.json({
            success: true,
            deletedCount: expiredUploads.length,
        });
    } catch (err) {
        console.error('Cron Cleanup Error:', err);
        return NextResponse.json(
            { error: 'Cleanup failed', details: err instanceof Error ? err.message : 'Unknown error' },
            { status: 500 },
        );
    }
}
