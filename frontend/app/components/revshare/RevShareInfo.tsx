import { Heading5 } from '@/typography'

export const RevShareInfo = () => {
  return (
    <div className="flex flex-col gap-md">
      <Heading5>Information</Heading5>
      <div>
        <p className="text-sm leading-sm text-field-helpertext-default">
          Each recipient has a different chance of being chosen based on their
          assigned percentage.
          <br />
          The percentage represents how much revenue that recipient should
          receive over time.
          <br />
          All recipient percentages must add up to 100%.
          <br />
          <br />
          For example, you could split revenue between three recipients by
          assigning them 20%, 30%, and 50%.
          <br />
          <br />
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
          Enter each wallet address that will receive a split of the revenue
          into the table.
          <br />
          Names are optional.
          <br />
          Click Add recipient to add more rows.
          <br />
          Assign a percentage to each recipient. Make sure the percentages add
          up to 100%.
          <br />
          When you&apos;re finished, add the generated monetization link tag to
          your site.
          <br />
          The link contains a unique URL hosted on
          https://tools-api.webmonetization.org/revshare/.
        </p>
      </div>
    </div>
  )
}
