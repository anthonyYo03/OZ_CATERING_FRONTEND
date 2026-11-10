import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useParams } from 'react-router-dom'
import logo from '../../../assets/oz-logo-white.png'
import { Customer } from '../../../types/customer'
import './customer.css'

export default function GetOneCustomer() {
  const { id } = useParams()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const fetchCustomer = async () => {
      try {
        const response = await axios.get<Customer>(`${process.env.REACT_APP_BACKEND_URL}/api/customers/getOneCustomer/${id}`, { withCredentials: true, signal: controller.signal })
        setCustomer(response.data)
        setLoading(false)
      } catch (err: any) {
        if (axios.isCancel(err)) return
        setError(err.response?.data?.message || 'Could not load this customer.')
        setLoading(false)
        console.error(err)
      }
    }

    fetchCustomer()
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
        <div className="customer-page">
          <Link to="/customers" className="oz-back-link">&larr; Customers</Link>

          {loading && (
            <div className="oz-spinner spinner-border" role="status">
              <span className="visually-hidden">Loading customer...</span>
            </div>
          )}

          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          {customer && (
            <>
              <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
                <div className="customer-title">
                  <h1 className="oz-page-title">{customer.customer_name}</h1>
                  <p className="oz-eyebrow mb-0">Customer details</p>
                </div>
                <Link to={`/customers/${customer.customer_id}/edit`} className="btn btn-primary">
                  Edit
                </Link>
              </div>

              <dl className="oz-panel customer-details">
                <div className="customer-details-row">
                  <dt>Name</dt>
                  <dd>{customer.customer_name}</dd>
                </div>
                <div className="customer-details-row">
                  <dt>Email</dt>
                  <dd>{customer.customer_email}</dd>
                </div>
                <div className="customer-details-row">
                  <dt>Phone</dt>
                  <dd>{customer.customer_phone}</dd>
                </div>
                <div className="customer-details-row">
                  <dt>Address</dt>
                  <dd>{customer.customer_address}</dd>
                </div>
              </dl>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
