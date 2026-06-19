declare module '*.svg' {
  const src: string
  export default src
}

declare module '*.css?raw' {
  const content: string
  export default content
}

declare module '*?raw' {
  const src: string
  export default src
}

declare module '*?url' {
  const src: string
  export default src
}
