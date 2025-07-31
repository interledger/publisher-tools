import { Heading5 } from '@/typography'

export const RevShareInfo = () => {
  return (
    <div className="flex flex-col gap-md">
      <Heading5>Information</Heading5>
      <div>
        <p className="text-sm leading-sm text-field-helpertext-default">
          Each recipient has a different chance of being chosen, depending on
          their assigned weight. The weight is translated to a percentage which
          represents the percent of revenue each recipient will receive over
          time. The higher the weight, the larger the percentage.
          <br />
          For example, if three recipients each have a weight of 1, then each
          recipient will eventually receive 33% of the revenue. If three
          recipients have a weight of 1, 2, and 3, the percentages will be 17%
          (weight 1), 33% (weight 2), and 50% (weight 3). <br />
          Additional information can be found in the overview of the&nbsp;
          <a
            className="underline"
            href="https://webmonetization.org/tutorials/revenue-sharing"
            target="_blank"
            rel="noreferrer"
          >
            Set up probabilistic revenue sharing
          </a>
          &nbsp;tutorial.
        </p>
      </div>
      <div>
        <p className="text-field-helpertext-default font-bold text-base leading-md">
          Define a revshare
        </p>
        <p className="text-sm leading-sm text-field-helpertext-default">
          Enter each payment pointer and wallet address that will receive a
          split of the revenue into the table. Names are optional. Click Add
          Share to add more rows. Assign a weight to each recipient. If
          you&apos;d rather assign sharing by percentage, enter at least two
          recipients into the table. The Percent field will open for edits. When
          you&apos;re finished, add the generated monetization link tag to your
          site. The link contains a unique URL hosted on
          https://webmonetization.org/api/revshare/pay/.
        </p>
      </div>
    </div>
  )
}
