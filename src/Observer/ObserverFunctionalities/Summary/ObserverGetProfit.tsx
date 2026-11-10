import React from 'react'
import { Profit } from '../../../types/summary'
import ObserverSummaryShell, { observerFormatMoney, ObserverSummaryTile } from './ObserverSummaryShell'

export default function ObserverGetProfit() {
  return (
    <ObserverSummaryShell<Profit>
      title="Profit"
      eyebrow="What you earned between two dates, after costs and returns"
      endpoint="/api/summary/profit"
    >
      {report => (
        <>
          <div className="row row-cols-1 row-cols-md-3 g-3 mb-4">
            <ObserverSummaryTile
              label="Revenue"
              value={observerFormatMoney(report.revenue)}
              note="Sales minus returns"
            />
            <ObserverSummaryTile
              label="Cost"
              value={observerFormatMoney(report.cost)}
              note="What those items cost you"
            />
            <ObserverSummaryTile
              label="Profit"
              value={observerFormatMoney(report.profit)}
              note="Revenue minus cost"
            />
          </div>

          {report.missing_cost_lines > 0 && (
            <div className="alert alert-warning" role="status">
              {report.missing_cost_lines === 1 ? '1 line has' : `${report.missing_cost_lines} lines have`} no saved cost, so the numbers above leave {report.missing_cost_lines === 1 ? 'it' : 'them'} out. Revenue here can be lower than Net on the Summary tab.
            </div>
          )}

          {report.items.length === 0 && (
            <p className="oz-empty-state">No invoices or returns between these dates.</p>
          )}

          {report.items.length > 0 && (
            <>
              <h2 className="oz-section-title mt-5">By Item</h2>
              <div className="oz-panel table-responsive summary-table-panel" role="region" aria-label="Profit by item" tabIndex={0}>
                <table className="table summary-table mb-0">
                  <thead>
                    <tr>
                      <th scope="col">Item</th>
                      <th scope="col" className="text-end">Sold</th>
                      <th scope="col" className="text-end">Returned</th>
                      <th scope="col" className="text-end">Revenue</th>
                      <th scope="col" className="text-end">Cost</th>
                      <th scope="col" className="text-end">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.items.map(item => (
                      <tr key={`${item.item_id}-${item.item_name}`}>
                        <th scope="row">
                          {item.item_name}
                          {item.missing_cost_lines > 0 && (
                            <span className="summary-table-note">
                              {item.missing_cost_lines === 1 ? '1 line' : `${item.missing_cost_lines} lines`} left out: no saved cost
                            </span>
                          )}
                        </th>
                        <td className="text-end">{item.sold_quantity}</td>
                        <td className="text-end">{item.returned_quantity}</td>
                        <td className="text-end">{observerFormatMoney(item.revenue)}</td>
                        <td className="text-end">{observerFormatMoney(item.cost)}</td>
                        <td className="text-end summary-table-strong">{observerFormatMoney(item.profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </ObserverSummaryShell>
  )
}
