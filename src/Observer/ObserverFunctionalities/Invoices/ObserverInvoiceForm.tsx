import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import CreateCustomerPopup from '../../../components/CreateCustomerPopup'
import SearchSelect from '../../../components/SearchSelect'
import { Customer } from '../../../types/customer'
import { InvoiceFormProps, InvoiceLineInput } from '../../../types/invoice'
import ObserverCustomerForm from '../Customers/ObserverCustomerForm'

const validQuantity = /^[1-9]\d{0,5}$/

// The fields shared by ObserverCreateInvoice and ObserverEditInvoice
export default function ObserverInvoiceForm({ invoice, setInvoice, customers, onCustomerCreated, items, savedLines, onSubmit, saving, submitLabel, savingLabel, cancelTo }: InvoiceFormProps) {
  const [creatingCustomer, setCreatingCustomer] = useState(false)

  const observerHandleCustomerCreated = (customer: Customer) => {
    onCustomerCreated(customer)
    setInvoice({ ...invoice, customer_id: String(customer.customer_id) })
    setCreatingCustomer(false)
  }

  const observerFindSavedLine = (itemId: number) => savedLines.find(line => line.item_id === itemId)

  // Same rule as the server: items already on the invoice keep their saved price,
  // only items new to the invoice take the current catalog price
  const observerGetUnitPrice = (line: InvoiceLineInput) => {
    if (line.saved_price !== undefined) return line.saved_price
    if (!line.item_id) return null
    const itemId = Number(line.item_id)
    const savedLine = observerFindSavedLine(itemId)
    if (savedLine) return savedLine.unit_price
    return items.find(item => item.item_id === itemId)?.unit_price ?? null
  }

  // Worked out in cents so decimals do not drift when adding up
  const observerGetLineCents = (line: InvoiceLineInput) => {
    const price = observerGetUnitPrice(line)
    if (price === null || !validQuantity.test(line.quantity)) return 0
    return Math.round(Number(price) * 100) * Number(line.quantity)
  }

  const observerFormatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`

  const totalCents = invoice.lines.reduce((sum, line) => sum + observerGetLineCents(line), 0)

  const observerUpdateLine = (key: number, changes: Partial<InvoiceLineInput>) => {
    setInvoice({ ...invoice, lines: invoice.lines.map(line => (line.key === key ? { ...line, ...changes } : line)) })
  }

  const observerAddLine = () => {
    const nextKey = Math.max(0, ...invoice.lines.map(line => line.key)) + 1
    setInvoice({ ...invoice, lines: [...invoice.lines, { key: nextKey, item_id: '', quantity: '1' }] })
  }

  const observerRemoveLine = (key: number) => {
    setInvoice({ ...invoice, lines: invoice.lines.filter(line => line.key !== key) })
  }

  const observerHandleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!invoice.customer_id) {
      toast.error('Please select a customer')
      return
    }

    if (!invoice.invoice_issued_date) {
      toast.error('Please choose the issue date')
      return
    }

    if (invoice.lines.some(line => !line.item_id && line.saved_name === undefined)) {
      toast.error('Please choose an item on every line')
      return
    }

    if (invoice.lines.some(line => !validQuantity.test(line.quantity.trim()))) {
      toast.error('Quantity must be a whole number, 1 or more')
      return
    }

    // The server compares ids strictly, so they must be sent as numbers
    onSubmit({
      customer_id: Number(invoice.customer_id),
      invoice_issued_date: invoice.invoice_issued_date,
      items: invoice.lines.map(line => ({
        item_id: line.saved_name !== undefined ? null : Number(line.item_id),
        quantity: Number(line.quantity.trim()),
      })),
    })
  }

  return (
    <>
      <form onSubmit={observerHandleSubmit} className="oz-panel">
        <div className="mb-3">
          <div className="oz-label-row">
            <label htmlFor="customer_id" className="form-label">Customer</label>
            <button type="button" className="oz-text-link" onClick={() => setCreatingCustomer(true)}>
              + Create Customer
            </button>
          </div>
          <SearchSelect
            id="customer_id"
            value={invoice.customer_id}
            options={customers.map(customer => ({ value: String(customer.customer_id), label: customer.customer_name }))}
            onChange={customer_id => setInvoice({ ...invoice, customer_id })}
            placeholder="Start typing the customer's name"
            noMatchText="No customers found"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="invoice_issued_date" className="form-label">Issue Date</label>
          <input
            type="date"
            id="invoice_issued_date"
            className="form-control"
            value={invoice.invoice_issued_date}
            onChange={e => setInvoice({ ...invoice, invoice_issued_date: e.target.value })}
          />
        </div>

        <h2 className="oz-section-title">Items</h2>

        {savedLines.length > 0 && (
          <p className="oz-eyebrow invoice-form-note">Items already on this invoice keep their saved price. New items use the current price.</p>
        )}

        {invoice.lines.map(line => (
          <div className="invoice-line" key={line.key}>
            <div className="invoice-line-item">
              <label htmlFor={`line_item_${line.key}`} className="form-label">Item</label>
              {line.saved_name !== undefined ? (
                <input
                  type="text"
                  id={`line_item_${line.key}`}
                  className="form-control"
                  value={`${line.saved_name} - $${line.saved_price} (deleted item)`}
                  readOnly
                />
              ) : (
                <SearchSelect
                  id={`line_item_${line.key}`}
                  value={line.item_id}
                  options={items.map(item => {
                    const savedLine = observerFindSavedLine(item.item_id)
                    const price = savedLine ? savedLine.unit_price : item.unit_price
                    const name = savedLine ? savedLine.item_name : item.item_name
                    const usedOnAnotherLine = invoice.lines.some(other => other.key !== line.key && other.item_id === String(item.item_id))
                    return {
                      value: String(item.item_id),
                      label: price === null ? `${name} (no price set)` : `${name} - $${price}`,
                      searchText: name,
                      disabled: usedOnAnotherLine || price === null,
                    }
                  })}
                  onChange={item_id => observerUpdateLine(line.key, { item_id })}
                  placeholder="Start typing the item's name"
                  noMatchText="No items found"
                />
              )}
            </div>

            <div>
              <label htmlFor={`line_quantity_${line.key}`} className="form-label">Qty</label>
              <input
                type="text"
                inputMode="numeric"
                id={`line_quantity_${line.key}`}
                className="form-control"
                autoComplete="off"
                value={line.quantity}
                onChange={e => observerUpdateLine(line.key, { quantity: e.target.value })}
              />
            </div>

            <div className="invoice-line-amount">
              <span className="form-label d-block">Amount</span>
              <span className="invoice-line-amount-value">{observerFormatCents(observerGetLineCents(line))}</span>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary invoice-line-remove"
              aria-label="Remove this item"
              title="Remove this item"
              onClick={() => observerRemoveLine(line.key)}
              disabled={invoice.lines.length === 1}
            >
              &times;
            </button>
          </div>
        ))}

        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 py-3">
          <button type="button" className="btn btn-outline-secondary" id="add_line" onClick={observerAddLine}>
            + Add Item
          </button>
          <div className="invoice-form-total">
            Total <strong id="invoice_total">{observerFormatCents(totalCents)}</strong>
          </div>
        </div>

        <div className="d-flex gap-3 pt-2 invoice-form-actions">
          <Link to={cancelTo} className="btn btn-outline-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary flex-grow-1" disabled={saving}>
            {saving ? savingLabel : submitLabel}
          </button>
        </div>
      </form>

      {creatingCustomer && (
        <CreateCustomerPopup
          FormComponent={ObserverCustomerForm}
          onCreated={observerHandleCustomerCreated}
          onClose={() => setCreatingCustomer(false)}
        />
      )}
    </>
  )
}
