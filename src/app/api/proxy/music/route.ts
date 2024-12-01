import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url'); // 获取完整的 URL 参数

  if (!url) {
    return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
  }

  try {
    const parsedUrl = new URL(url); // 解析完整的 URL
    const targetUrl = parsedUrl.toString(); // 构建目标 URL
    const rangeHeader = req.headers.get('Range'); // 获取客户端请求的 Range 头

    // 初始化请求头
    const headers: Record<string, string> = {};
    if (rangeHeader) {
      headers['Range'] = rangeHeader; // 如果有 Range 请求头，加入请求
    }

    const response = await fetch(targetUrl, { headers });
    const contentType = response.headers.get('Content-Type');
    const contentLength = response.headers.get('Content-Length');
    const range = response.headers.get('Content-Range');

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

    // 如果是 Range 请求，处理部分内容传输
    if (rangeHeader && contentLength && range) {
      const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d+)?/);
      if (rangeMatch) {
        const [, start, end] = rangeMatch;
        const totalLength = parseInt(contentLength, 10);
        const rangeStart = parseInt(start, 10);
        const rangeEnd = end ? parseInt(end, 10) : totalLength - 1;
        const chunkLength = rangeEnd - rangeStart + 1;

        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            const reader = response.body?.getReader();
            let bytesRead = 0;

            if (reader) {
              const push = () => {
                reader
                  .read()
                  .then(({ done, value }) => {
                    if (done) {
                      controller.close(); // 数据流结束时关闭流
                      return;
                    }

                    bytesRead += value.length;

                    // 如果超出请求范围，仅推送剩余部分的数据
                    if (bytesRead >= chunkLength) {
                      controller.enqueue(
                        value.slice(0, chunkLength - (bytesRead - value.length))
                      );
                      controller.close();
                      return;
                    }

                    controller.enqueue(value);
                    push(); // 继续读取
                  })
                  .catch((err) => {
                    console.error('Error reading the stream:', err);
                    controller.error(err);
                  });
              };

              push();
            }
          },
          cancel() {
            console.log('Stream has been cancelled.');
          }
        });

        // 返回流式响应
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

    // 如果没有 Range 请求，返回完整音频内容
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const reader = response.body?.getReader();

        if (reader) {
          const push = () => {
            reader
              .read()
              .then(({ done, value }) => {
                if (done) {
                  controller.close(); // 数据流结束时关闭流
                  return;
                }
                controller.enqueue(value);
                push(); // 继续读取
              })
              .catch((err) => {
                console.error('Error reading the stream:', err);
                controller.error(err);
              });
          };

          push();
        }
      },
      cancel() {
        console.log('Stream has been cancelled.');
      }
    });

    // 返回完整音频内容响应
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
