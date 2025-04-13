# Firebase Studio

## 프로젝트 설정 방법 (왕초보 가이드)

이 가이드는 Firebase Studio 프로젝트를 처음 설정하는 분들을 위해 단계별로 자세하게 설명합니다.

### 1단계: 필수 프로그램 설치

프로젝트를 시작하기 전에 다음 프로그램들이 설치되어 있어야 합니다.

1.  **Node.js**: JavaScript 런타임 환경입니다.

    *   [Node.js 공식 웹사이트](https://nodejs.org/)에서 LTS(장기 지원) 버전을 다운로드하여 설치합니다.

2.  **npm (Node Package Manager)**: Node.js를 설치하면 자동으로 설치됩니다. npm은 프로젝트에 필요한 라이브러리들을 관리하는 도구입니다.

3.  **Visual Studio Code (VS Code)**: 코드 편집기입니다.

    *   [VS Code 공식 웹사이트](https://code.visualstudio.com/)에서 다운로드하여 설치합니다.

### 2단계: 프로젝트 다운로드

1.  **GitHub 레포지토리 복제 (Clone)**:

    *   GitHub에서 프로젝트 레포지토리로 이동합니다.
    *   "Code" 버튼을 클릭하고, "HTTPS" URL을 복사합니다.

    *   VS Code를 실행하고, 터미널을 엽니다 (`Ctrl + ` 또는 상단 메뉴에서 `보기 > 터미널`).

    *   다음 명령어를 입력하여 레포지토리를 복제합니다.

        ```bash
        git clone [복사한 HTTPS URL]
        ```

        예시:

        ```bash
        git clone https://github.com/your-username/your-repo-name.git
        ```

2.  **프로젝트 디렉토리로 이동**:

    *   다음 명령어를 입력하여 프로젝트 디렉토리로 이동합니다.

        ```bash
        cd [프로젝트 디렉토리 이름]
        ```

        예시:

        ```bash
        cd firebase-studio
        ```

### 3단계: 의존성 설치

프로젝트에 필요한 라이브러리들을 설치합니다.

1.  터미널에서 다음 명령어를 실행합니다.

    ```bash
    npm install
    ```

    이 명령어는 `package.json` 파일에 정의된 모든 의존성(dependencies)을 설치합니다.

### 4단계: 환경 변수 설정

1.  `.env` 파일 생성:

    *   프로젝트 루트 디렉토리에 `.env` 파일을 생성합니다.
    *   `.env` 파일에 필요한 환경 변수를 추가합니다. 예를 들어, Google GenAI API 키가 필요한 경우 다음과 같이 추가합니다.

        ```
        GOOGLE_GENAI_API_KEY=YOUR_API_KEY
        ```

        `YOUR_API_KEY`를 실제 API 키로 대체하세요.

### 5단계: 프로젝트 실행

1.  **개발 서버 시작**:

    *   터미널에서 다음 명령어를 실행하여 개발 서버를 시작합니다.

        ```bash
        npm run dev
        ```

    *   성공적으로 실행되면, 터미널에 다음과 유사한 메시지가 표시됩니다.

        ```
        ready - started server on 0.0.0.0:9002, url: http://localhost:9002
        ```

    *   웹 브라우저에서 `http://localhost:9002` 주소로 접속하여 프로젝트를 확인합니다.

### 6단계: Genkit 개발 환경 설정 (선택 사항)

Genkit을 사용하는 경우, 다음 명령어를 사용하여 Genkit 개발 환경을 시작할 수 있습니다.

1.  **Genkit 개발 서버 시작**:

    ```bash
    npm run genkit:dev
    ```

    또는 파일 변경을 감지하여 자동으로 재시작하는 Genkit 개발 서버를 시작하려면 다음 명령어를 사용합니다.

    ```bash
    npm run genkit:watch
    ```

### 7단계: 문제 해결

*   **의존성 설치 오류**:
    *   `npm install` 명령어 실행 시 오류가 발생하는 경우, Node.js와 npm 버전이 최신인지 확인합니다.
    *   `node_modules` 디렉토리를 삭제하고 다시 설치해 봅니다.
        ```bash
        rm -rf node_modules
        npm install
        ```
*   **환경 변수 오류**:
    *   `.env` 파일이 올바르게 설정되었는지 확인합니다.
    *   환경 변수 이름에 오타가 없는지 확인합니다.
*   **포트 충돌**:
    *   `http://localhost:9002`에 접속할 수 없는 경우, 해당 포트가 다른 프로그램에 의해 사용 중인지 확인합니다.
    *   다른 포트를 사용하려면, `npm run dev -p [새로운 포트 번호]` 명령어를 사용합니다.

### 8단계: 추가 정보

*   **Firebase Studio**: 이 프로젝트는 Firebase Studio를 기반으로 합니다.
*   **Next.js**: React 기반의 웹 프레임워크입니다.
*   **TypeScript**: JavaScript에 타입을 추가한 언어입니다.
*   **Tailwind CSS**: CSS 유틸리티 프레임워크입니다.

축하합니다! Firebase Studio 프로젝트 설정이 완료되었습니다. 이제 프로젝트를 개발하고 수정할 수 있습니다.
