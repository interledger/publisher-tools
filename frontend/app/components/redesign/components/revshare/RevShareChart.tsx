import React from 'react'
import { PieChart } from 'react-minimal-pie-chart'
import { sharesToChartData } from '~/lib/revshare'
import type { Share } from '~/lib/revshare'

function genLabel({
  dataEntry
}: {
  dataEntry: { title: string; value: number; percentage: number }
}): string {
  return dataEntry.title
}

type RevShareChartProps = {
  shares: Share[]
}

export const RevShareChart = React.memo(
  ({ shares }: RevShareChartProps): React.ReactElement | null => {
    const chartData = sharesToChartData(shares)

    if (!chartData.length) {
      return null
    }

    return (
      <PieChart
        style={{ height: '250px', width: '100%' }}
        data={chartData}
        label={genLabel}
        radius={40}
        labelStyle={() => ({
          fontSize: '6px'
        })}
        labelPosition={112}
      />
    )
  }
)

RevShareChart.displayName = 'RevShareChart'
