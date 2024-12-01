import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
  }

  try {
    const parsedUrl = new URL(url);
    const targetUrl = parsedUrl.toString();

    const response = await fetch(targetUrl);
    const contentType = response.headers.get('Content-Type');
    
    // 确认是否为音频文件
    const isAudio =
      contentType &&
      (contentType.startsWith('audio/') ||
        contentType === 'application/octet-stream;charset=UTF-8');
    
    if (!isAudio) {
      return NextResponse.json(
        { error: 'The requested URL is not an audio file.' },
        { status: 400 }
      );
    }

    const contentLength = parseInt(response.headers.get('Content-Length') || '0', 10);
    const audioBuffer: Buffer[] = [];
    let downloadedBytes = 0;

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const reader = response.body?.getReader();
        
        const processChunk = ({ done, value }: { done: boolean, value?: Uint8Array }) => {
          if (done) {
            controller.close();
            return;
          }

          if (value) {
            audioBuffer.push(Buffer.from(value));
            downloadedBytes += value.length;
            
            // 进度和部分加载回调
            const progress = (downloadedBytes / contentLength) * 100;
            console.log(`Download Progress: ${progress.toFixed(2)}%`);

            // 每次都推送数据
            controller.enqueue(value);
            
            // 可以在这里添加触发部分播放的逻辑
            if (downloadedBytes > 1024 * 1024) { // 超过1MB可以尝试播放
              console.log('Partial data ready for playback');
            }
          }

          // 继续读取
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