type CodeBlockProps = {
  link: string
  className?: string
}

export const CodeBlock = ({ link, className }: CodeBlockProps) => {
  return (
    <output className={className}>
      <span>&lt;</span>
      <span style={{ color: '#00009F' }}>link </span>
      <span style={{ color: '#00A4DB' }}>rel</span>
      <span>=&quot;</span>
      <span style={{ color: '#E3116C' }}>monetization</span>
      <span>&quot; </span>
      <span style={{ color: '#00A4DB' }}>href</span>
      <span>=&quot;</span>
      <span style={{ color: '#E3116C' }}>{link}</span>
      <span>&quot; /&gt;</span>
    </output>
  )
}
