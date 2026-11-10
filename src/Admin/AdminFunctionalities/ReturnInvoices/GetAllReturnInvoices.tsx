import  { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../../assets/oz-logo-white.png'
import SearchSelect from '../../../components/SearchSelect'
import { ReturnInvoiceSummary } from '../../../types/returnInvoice'
import './ReturnInvoices.css'

export default function GetAllReturnInvoices() {
  const navigate = useNavigate()
  const [returns, setReturns] = useState<ReturnInvoiceSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const fetchReturns = async () => {
      try {
        const response = await axios.get<ReturnInvoiceSummary[]>(`${process.env.REACT_APP_BACKEND_URL}/api/returns/getReturns`, { withCredentials: true, signal: controller.signal })
        setReturns(response.data)
        setLoading(false)
      } catch (err: any) {
        if (axios.isCancel(err)) return
        setError(err.response?.data?.message || 'Could not load return invoices.')
        setLoading(false)
        console.error(err)
      }
    }

    fetchReturns()
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
        <div className="return-page">
          <Link to="/adminDashboard" className="oz-back-link">&larr; Dashboard</Link>

          <div className="mb-4">
            <h1 className="oz-page-title">Return Invoices</h1>
            <p className="oz-eyebrow mb-0">Select a return to see its details</p>
          </div>

          {loading && (
            <div className="oz-spinner spinner-border" role="status">
              <span className="visually-hidden">Loading return invoices...</span>
            </div>
          )}

          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          {!loading && !error && returns.length === 0 && (
            <p className="oz-empty-state">No return invoices yet. Press + to add your first one.</p>
          )}

          {returns.length > 0 && (
            <div className="mb-3">
              <label htmlFor="return_search" className="form-label">Search return invoices</label>
              <SearchSelect
                id="return_search"
                value=""
                options={returns.map(returnInvoice => ({ value: String(returnInvoice.return_id), label: `Return #${returnInvoice.return_number} - ${returnInvoice.customer_name}` }))}
                onChange={selectedId => navigate(`/returns/${selectedId}`)}
                placeholder="Search by return number"
                noMatchText="No return invoices found"
              />
            </div>
          )}

          {returns.length > 0 && (
            <ul className="oz-list">
              {returns.map(returnInvoice => (
                <li key={returnInvoice.return_id}>
                  <Link to={`/returns/${returnInvoice.return_id}`} className="oz-list-row">
                    <span className="return-row-text">
                      <span className="oz-list-row-title">Return #{returnInvoice.return_number}</span>
                      <span className="return-row-customer">{returnInvoice.customer_name}</span>
                    </span>
                    <span className="oz-list-row-arrow" aria-hidden="true">&rarr;</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <Link to="/returns/create" className="oz-fab" aria-label="Add return invoice" title="Add return invoice">+</Link>
    </div>
  )
}
