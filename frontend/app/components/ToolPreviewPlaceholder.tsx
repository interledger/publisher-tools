export function ToolPreviewPlaceholder() {
  const text = `Below 2,000 metres, almost nothing moves quickly.
      What looks empty on a sonar readout is a careful exchange between
      organisms that trade carbon, nitrogen, and light.
      For a long time we only measured it by what washed up.`

  return (
    <div
      className="p-4 space-y-2 select-none font-serif text-lg"
      role="presentation"
    >
      <div className="flex justify-between border-b border-gray-200 pb-2">
        <div>
          <div className="font-sans font-semibold">Your Website</div>
        </div>
        <div className="flex gap-4">
          <div className="w-20 p-4 border rounded-2xl"></div>
          <div className="w-20 p-4 border rounded-2xl bg-current"></div>
        </div>
      </div>
      <div className="max-w-screen-md mx-auto space-y-4">
        <div className="text-2xl">The quiet economy of the deep ocean</div>
        <div className="w-full h-24 md:h-[20vh] bg-gray-200"></div>
        <div>{text}</div>
        <div>{text}</div>
        <div>{text}</div>
        <div>{text}</div>
        <div>{text}</div>
      </div>
    </div>
  )
}
