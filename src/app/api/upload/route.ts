import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MAX_BYTES = 5 * 1024 * 1024;
const PUBLIC_BUCKET = 'tshastho_uploadsdrpp';
const PRIVATE_BUCKET = 'tshastho_private_docs';
const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};
const DEV_PLACEHOLDER =
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=256&auto=format&fit=crop';

function sniff(b: Buffer): string | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length > 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b.length > 4 && b.toString('latin1', 0, 4) === '%PDF') return 'application/pdf';
  if (b.length > 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

export async function POST(req: Request) {
  try {
    const isPrivate = new URL(req.url).searchParams.get('private') === '1';
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (file.size === 0 || file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File must be smaller than 5 MB' }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = sniff(buffer);
    if (!mime) {
      return NextResponse.json({ error: 'Only JPG, PNG, WebP or PDF files are allowed' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey || supabaseUrl.includes('dummy')) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[UPLOAD] storage not configured, using dev placeholder');
        return NextResponse.json({ url: DEV_PLACEHOLDER });
      }
      console.error('[UPLOAD] storage is not configured');
      return NextResponse.json({ error: 'Upload is not available right now' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const bucket = isPrivate ? PRIVATE_BUCKET : PUBLIC_BUCKET;
    const dir = isPrivate ? 'licenses' : 'uploads';
    const filePath = `${dir}/${Math.random().toString(36).substring(2)}_${Date.now()}.${EXT[mime]}`;
    const opts = { contentType: mime, upsert: false };

    let { error } = await supabase.storage.from(bucket).upload(filePath, buffer, opts);
    if (error && isPrivate && /not found|does not exist/i.test(error.message)) {
      await supabase.storage.createBucket(bucket, {
        public: false,
        fileSizeLimit: MAX_BYTES,
        allowedMimeTypes: Object.keys(EXT),
      });
      ({ error } = await supabase.storage.from(bucket).upload(filePath, buffer, opts));
    }
    if (error) {
      console.error('[UPLOAD] supabase error:', error.message);
      return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 502 });
    }

    if (isPrivate) return NextResponse.json({ url: `private:${filePath}` });
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return NextResponse.json({ url: data.publicUrl });
  } catch (e) {
    console.error('[UPLOAD]', e);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
