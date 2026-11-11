import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../../assets/oz-logo-white.png'
import { CustomerData } from '../../../types/customer'
import ObserverCustomerForm from './ObserverCustomerForm'
import './ObserverCustomer.css'

export default function ObserverCreateCustomer() {
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<CustomerData>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
  })
  const [saving, setSaving] = useState(false)

  const observerHandleCreate = async (newCustomer: CustomerData) => {
    setSaving(true)
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/customers/createCustomer`, newCustomer, { withCredentials: true })
      toast.success('Customer created!')
      navigate('/observer/customers', { replace: true })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not create the customer.')
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
          <Link to="/observer/customers" className="oz-back-link">&larr; Customers</Link>

          <div className="mb-4">
            <h1 className="oz-page-title">New Customer</h1>
            <p className="oz-eyebrow mb-0">All fields are required except email</p>
          </div>

          <ObserverCustomerForm
            customer={customer}
            setCustomer={setCustomer}
            onSubmit={observerHandleCreate}
            saving={saving}
            submitLabel="Create Customer"
            savingLabel="Creating..."
            cancelTo="/observer/customers"
          />
        </div>
      </main>
    </div>
  )
}
