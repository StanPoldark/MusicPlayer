import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
  }

  try {
    // Decode the URL (ensure it’s properly decoded)
    const parsedUrl = decodeURIComponent(url);
    const targetUrl = parsedUrl.toString();

    // Fetch the audio file
    const response = await fetch(targetUrl);

    // Check if the content is audio
    const contentType = response.headers.get('Content-Type');
    const isAudio =
      contentType &&
      (contentType.startsWith('audio/') || contentType === 'application/octet-stream;charset=UTF-8');

    if (!isAudio) {
      return NextResponse.json({ error: 'The requested URL is not an audio file.' }, { status: 400 });
    }

    // Return the audio file as a response
    return new Response(response.body, {
      headers: {
        'Content-Type': contentType || 'audio/mp3',
        'Access-Control-Allow-Origin': '*', // CORS header to allow frontend access
        'Content-Length': response.headers.get('Content-Length'), // Ensure file size is known for larger files
        'Accept-Ranges': 'bytes', // This allows browsers to download in chunks
      }
    });
    

  } catch (error) {
    console.error('Error during audio fetching:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
