import {NextResponse} from 'next/server';
import {fetchIcyMetadata} from 'icy-metadata';

export async function GET(request: Request) {
  const {searchParams} = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({error: 'Missing URL parameter'}, {status: 400});
  }

  try {
    const metadata = await fetchIcyMetadata({url});
    return NextResponse.json({song: metadata.title});
  } catch (error) {
    console.error('Failed to fetch icy metadata:', error);
    return NextResponse.json({song: null}, {status: 500});
  }
}
