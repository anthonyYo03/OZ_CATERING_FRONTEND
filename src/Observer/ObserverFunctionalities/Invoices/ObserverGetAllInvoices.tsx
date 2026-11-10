import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../../assets/oz-logo-white.png'
import SearchSelect from '../../../components/SearchSelect'
import { InvoiceSummary } from '../../../types/invoice'
import './ObserverInvoices.css'

export default function ObserverGetAllInvoices() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const observerFetchInvoices = async () => {
      try {
        const response = await axios.get<InvoiceSummary[]>(`${process.env.REACT_APP_BACKEND_URL}/api/invoices/getInvoices`, { withCredentials: true, signal: controller.signal })
        setInvoices(response.data)
        setLoading(false)
      } catch (err: any) {
        if (axios.isCancel(err)) return
        setError(err.response?.data?.message || 'Could not load invoices.')
        setLoading(false)
        console.error(err)
      }
    }

    observerFetchInvoices()
    return () => controller.abort()
  }, [])

  return (
    <div className="min-vh-100">
      <header className="oz-topbar">
        <div className="container">
          <img src={logo} alt="OZ by ozarome" className="oz-topbar-logo" />
        </div>
      </header>

      <main className="container py-5 oz-page-with-fab">
        <div className="invoice-page">
          <Link to="/observerDashboard" className="oz-back-link">&larr; Dashboard</Link>

          <div className="mb-4">
            <h1 className="oz-page-title">Invoices</h1>
            <p className="oz-eyebrow mb-0">Select an invoice to see its details</p>
          </div>

          {loading && (
            <div className="oz-spinner spinner-border" role="status">
              <span className="visually-hidden">Loading invoices...</span>
            </div>
          )}

          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          {!loading && !error && invoices.length === 0 && (
            <p className="oz-empty-state">No invoices yet. Press + to add your first one.</p>
          )}

          {invoices.length > 0 && (
            <div className="mb-3">
              <label htmlFor="invoice_search" className="form-label">Search invoices</label>
              <SearchSelect
                id="invoice_search"
                value=""
                options={invoices.map(invoice => ({ value: String(invoice.invoice_id), label: `Invoice #${invoice.invoice_number} - ${invoice.customer_name}` }))}
                onChange={selectedId => navigate(`/observer/invoices/${selectedId}`)}
                placeholder="Search by invoice number"
                noMatchText="No invoices found"
              />
            </div>
          )}

          {invoices.length > 0 && (
            <ul className="oz-list">
              {invoices.map(invoice => (
                <li key={invoice.invoice_id}>
                  <Link to={`/observer/invoices/${invoice.invoice_id}`} className="oz-list-row">
                    <span className="invoice-row-text">
                      <span className="oz-list-row-title">Invoice #{invoice.invoice_number}</span>
                      <span className="invoice-row-customer">{invoice.customer_name}</span>
                    </span>
                    <span className="oz-list-row-arrow" aria-hidden="true">&rarr;</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <Link to="/observer/invoices/create" className="oz-fab" aria-label="Add invoice" title="Add invoice">+</Link>
    </div>
  )
}
