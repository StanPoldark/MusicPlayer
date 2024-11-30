import { NextRequest, NextResponse } from 'next/server';

// 动态代理的 API 路由
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');  // 获取完整的 URL 参数

  if (!url) {
    return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
  }

  try {
    const parsedUrl = new URL(url); // 解析完整的 URL
    const domain = parsedUrl.hostname;
    const pathname = parsedUrl.pathname;
    const search = parsedUrl.search;
    const targetUrl = `${parsedUrl.protocol}//${domain}${pathname}${search}`;  // 根据解析出来的路径和查询字符串构建目标 URL

    const rangeHeader = req.headers.get('Range'); // 获取客户端请求的Range头

    // Initialize headers object
    const headers: Record<string, string> = {};

    // Conditionally add the Range header if it exists
    if (rangeHeader) {
      headers['Range'] = rangeHeader;
    }

    const response = await fetch(targetUrl, { headers });

    // 检查返回的响应类型是否为音频流
    const contentType = response.headers.get('Content-Type');
    const isAudio = contentType && (contentType.startsWith('audio/') || contentType === 'application/octet-stream;charset=UTF-8');
    
    if (!isAudio) {
      return NextResponse.json({ error: 'The requested URL is not an audio file.' }, { status: 400 });
    }

    const contentLength = response.headers.get('Content-Length');
    const range = response.headers.get('Content-Range');

    // 处理 range 请求，如果客户端请求了某个字节范围
    if (rangeHeader && contentLength && range) {
      const contentRange = rangeHeader.match(/bytes=(\d+)-(\d+)?/);
      if (contentRange) {
        const [_, start, end] = contentRange;
        const totalLength = parseInt(contentLength, 10);
        const rangeStart = parseInt(start, 10);
        const rangeEnd = end ? parseInt(end, 10) : totalLength - 1;

        const chunkLength = rangeEnd - rangeStart + 1;

        // 使用流式响应返回音频数据
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            const reader = response.body?.getReader();
            let bytesRead = 0;

            if (reader) {
              const push = () => {
                reader.read().then(({ done, value }) => {
                  if (done) {
                    controller.close();  // 数据流结束时关闭流
                    return;
                  }
                  bytesRead += value.length;

                  // 如果已经读取完请求的范围数据，停止推送更多数据
                  if (bytesRead >= chunkLength) {
                    controller.enqueue(value.slice(0, chunkLength - (bytesRead - value.length))); // Send the remainder of data
                    controller.close();
                    return;
                  }

                  controller.enqueue(value); // 将读取的数据推送到流中
                  push(); // 继续读取
                }).catch((err) => {
                  console.error('Error reading the stream:', err);
                  controller.error(err);
                });
              };

              push();
            }
          }
        });

        // 返回流式响应，带上 Content-Range 和 Content-Length
        return new Response(stream, {
          status: 206, // HTTP 206 Partial Content
          headers: {
            'Content-Type': contentType || 'audio/mp3',
            'Content-Length': chunkLength.toString(),
            'Content-Range': `bytes ${rangeStart}-${rangeEnd}/${totalLength}`,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
          },
        });
      }
    }

    // 如果没有 Range 请求，直接返回音频内容
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const reader = response.body?.getReader();
        if (reader) {
          const push = () => {
            reader.read().then(({ done, value }) => {
              if (done) {
                controller.close();  // 数据流结束时关闭流
                return;
              }
              controller.enqueue(value); // 将读取的数据推送到流中
              push(); // 继续读取
            }).catch((err) => {
              console.error('Error reading the stream:', err);
              controller.error(err);
            });
          };

          push();
        }
      }
    });

    // 返回完整音频内容
    return new Response(stream, {
      status: response.status,
      headers: {
        'Content-Type': contentType || 'audio/mp3',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Error during proxying the request:', error);
    return NextResponse.json({ error: 'Error processing the request' }, { status: 500 });
  }
}
