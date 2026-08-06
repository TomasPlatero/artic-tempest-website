import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { getAuthzSnapshot } from '@/shared/auth/authz';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const authorId = searchParams.get('authorId');
  const applicationId = searchParams.get('applicationId');

  if (!authorId) {
    return NextResponse.json(
      { error: 'Author ID is required' },
      { status: 400 },
    );
  }

  if (!applicationId) {
    return NextResponse.json(
      { error: 'Application ID is required' },
      { status: 400 },
    );
  }

  try {
    const { data: app, error: appError } = await supabaseAdmin
      .from('recruitment_applications')
      .select('user_id')
      .eq('id', applicationId)
      .single();

  if (appError || !app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const authz = await getAuthzSnapshot(session);
    const viewerRoleLevel = (authz.roleSlug ?? session.user?.roleLevel ?? '').toLowerCase?.() ?? '';
    const isOfficial = ['gm', 'officer'].includes(viewerRoleLevel);
    const isApplicant = app.user_id === session.user.id;

    if (!isOfficial && !isApplicant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: chatAuthor } = await supabaseAdmin
      .from('application_messages')
      .select('id')
      .eq('application_id', applicationId)
      .eq('author_id', authorId)
      .limit(1)
      .maybeSingle();

    if (!chatAuthor) {
      return NextResponse.json(
        { error: 'Author not found in this conversation' },
        { status: 404 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('discord_username, discord_avatar, role_level')
      .eq('user_id', authorId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Author profile not found' }, { status: 404 });
    }

    const authorRoleLevel = data.role_level?.toLowerCase?.() ?? '';
    const authorIsStaff = ['gm', 'officer'].includes(authorRoleLevel);
    const authorIsApplicant = authorId === app.user_id;

    if (!authorIsStaff && !authorIsApplicant) {
      return NextResponse.json(
        { error: 'Author is not a valid thread participant' },
        { status: 403 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching chat author profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 },
    );
  }
}
