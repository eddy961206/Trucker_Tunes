'use server';

import * as icy from 'icy';
import { Url } from 'url'; // Node.js 기본 모듈 타입

// 타입을 명시적으로 가져옵니다.
type IcyUrl = string | Url | icy.RequestOptions;

export async function getCurrentSong(streamUrl: string): Promise<string | null> {
  if (!streamUrl) {
    return null;
  }

  // 스트림 URL 유효성 검사 (간단한 예시)
  try {
    new URL(streamUrl);
  } catch (error) {
    console.error(`Invalid stream URL: ${streamUrl}`, error);
    return null;
  }

  console.log(`Attempting to fetch ICY metadata for: ${streamUrl}`);

  return new Promise((resolve) => {
    try {
      const req = icy.get(streamUrl as IcyUrl, (res) => {
        // HTTP 에러 처리 (예: 403 Forbidden)
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          console.error(`HTTP error ${res.statusCode} for stream: ${streamUrl}`);
          // 연결 종료 필수
          req.abort();
          resolve(null);
          return;
        }

        // 'metadata' 이벤트 리스너
        const metadataListener = (metadata: icy.Metadata) => {
          const parsed = icy.parse(metadata);
          console.log('Parsed ICY metadata:', parsed);
          if (parsed && parsed.StreamTitle) {
            console.log(`Found StreamTitle: ${parsed.StreamTitle}`);
            // 연결 종료 필수
            req.abort();
            resolve(parsed.StreamTitle);
          }
          // StreamTitle 없으면 null 반환 위해 타임아웃까지 기다림
        };
        res.on('metadata', metadataListener);

        // 데이터 수신 리스너 (메타데이터 없을 시 타임아웃 위해 필요)
        res.on('data', () => {
           // 데이터를 실제로 처리할 필요는 없지만, 스트림이 흐르도록 둡니다.
        });

        // 연결 종료 시 처리
        res.on('end', () => {
          console.log(`Stream ended for ${streamUrl} without definitive title.`);
          // 정상 종료 전에 타이틀 못 찾으면 null
          req.abort(); // 혹시 모를 정리
          resolve(null);
        });
        res.on('close', () => {
          console.log(`Stream closed for ${streamUrl}`);
          // 비정상 종료 시에도 null 처리 (이미 resolve 되었을 수 있음)
          // resolve(null); // end/error에서 처리하므로 중복 호출 방지
        });


        // 타임아웃 설정 (예: 5초) - 메타데이터가 안 오거나 연결이 느릴 경우 대비
        const timeout = setTimeout(() => {
          console.warn(`Timeout waiting for metadata from ${streamUrl}`);
          res.removeListener('metadata', metadataListener); // 리스너 제거
          req.abort(); // 요청 중단
          resolve(null); // 타임아웃 시 null 반환
        }, 5000); // 5초

        // 메타데이터 받거나 종료되면 타임아웃 클리어
        res.once('metadata', () => clearTimeout(timeout));
        res.once('end', () => clearTimeout(timeout));
        res.once('close', () => clearTimeout(timeout));
        req.once('error', () => clearTimeout(timeout)); // 에러 시에도 클리어


      });

      // 요청 자체 에러 처리 (예: DNS 오류, 연결 거부)
      req.on('error', (error) => {
        console.error(`Request error for stream ${streamUrl}:`, error.message);
         // 이미 타임아웃 등으로 resolve(null) 호출됐을 수 있으므로, 상태 확인 없이 resolve(null) 호출
        resolve(null); // 에러 시 null 반환
      });


    } catch (error) {
        // icy.get 동기적 에러 (거의 발생 안 함) 또는 URL 파싱 에러 등
       console.error(`Unexpected error setting up ICY request for ${streamUrl}:`, error);
       resolve(null); // 예외 발생 시 null 반환
    }
  });
}