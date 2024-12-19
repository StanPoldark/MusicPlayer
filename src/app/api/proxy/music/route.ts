import { NextRequest, NextResponse } from 'next/server';

const audioCache: Map<string, Buffer[]> = new Map();  // In-memory cache for audio files

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
  }

  try {
    // Check if the audio is already cached
    if (audioCache.has(url)) {
      const cachedAudio = audioCache.get(url);
      
      // Return cached audio as a stream
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          // Convert the cached audio buffer to a stream
          cachedAudio?.forEach(chunk => controller.enqueue(chunk));
          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'audio/mp3',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache'
        }
      });
    }

    const parsedUrl = new URL(url);
    const targetUrl = parsedUrl.toString();
    
    const response = await fetch(targetUrl);
    const contentType = response.headers.get('Content-Type');
    
    // Check if the content is audio
    const isAudio =
      contentType &&
      (contentType.startsWith('audio/') || contentType === 'application/octet-stream;charset=UTF-8');
    
    if (!isAudio) {
      return NextResponse.json(
        { error: 'The requested URL is not an audio file.' },
        { status: 400 }
      );
    }

    const audioBuffer: Buffer[] = [];

    // Read the audio file and store it in memory
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const reader = response.body?.getReader();

        const processChunk = ({ done, value }: { done: boolean, value?: Uint8Array }) => {
          if (done) {
            // Cache the audio after downloading
            audioCache.set(url, audioBuffer);
            controller.close();
            return;
          }

          if (value) {
            audioBuffer.push(Buffer.from(value));

            // Push the chunk to the response stream
            controller.enqueue(value);
          }

          // Continue reading the next chunk
          reader?.read().then(processChunk).catch(err => {
            console.error('Stream reading error:', err);
            controller.error(err);
          });
        };

        reader?.read().then(processChunk).catch(err => {
          console.error('Initial read error:', err);
          controller.error(err);
        });
      },
      cancel() {
        console.log('Stream cancelled');
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': contentType || 'audio/mp3',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Error during progressive download:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
