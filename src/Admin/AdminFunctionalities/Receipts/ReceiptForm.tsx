import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import SearchSelect from '../../../components/SearchSelect'
import { InvoiceSummary } from '../../../types/invoice'
import { InvoiceBalance, PaymentMethod, PaymentMethodOption, ReceiptFormProps, ReceiptSummary } from '../../../types/receipt'

// Must match the payment methods in the server's receipt model
export const paymentMethods: PaymentMethodOption[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
]

// Up to 8 digits, with up to 2 decimals
const validAmount = /^\d{1,8}(\.\d{1,2})?$/

const toCents = (value: number) => Math.round(value * 100)

// Loads the receipts of an invoice and works out how much of it is paid
export const loadInvoiceBalance = async (invoice_id: string, invoices: InvoiceSummary[], receiptId?: number): Promise<InvoiceBalance> => {
  const response = await axios.get<ReceiptSummary[]>(`${process.env.REACT_APP_BACKEND_URL}/api/receipts/getReceipts`, { params: { invoice_id }, withCredentials: true })
  const receipts = response.data
  const own = receipts.find(receipt => receipt.receipt_id === receiptId)
  const total = invoices.find(invoice => String(invoice.invoice_id) === invoice_id)?.invoice_total_amount
    ?? receipts[0]?.Invoice?.invoice_total_amount
    ?? '0'
  const paid = receipts
    .filter(receipt => receipt.receipt_id !== receiptId)
    .reduce((sum, receipt) => sum + toCents(Number(receipt.amount)), 0)

  return { total: Number(total), paid: paid / 100, original: own ? Number(own.amount) : 0 }
}

// The fields shared by CreateReceipts and EditReceipts
export default function ReceiptForm({ receiptForm, setReceiptForm, invoices, invoiceLabel, receiptId, onSubmit, saving, submitLabel, savingLabel, cancelTo }: ReceiptFormProps) {
  const [balance, setBalance] = useState<InvoiceBalance | null>(null)
  const latestRequest = useRef(0)
  const left = balance ? (toCents(balance.total) - toCents(balance.paid)) / 100 : null

  // When editing, the invoice is fixed: load its balance once
  useEffect(() => {
    if (!invoiceLabel || !receiptForm.invoice_id) return
    loadInvoiceBalance(receiptForm.invoice_id, invoices, receiptId)
      .then(setBalance)
      .catch(err => console.error(err))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceLabel, receiptForm.invoice_id, receiptId])

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

    // The receipts of an invoice can't add up to more than the invoice (the server checks this too).
    // Like the server, only checked when the amount goes up, so old receipts can still be edited.
    if (balance && left !== null && toCents(Number(amount)) > toCents(balance.original) && toCents(Number(amount)) > toCents(left)) {
      toast.error(left <= 0 ? 'This invoice is already fully paid' : `This invoice only has $${left.toFixed(2)} left to pay`)
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

  // Picking an invoice fills in what is left to pay on it as the amount, which can still be lowered
  const handleInvoiceChange = async (invoice_id: string) => {
    const next = { ...receiptForm, invoice_id, amount: '' }
    setReceiptForm(next)
    setBalance(null)
    if (!invoice_id) return

    const request = ++latestRequest.current
    try {
      const loaded = await loadInvoiceBalance(invoice_id, invoices)
      if (request !== latestRequest.current) return // another invoice was picked meanwhile
      const remaining = (toCents(loaded.total) - toCents(loaded.paid)) / 100
      setBalance(loaded)
      setReceiptForm({ ...next, amount: remaining > 0 ? remaining.toFixed(2) : '' })
    } catch (err) {
      console.error(err)
    }
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
        {balance && left !== null && (
          <div className="form-text">
            Invoice total ${balance.total.toFixed(2)} · Already paid ${balance.paid.toFixed(2)} ·{' '}
            {left > 0 ? <strong>Left to pay ${left.toFixed(2)}</strong> : <strong>Fully paid</strong>}
          </div>
        )}
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
