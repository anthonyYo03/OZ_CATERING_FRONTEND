import React from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import SearchSelect from '../../../components/SearchSelect'
import { Invoice } from '../../../types/invoice'
import { ReturnableInvoice, ReturnFormProps, ReturnInvoice, ReturnInvoiceSummary, ReturnReason, ReturnReasonOption } from '../../../types/returnInvoice'

// Must match the reasons in the server's return model
export const reasons: ReturnReasonOption[] = [
  { value: 'expired', label: 'Expired' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'other', label: 'Other' },
]

const validQuantity = /^\d{1,6}$/

// Loads an invoice and works out how much of each line can still be returned.
// When editing, the return being edited is left out so its own quantities count as available.
export const fetchReturnableLines = async (invoiceId: number, excludeReturnId: number | null, signal: AbortSignal): Promise<ReturnableInvoice> => {
  const backend = process.env.REACT_APP_BACKEND_URL

  const [invoiceResponse, returnsResponse] = await Promise.all([
    axios.get<Invoice>(`${backend}/api/invoices/getInvoice/${invoiceId}`, { withCredentials: true, signal }),
    axios.get<ReturnInvoiceSummary[]>(`${backend}/api/returns/getReturns`, { params: { invoice_id: invoiceId }, withCredentials: true, signal }),
  ])

  // The list has no lines in it, so each earlier return has to be loaded on its own
  const otherReturns = returnsResponse.data.filter(other => other.return_id !== excludeReturnId)
  const fullReturns = await Promise.all(
    otherReturns.map(other => axios.get<ReturnInvoice>(`${backend}/api/returns/getReturn/${other.return_id}`, { withCredentials: true, signal }))
  )

  const alreadyReturned = new Map<number, number>()
  fullReturns.forEach(response => {
    response.data.ReturnInvoiceItems.forEach(line => {
      alreadyReturned.set(line.invoice_item_id, (alreadyReturned.get(line.invoice_item_id) || 0) + line.quantity)
    })
  })

  return {
    invoice: invoiceResponse.data,
    lines: invoiceResponse.data.InvoiceItems.map(line => ({
      invoice_item_id: line.invoice_item_id,
      item_name: line.item_name,
      unit_price: line.unit_price,
      sold: line.quantity,
      left: line.quantity - (alreadyReturned.get(line.invoice_item_id) || 0),
    })),
  }
}

