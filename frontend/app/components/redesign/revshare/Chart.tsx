import React from 'react'
import { PieChart } from 'react-minimal-pie-chart'
import type { Share } from '~/lib/revshare'
import { sharesToChartData } from '~/lib/revshare'

function genLabel({
  dataEntry
}: {
  dataEntry: { title: string; value: number; percentage: number }
}): string {
  return dataEntry.title
}

type RevshareChartProps = {
  shares: Share[]
}

export function RevshareChart({
  shares
}: RevshareChartProps): React.ReactElement | null {
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
        fontFamily:
          'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
        fontSize: '6px'
      })}
      labelPosition={112}
    />
  )
}
