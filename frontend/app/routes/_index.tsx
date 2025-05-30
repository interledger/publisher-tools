import type { MetaFunction } from '@remix-run/cloudflare'
import { TypeCard } from '~/components/index.js'
import { availableTools } from '~/lib/presets.js'

export const meta: MetaFunction = () => {
  return [
    { title: 'Publisher Tools' },
    { name: 'description', content: 'Choose and configure your elements!' }
  ]
}
export default function Index() {
  return (
    <div className="h-full p-14">
      <div className="flex flex-wrap justify-center gap-6 max-w-prosex p-4 mx-auto">
        {availableTools.map((tool) => (
          <TypeCard key={tool.link} {...tool} />
        ))}
      </div>
    </div>
  )
}
