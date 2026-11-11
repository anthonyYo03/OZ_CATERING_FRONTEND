import React from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import SearchSelect from '../../../components/SearchSelect'
import { PaymentMethod, PaymentMethodOption, ReceiptFormProps } from '../../../types/receipt'

// Must match the payment methods in the server's receipt model
export const paymentMethods: PaymentMethodOption[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
]

// Up to 8 digits, with up to 2 decimals
const validAmount = /^\d{1,8}(\.\d{1,2})?$/

// The fields shared by CreateReceipts and EditReceipts
export default function ReceiptForm({ receiptForm, setReceiptForm, invoices, invoiceLabel, onSubmit, saving, submitLabel, savingLabel, cancelTo }: ReceiptFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!receiptForm.invoice_id) {
      toast.error('Please select an invoice')
      return
    }

    if (!receiptForm.payment_date) {
      toast.error('Please choose the payment date')
      return
    }

    const amount = receiptForm.amount.trim()
    if (!validAmount.test(amount) || Number(amount) <= 0) {
      toast.error('Please enter a valid amount, e.g. 32.45')
      return
    }

    // The server compares ids strictly, so they must be sent as numbers
    onSubmit({
      invoice_id: Number(receiptForm.invoice_id),
      payment_date: receiptForm.payment_date,
      amount: Number(amount),
      payment_method: receiptForm.payment_method,
      notes: receiptForm.notes.trim(),
    })
  }

  // Picking an invoice fills in its total as the amount, which can still be changed
  const handleInvoiceChange = (invoice_id: string) => {
    const invoice = invoices.find(option => String(option.invoice_id) === invoice_id)
    setReceiptForm({ ...receiptForm, invoice_id, amount: invoice ? invoice.invoice_total_amount : receiptForm.amount })
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
            value={receiptForm.invoice_id}
            options={invoices.map(invoice => ({
              value: String(invoice.invoice_id),
              label: `Invoice #${invoice.invoice_number} - ${invoice.customer_name}`,
            }))}
            onChange={handleInvoiceChange}
            placeholder="Search by invoice number or customer"
            noMatchText="No invoices found"
          />
        )}
      </div>

      <div className="mb-3">
        <label htmlFor="payment_date" className="form-label">Payment Date</label>
        <input
          type="date"
          id="payment_date"
          className="form-control"
          value={receiptForm.payment_date}
          onChange={e => setReceiptForm({ ...receiptForm, payment_date: e.target.value })}
        />
      </div>

      <div className="mb-3">
        <label htmlFor="amount" className="form-label">Amount Paid ($)</label>
        <input
          type="text"
          inputMode="decimal"
          id="amount"
          className="form-control"
          autoComplete="off"
          placeholder="0.00"
          value={receiptForm.amount}
          onChange={e => setReceiptForm({ ...receiptForm, amount: e.target.value })}
        />
      </div>

      <div className="mb-3">
        <label htmlFor="payment_method" className="form-label">Payment Method</label>
        <select
          id="payment_method"
          className="form-select"
          value={receiptForm.payment_method}
          onChange={e => setReceiptForm({ ...receiptForm, payment_method: e.target.value as PaymentMethod })}
        >
          {paymentMethods.map(method => (
            <option key={method.value} value={method.value}>{method.label}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="notes" className="form-label">Notes (optional)</label>
        <textarea
          id="notes"
          className="form-control"
          rows={3}
          value={receiptForm.notes}
          onChange={e => setReceiptForm({ ...receiptForm, notes: e.target.value })}
          placeholder="Anything else to remember about this payment"
        />
      </div>

      <div className="d-flex gap-3 pt-2 receipt-form-actions">
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
