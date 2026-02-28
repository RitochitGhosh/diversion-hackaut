import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

// POST /api/upload/image — uploads a single image to Cloudinary, returns secure URL
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('image');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const url = await uploadImage(buffer, file.name);

    return NextResponse.json({ url });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Upload failed';
    console.error('[POST /api/upload/image]', error);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
