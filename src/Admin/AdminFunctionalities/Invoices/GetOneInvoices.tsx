import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useParams } from 'react-router-dom'
import logo from '../../../assets/oz-logo-white.png'
import { Invoice } from '../../../types/invoice'
import { saveInvoicePdf } from '../../../utils/saveInvoicePdf'
import './Invoices.css'

// The date comes as YYYY-MM-DD. Built from its parts so the timezone can never shift it by a day.
const formatDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function GetOneInvoices() {
  const { id } = useParams()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const fetchInvoice = async () => {
      try {
        const response = await axios.get<Invoice>(`${process.env.REACT_APP_BACKEND_URL}/api/invoices/getInvoice/${id}`, { withCredentials: true, signal: controller.signal })
        setInvoice(response.data)
        setLoading(false)
      } catch (err: any) {
        if (axios.isCancel(err)) return
        setError(err.response?.data?.message || 'Could not load this invoice.')
        setLoading(false)
        console.error(err)
      }
    }

    fetchInvoice()
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
        <div className="invoice-page">
          <Link to="/invoices" className="oz-back-link">&larr; Invoices</Link>

          {loading && (
            <div className="oz-spinner spinner-border" role="status">
              <span className="visually-hidden">Loading invoice...</span>
            </div>
          )}

          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          {invoice && (
            <>
              <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
                <div className="invoice-title">
                  <h1 className="oz-page-title">Invoice #{invoice.invoice_number}</h1>
                  <p className="oz-eyebrow mb-0">Invoice details</p>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => saveInvoicePdf(invoice)}>
                    Save invoice as PDF
                  </button>
                  <Link to={`/invoices/${invoice.invoice_id}/edit`} className="btn btn-primary">
                    Edit
                  </Link>
                </div>
              </div>

              <dl className="oz-panel oz-details mb-4">
                <div className="oz-details-row">
                  <dt>Customer</dt>
                  <dd>{invoice.customer_name}</dd>
                </div>
                <div className="oz-details-row">
                  <dt>Issue Date</dt>
                  <dd>{formatDate(invoice.invoice_issued_date)}</dd>
                </div>
              </dl>

              <h2 className="oz-section-title">Items</h2>

              <ul className="oz-panel invoice-lines">
                {invoice.InvoiceItems.map(line => (
                  <li className="invoice-lines-row" key={line.invoice_item_id}>
                    <span className="invoice-lines-text">
                      <span className="invoice-lines-name">{line.item_name}</span>
                      <span className="invoice-lines-calc">{line.quantity} &times; ${line.unit_price}</span>
                    </span>
                    <span className="invoice-lines-amount">${line.line_total}</span>
                  </li>
                ))}
                <li className="invoice-lines-row invoice-lines-total">
                  <span>Total</span>
                  <span className="invoice-lines-amount">${invoice.invoice_total_amount}</span>
                </li>
              </ul>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
