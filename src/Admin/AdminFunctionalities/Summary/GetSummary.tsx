import React from 'react'
import { Summary } from '../../../types/summary'
import SummaryShell, { formatMoney, SummaryTile } from './SummaryShell'

export default function GetSummary() {
  return (
    <SummaryShell<Summary>
      title="Summary"
      eyebrow="Sales and returns between two dates"
      endpoint="/api/summary"
    >
      {summary => (
        <>
          <div className="row row-cols-1 row-cols-md-3 g-3 mb-5">
            <SummaryTile
              label="Sales"
              value={formatMoney(summary.sales)}
              note={`${summary.invoice_count} ${summary.invoice_count === 1 ? 'invoice' : 'invoices'}`}
            />
            <SummaryTile
              label="Returns"
              value={formatMoney(summary.returns)}
              note={`${summary.return_count} ${summary.return_count === 1 ? 'return' : 'returns'}`}
            />
            <SummaryTile
              label="Net"
              value={formatMoney(summary.net)}
              note="Sales minus returns"
            />
          </div>

          {summary.invoice_count === 0 && summary.return_count === 0 && (
            <p className="oz-empty-state">No invoices or returns between these dates.</p>
          )}

          {summary.items.length > 0 && (
            <>
              <h2 className="oz-section-title">By Item</h2>
              <div className="oz-panel table-responsive summary-table-panel mb-5" role="region" aria-label="Sales by item" tabIndex={0}>
                <table className="table summary-table mb-0">
                  <thead>
                    <tr>
                      <th scope="col">Item</th>
                      <th scope="col" className="text-end">Sold</th>
                      <th scope="col" className="text-end">Sales</th>
                      <th scope="col" className="text-end">Returned</th>
                      <th scope="col" className="text-end">Returns</th>
                      <th scope="col" className="text-end">Net Qty</th>
                      <th scope="col" className="text-end">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.items.map(item => (
                      <tr key={`${item.item_id}-${item.item_name}`}>
                        <th scope="row">{item.item_name}</th>
                        <td className="text-end">{item.sold_quantity}</td>
                        <td className="text-end">{formatMoney(item.sold_amount)}</td>
                        <td className="text-end">{item.returned_quantity}</td>
                        <td className="text-end">{formatMoney(item.returned_amount)}</td>
                        <td className="text-end">{item.net_quantity}</td>
                        <td className="text-end summary-table-strong">{formatMoney(item.net_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {summary.customers.length > 0 && (
            <>
              <h2 className="oz-section-title">By Customer</h2>
              <div className="oz-panel table-responsive summary-table-panel" role="region" aria-label="Sales by customer" tabIndex={0}>
                <table className="table summary-table mb-0">
                  <thead>
                    <tr>
                      <th scope="col">Customer</th>
                      <th scope="col" className="text-end">Invoices</th>
                      <th scope="col" className="text-end">Sales</th>
                      <th scope="col" className="text-end">Returns</th>
                      <th scope="col" className="text-end">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.customers.map(customer => (
                      <tr key={customer.customer_id}>
                        <th scope="row">{customer.customer_name}</th>
                        <td className="text-end">{customer.invoice_count}</td>
                        <td className="text-end">{formatMoney(customer.sales)}</td>
                        <td className="text-end">{formatMoney(customer.returns)}</td>
                        <td className="text-end summary-table-strong">{formatMoney(customer.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </SummaryShell>
  )
}
