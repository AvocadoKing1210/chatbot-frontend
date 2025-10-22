"use client"

import * as React from "react"
import { MuiChart } from "@/components/ai-elements/mui-chart"
import { ChartConfig } from "@/components/ai-elements/chart-creation-modal"
import { DataTableColumn } from "@/components/ai-elements/data-table"

// Sample data for testing
const sampleColumns: DataTableColumn[] = [
  { name: "category", type: "VARCHAR" },
  { name: "sales", type: "NUMERIC" },
  { name: "profit", type: "NUMERIC" },
  { name: "region", type: "VARCHAR" },
]

const sampleRows = [
  { category: "Electronics", sales: 1200, profit: 300, region: "North" },
  { category: "Clothing", sales: 800, profit: 200, region: "South" },
  { category: "Books", sales: 400, profit: 100, region: "East" },
  { category: "Home", sales: 900, profit: 180, region: "West" },
  { category: "Sports", sales: 600, profit: 120, region: "North" },
  { category: "Electronics", sales: 1500, profit: 375, region: "South" },
  { category: "Clothing", sales: 700, profit: 175, region: "East" },
  { category: "Books", sales: 300, profit: 75, region: "West" },
]

const sampleConfigs: ChartConfig[] = [
  {
    type: "bar",
    title: "Sales by Category",
    xAxis: "category",
    yAxis: "sales",
  },
  {
    type: "line",
    title: "Profit Trends",
    xAxis: "category",
    yAxis: "profit",
  },
  {
    type: "pie",
    title: "Sales Distribution",
    xAxis: "category",
    yAxis: "sales",
  },
  {
    type: "scatter",
    title: "Sales vs Profit",
    xAxis: "sales",
    yAxis: "profit",
  },
]

export function MuiChartDemo() {
  const [selectedConfig, setSelectedConfig] = React.useState<ChartConfig>(sampleConfigs[0])

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">MUI Charts Demo</h2>
        <p className="text-muted-foreground">
          Interactive charts using MUI X Charts library
        </p>
      </div>

      {/* Chart Type Selector */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Select Chart Type</h3>
        <div className="flex flex-wrap gap-2">
          {sampleConfigs.map((config) => (
            <button
              key={config.type}
              onClick={() => setSelectedConfig(config)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedConfig.type === config.type
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {config.title}
            </button>
          ))}
        </div>
      </div>

      {/* Sample Data Info */}
      <div className="rounded-lg border p-4 bg-muted/50">
        <h3 className="text-lg font-semibold mb-2">Sample Data</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Rows:</span> {sampleRows.length}
          </div>
          <div>
            <span className="font-medium">Columns:</span> {sampleColumns.length}
          </div>
          <div>
            <span className="font-medium">Categories:</span> {new Set(sampleRows.map(r => r.category)).size}
          </div>
          <div>
            <span className="font-medium">Regions:</span> {new Set(sampleRows.map(r => r.region)).size}
          </div>
        </div>
      </div>

      {/* Chart Display */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Chart: {selectedConfig.title}</h3>
        <MuiChart
          config={selectedConfig}
          columns={sampleColumns}
          rows={sampleRows}
          onDelete={() => console.log('Chart deleted')}
        />
      </div>

      {/* Data Table Preview */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Raw Data</h3>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {sampleColumns.map((col) => (
                  <th key={col.name} className="px-3 py-2 text-left font-medium">
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sampleRows.map((row, index) => (
                <tr key={index} className="border-t">
                  {sampleColumns.map((col) => (
                    <td key={col.name} className="px-3 py-2">
                      {row[col.name as keyof typeof row]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