// The fields shared by CreateReturnInvoices and EditReturnInvoices
export default function ReturnInvoiceForm({ returnForm, setReturnForm, invoices, invoiceLabel, lines, linesLoading, linesError, onSubmit, saving, submitLabel, savingLabel, cancelTo }: ReturnFormProps) {
  const getQuantityText = (invoiceItemId: number) => (returnForm.quantities[invoiceItemId] ?? '').trim()

  const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`

  // Worked out in cents so decimals do not drift when adding up
  const getLineCents = (invoiceItemId: number, unitPrice: string) => {
    const quantity = getQuantityText(invoiceItemId)
    if (!validQuantity.test(quantity)) return 0
    return Math.round(Number(unitPrice) * 100) * Number(quantity)
  }

  const totalCents = lines.reduce((sum, line) => sum + getLineCents(line.invoice_item_id, line.unit_price), 0)
  const nothingLeft = lines.length > 0 && lines.every(line => line.left <= 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!returnForm.invoice_id) {
      toast.error('Please select an invoice')
      return
    }

    if (!returnForm.return_date) {
      toast.error('Please choose the return date')
      return
    }

    if (linesLoading || linesError) {
      toast.error('The invoice items are not loaded yet')
      return
    }

    for (const line of lines) {
      const quantity = getQuantityText(line.invoice_item_id)
      if (quantity && !validQuantity.test(quantity)) {
        toast.error('Quantity must be a whole number')
        return
      }
      if (Number(quantity) > line.left) {
        toast.error(`You can only return ${line.left} x ${line.item_name}`)
        return
      }
    }

    const items = lines
      .filter(line => Number(getQuantityText(line.invoice_item_id)) > 0)
      .map(line => ({ invoice_item_id: line.invoice_item_id, quantity: Number(getQuantityText(line.invoice_item_id)) }))

    if (items.length === 0) {
      toast.error('Enter a quantity for at least one item')
      return
    }

    // The server compares ids strictly, so they must be sent as numbers
    onSubmit({
      invoice_id: Number(returnForm.invoice_id),
      return_date: returnForm.return_date,
      reason: returnForm.reason,
      notes: returnForm.notes.trim(),
      items,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="oz-panel">
      <div className="mb-3">
        <label htmlFor="invoice_id" className="form-label">Invoice</label>
        {invoiceLabel ? (
          <input type="text" id="invoice_id" className="form-control" value={invoiceLabel} readOnly />
        ) : (
          <SearchSelect
            id="invoice_id"
            value={returnForm.invoice_id}
            options={invoices.map(invoice => ({
              value: String(invoice.invoice_id),
              label: `Invoice #${invoice.invoice_number} - ${invoice.customer_name}`,
            }))}
            onChange={invoice_id => setReturnForm({ ...returnForm, invoice_id, quantities: {} })}
            placeholder="Search by invoice number or customer"
            noMatchText="No invoices found"
          />
        )}
      </div>

      <div className="mb-3">
        <label htmlFor="return_date" className="form-label">Return Date</label>
        <input
          type="date"
          id="return_date"
          className="form-control"
          value={returnForm.return_date}
          onChange={e => setReturnForm({ ...returnForm, return_date: e.target.value })}
        />
      </div>

      <div className="mb-3">
        <label htmlFor="reason" className="form-label">Reason</label>
        <select
          id="reason"
          className="form-select"
          value={returnForm.reason}
          onChange={e => setReturnForm({ ...returnForm, reason: e.target.value as ReturnReason })}
        >
          {reasons.map(reason => (
            <option key={reason.value} value={reason.value}>{reason.label}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="notes" className="form-label">Notes (optional)</label>
        <textarea
          id="notes"
          className="form-control"
          rows={3}
          value={returnForm.notes}
          onChange={e => setReturnForm({ ...returnForm, notes: e.target.value })}
          placeholder="Anything else to remember about this return"
        />
      </div>

      <h2 className="oz-section-title">Items to Return</h2>

      {!returnForm.invoice_id && (
        <p className="oz-empty-state">Select an invoice to see its items.</p>
      )}

      {linesLoading && (
        <div className="oz-spinner spinner-border mb-3" role="status">
          <span className="visually-hidden">Loading items...</span>
        </div>
      )}

      {linesError && <div className="alert alert-danger" role="alert">{linesError}</div>}

      {nothingLeft && (
        <p className="oz-empty-state">Everything on this invoice has already been returned.</p>
      )}

      {lines.map(line => (
        <div className="return-line" key={line.invoice_item_id}>
          <div className="return-line-item">
            <span className="return-line-name">{line.item_name}</span>
            <span className="return-line-info">
              ${line.unit_price} each &middot; sold {line.sold} &middot; {line.left > 0 ? `${line.left} left to return` : 'nothing left to return'}
            </span>
          </div>

          <div>
            <label htmlFor={`return_quantity_${line.invoice_item_id}`} className="form-label">Qty</label>
            <input
              type="text"
              inputMode="numeric"
              id={`return_quantity_${line.invoice_item_id}`}
              className="form-control"
              autoComplete="off"
              placeholder="0"
              value={returnForm.quantities[line.invoice_item_id] ?? ''}
              onChange={e => setReturnForm({ ...returnForm, quantities: { ...returnForm.quantities, [line.invoice_item_id]: e.target.value } })}
              disabled={line.left <= 0}
            />
          </div>

          <div>
            <span className="form-label">Amount</span>
            <span className="return-line-amount">{formatCents(getLineCents(line.invoice_item_id, line.unit_price))}</span>
          </div>
        </div>
      ))}

      {lines.length > 0 && (
        <div className="return-form-total">
          Total <strong id="return_total">{formatCents(totalCents)}</strong>
        </div>
      )}

      <div className="d-flex gap-3 pt-3 return-form-actions">
        <Link to={cancelTo} className="btn btn-outline-secondary">
          Cancel
        </Link>
        <button type="submit" className="btn btn-primary flex-grow-1" disabled={saving}>
          {saving ? savingLabel : submitLabel}
        </button>
      </div>
    </form>
  )
}
