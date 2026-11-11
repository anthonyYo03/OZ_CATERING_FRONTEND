import  { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../../assets/oz-logo-white.png'
import SearchSelect from '../../../components/SearchSelect'
import { ReceiptSummary } from '../../../types/receipt'
import './ObserverReceipts.css'

export default function ObserverGetAllReceipts() {
  const navigate = useNavigate()
  const [receipts, setReceipts] = useState<ReceiptSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const observerFetchReceipts = async () => {
      try {
        const response = await axios.get<ReceiptSummary[]>(`${process.env.REACT_APP_BACKEND_URL}/api/receipts/getReceipts`, { withCredentials: true, signal: controller.signal })
        setReceipts(response.data)
        setLoading(false)
      } catch (err: any) {
        if (axios.isCancel(err)) return
        setError(err.response?.data?.message || 'Could not load receipts.')
        setLoading(false)
        console.error(err)
      }
    }

    observerFetchReceipts()
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
        <div className="receipt-page">
          <Link to="/observerDashboard" className="oz-back-link">&larr; Dashboard</Link>

          <div className="mb-4">
            <h1 className="oz-page-title">Receipts</h1>
            <p className="oz-eyebrow mb-0">Select a receipt to see its details</p>
          </div>

          {loading && (
            <div className="oz-spinner spinner-border" role="status">
              <span className="visually-hidden">Loading receipts...</span>
            </div>
          )}

          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          {!loading && !error && receipts.length === 0 && (
            <p className="oz-empty-state">No receipts yet. Press + to add your first one.</p>
          )}

          {receipts.length > 0 && (
            <div className="mb-3">
              <label htmlFor="receipt_search" className="form-label">Search receipts</label>
              <SearchSelect
                id="receipt_search"
                value=""
                options={receipts.map(receipt => ({ value: String(receipt.receipt_id), label: `Receipt #${receipt.receipt_number} - ${receipt.customer_name}` }))}
                onChange={selectedId => navigate(`/observer/receipts/${selectedId}`)}
                placeholder="Search by receipt number"
                noMatchText="No receipts found"
              />
            </div>
          )}

          {receipts.length > 0 && (
            <ul className="oz-list">
              {receipts.map(receipt => (
                <li key={receipt.receipt_id}>
                  <Link to={`/observer/receipts/${receipt.receipt_id}`} className="oz-list-row">
                    <span className="receipt-row-text">
                      <span className="oz-list-row-title">Receipt #{receipt.receipt_number}</span>
                      <span className="receipt-row-customer">{receipt.customer_name} &middot; ${receipt.amount}</span>
                    </span>
                    <span className="oz-list-row-arrow" aria-hidden="true">&rarr;</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <Link to="/observer/receipts/create" className="oz-fab" aria-label="Add receipt" title="Add receipt">+</Link>
    </div>
  )
}
