import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useParams } from 'react-router-dom'
import logo from '../../../assets/oz-logo-white.png'
import { Invoice } from '../../../types/invoice'
import { ReturnInvoice } from '../../../types/returnInvoice'
import { saveReturnInvoicePdf } from '../../../utils/saveInvoicePdf'
import { reasons } from './ObserverReturnInvoiceForm'
import './ObserverReturnInvoices.css'

// The date comes as YYYY-MM-DD. Built from its parts so the timezone can never shift it by a day.
const observerFormatDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ObserverGetOneReturnInvoice() {
  const { id } = useParams()
  const [returnInvoice, setReturnInvoice] = useState<ReturnInvoice | null>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const observerFetchReturn = async () => {
      try {
        const response = await axios.get<ReturnInvoice>(`${process.env.REACT_APP_BACKEND_URL}/api/returns/getReturn/${id}`, { withCredentials: true, signal: controller.signal })
        // The return only knows its invoice's id, so the invoice is loaded for its number
        const invoiceResponse = await axios.get<Invoice>(`${process.env.REACT_APP_BACKEND_URL}/api/invoices/getInvoice/${response.data.invoice_id}`, { withCredentials: true, signal: controller.signal })
        setReturnInvoice(response.data)
        setInvoice(invoiceResponse.data)
        setLoading(false)
      } catch (err: any) {
        if (axios.isCancel(err)) return
        setError(err.response?.data?.message || 'Could not load this return.')
        setLoading(false)
        console.error(err)
      }
    }

    observerFetchReturn()
    return () => controller.abort()
  }, [id])

  return (
    <div className="min-vh-100">
      <header className="oz-topbar">
        <div className="container">
          <img src={logo} alt="OZ by ozarome" className="oz-topbar-logo" />
        </div>
      </header>

      <main className="container py-5">
        <div className="return-page">
          <Link to="/observer/returns" className="oz-back-link">&larr; Return Invoices</Link>

          {loading && (
            <div className="oz-spinner spinner-border" role="status">
              <span className="visually-hidden">Loading return...</span>
            </div>
          )}

          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          {returnInvoice && invoice && (
            <>
              <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
                <div className="return-title">
                  <h1 className="oz-page-title">Return #{returnInvoice.return_number}</h1>
                  <p className="oz-eyebrow mb-0">Return details</p>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => saveReturnInvoicePdf(returnInvoice, invoice.invoice_number, reasons.find(reason => reason.value === returnInvoice.reason)?.label ?? returnInvoice.reason)}
                  >
                    Save return as PDF
                  </button>
                  <Link to={`/observer/returns/${returnInvoice.return_id}/edit`} className="btn btn-primary">
                    Edit
                  </Link>
                </div>
              </div>

              <dl className="oz-panel oz-details mb-4">
                <div className="oz-details-row">
                  <dt>Customer</dt>
                  <dd>{returnInvoice.customer_name}</dd>
                </div>
                <div className="oz-details-row">
                  <dt>Invoice</dt>
                  <dd><Link to={`/observer/invoices/${invoice.invoice_id}`}>Invoice #{invoice.invoice_number}</Link></dd>
                </div>
                <div className="oz-details-row">
                  <dt>Return Date</dt>
                  <dd>{observerFormatDate(returnInvoice.return_date)}</dd>
                </div>
                <div className="oz-details-row">
                  <dt>Reason</dt>
                  <dd>{reasons.find(reason => reason.value === returnInvoice.reason)?.label ?? returnInvoice.reason}</dd>
                </div>
                <div className="oz-details-row">
                  <dt>Notes</dt>
                  <dd className="return-notes">{returnInvoice.notes || 'None'}</dd>
                </div>
              </dl>

              <h2 className="oz-section-title">Items Returned</h2>

              <ul className="oz-panel return-lines">
                {returnInvoice.ReturnInvoiceItems.map(line => (
                  <li className="return-lines-row" key={line.return_item_id}>
                    <span className="return-lines-text">
                      <span className="return-line-name">{line.item_name}</span>
                      <span className="return-line-info">{line.quantity} &times; ${line.unit_price}</span>
                    </span>
                    <span className="return-lines-amount">${line.line_total}</span>
                  </li>
                ))}
                <li className="return-lines-row return-lines-total">
                  <span>Total</span>
                  <span className="return-lines-amount">${returnInvoice.return_total_amount}</span>
                </li>
              </ul>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
