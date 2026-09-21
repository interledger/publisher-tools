export function ToolPreviewPlaceholder() {
  const text = `Below 2,000 metres, almost nothing moves quickly.
      What looks empty on a sonar readout is a careful exchange between
      organisms that trade carbon, nitrogen, and light.
      For a long time we only measured it by what washed up.`

  return (
    <div
      className="p-md space-y-xs select-none font-serif text-lg"
      role="presentation"
    >
      <div className="flex justify-between border-b border-gray-200 pb-xs">
        <div>
          <div className="font-sans font-semibold">Your Website</div>
        </div>
        <div className="flex gap-md">
          <div className="w-[80px] p-md border rounded-2xl"></div>
          <div className="w-[80px] p-md border rounded-2xl bg-current"></div>
        </div>
      </div>
      <div className="max-w-screen-md mx-auto space-y-md">
        <div className="text-2xl">The quiet economy of the deep ocean</div>
        <div className="w-full h-[96px] md:h-[20vh] bg-gray-200"></div>
        <div>{text}</div>
        <div>{text}</div>
        <div>{text}</div>
        <div>{text}</div>
        <div>{text}</div>
      </div>
    </div>
  )
}
