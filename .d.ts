declare module '*.hbs' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare const __APP_VERSION__: string;
declare const __GOOGLE_CLIENT_ID__: string;
declare const __GOOGLE_CLIENT_SECRET__: string;
declare const __GIT_API_URL__: string;
declare const __GIT_ACCESS_TOKEN__: string;

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
