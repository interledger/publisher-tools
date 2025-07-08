import React from 'react'
import {
  Typography,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  BodyStandard,
  BodyEmphasis,
  SmallStandard,
  SmallEmphasis,
  CaptionEmphasis
} from './Typography'

export function TypographyExample() {
  return (
    <div className="space-y-6 p-8 bg-white rounded-md">
      <div>
        <h2 className="text-style-h3 mb-4">Typography Examples</h2>
        <p className="text-silver-800 mb-6">
          This component demonstrates all the typography styles available in the
          design system, used via the Typography component or convenience
          components and Tailwind utility classes.
        </p>
      </div>

      <section className="space-y-4">
        <h3 className="text-style-h4">Display and Heading Styles</h3>

        {/* Using convenience components */}
        <Heading1>Heading 1</Heading1>
        <Heading2>Heading 2</Heading2>
        <h2 className="text-style-h2">Heading 2</h2>
        <h2 className="text-style-h2-semibold">Heading 2 Semi-bold</h2>
        <Heading3>Heading 3</Heading3>
        <Heading4>Heading 4</Heading4>
        <Heading5>Heading 5</Heading5>
        <Heading6>Heading 6</Heading6>

        {/* Alternative usage with the base Typography component */}
        <Typography variant="h1">Alternative Heading 1</Typography>
      </section>

      <section className="space-y-4">
        <h3 className="text-style-h4">Text Styles</h3>

        {/* Body text */}
        <div className="space-y-2">
          <BodyStandard>
            Body Standard - Lorem ipsum dolor sit amet, consectetur adipiscing
            elit. Sed do eiusmod tempor incididunt ut labore et dolore magna
            aliqua.
          </BodyStandard>

          <BodyEmphasis>
            Body Emphasis - Lorem ipsum dolor sit amet, consectetur adipiscing
            elit.
          </BodyEmphasis>
        </div>

        {/* Small text */}
        <div className="space-y-2">
          <SmallStandard>
            Small Standard - Lorem ipsum dolor sit amet, consectetur adipiscing
            elit.
          </SmallStandard>
        </div>

        <div>
          <SmallEmphasis>
            Small Emphasis - Lorem ipsum dolor sit amet, consectetur adipiscing
            elit.
          </SmallEmphasis>
        </div>

        {/* Caption */}
        <CaptionEmphasis>
          Caption - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </CaptionEmphasis>
      </section>

      <section className="space-y-4">
        <h3 className="text-style-h4">Using Tailwind Utilities Directly</h3>

        {/* Using the text-style-{token} utilities directly */}
        <p className="text-style-h1">Direct Utility-Heading 1</p>
        <p className="text-style-body-standard">Direct Utility-Body Standard</p>
        <p className="text-style-small-emphasis">
          Direct Utility-Small Emphasis
        </p>
      </section>
    </div>
  )
}
