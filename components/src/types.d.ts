/// <reference types="vite/client" />

declare module '*.css?raw' {
  const content: string
  export default content
}

declare module '*.svg?url' {
  const content: string
  export default content
}
