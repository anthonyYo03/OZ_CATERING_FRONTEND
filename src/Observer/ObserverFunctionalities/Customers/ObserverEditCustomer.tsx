import React, { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams } from 'react-router-dom'
import logo from '../../../assets/oz-logo-white.png'
import { Customer, CustomerData } from '../../../types/customer'
import ObserverCustomerForm from './ObserverCustomerForm'
import './ObserverCustomer.css'

export default function ObserverEditCustomer() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<CustomerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    const observerFetchCustomer = async () => {
      try {
        const response = await axios.get<Customer>(`${process.env.REACT_APP_BACKEND_URL}/api/customers/getOneCustomer/${id}`, { withCredentials: true, signal: controller.signal })
        const { customer_name, customer_email, customer_phone, customer_address } = response.data
        setCustomer({ customer_name, customer_email, customer_phone, customer_address })
        setLoading(false)
      } catch (err: any) {
        if (axios.isCancel(err)) return
        setError(err.response?.data?.message || 'Could not load this customer.')
        setLoading(false)
        console.error(err)
      }
    }

    observerFetchCustomer()
    return () => controller.abort()
  }, [id])

  const observerHandleUpdate = async (updatedCustomer: CustomerData) => {
    setSaving(true)
    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/customers/updateCustomer/${id}`, updatedCustomer, { withCredentials: true })
      toast.success('Customer updated!')
      navigate(`/observer/customers/${id}`, { replace: true })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not update the customer.')
      console.error(err)
      setSaving(false)
    }
  }

  return (
    <div className="min-vh-100">
      <header className="oz-topbar">
        <div className="container">
          <img src={logo} alt="OZ by ozarome" className="oz-topbar-logo" />
        </div>
      </header>

      <main className="container py-5">
        <div className="customer-page">
          <Link to={`/observer/customers/${id}`} className="oz-back-link">&larr; Customer details</Link>

          <div className="mb-4">
            <h1 className="oz-page-title">Edit Customer</h1>
            <p className="oz-eyebrow mb-0">All fields are required</p>
          </div>

          {loading && (
            <div className="oz-spinner spinner-border" role="status">
              <span className="visually-hidden">Loading customer...</span>
            </div>
          )}

          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          {customer && (
            <ObserverCustomerForm
              customer={customer}
              setCustomer={setCustomer}
              onSubmit={observerHandleUpdate}
              saving={saving}
              submitLabel="Save Changes"
              savingLabel="Saving..."
              cancelTo={`/observer/customers/${id}`}
            />
          )}
        </div>
      </main>
    </div>
  )
}
