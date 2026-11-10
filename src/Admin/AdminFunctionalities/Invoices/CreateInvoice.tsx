import React, { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../../assets/oz-logo-white.png'
import { Customer } from '../../../types/customer'
import { Item } from '../../../types/item'
import { InvoiceData, InvoiceFormData } from '../../../types/invoice'
import InvoiceForm from './InvoiceForm'
import './Invoices.css'

// Today in the user's own timezone, as YYYY-MM-DD
const getToday = () => {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export default function CreateInvoice() {
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<InvoiceFormData>({
    customer_id: '',
    invoice_issued_date: getToday(),
    lines: [{ key: 1, item_id: '', quantity: '1' }],
  })
  const [customers, setCustomers] = useState<Customer[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    const fetchOptions = async () => {
      try {
        const [customersResponse, itemsResponse] = await Promise.all([
          axios.get<Customer[]>(`${process.env.REACT_APP_BACKEND_URL}/api/customers/getAllCustomers`, { withCredentials: true, signal: controller.signal }),
          axios.get<Item[]>(`${process.env.REACT_APP_BACKEND_URL}/api/items/getItems`, { withCredentials: true, signal: controller.signal }),
        ])
        setCustomers(customersResponse.data)
        setItems(itemsResponse.data)
        setLoading(false)
      } catch (err: any) {
        if (axios.isCancel(err)) return
        setError(err.response?.data?.message || 'Could not load customers and items.')
        setLoading(false)
        console.error(err)
      }
    }

    fetchOptions()
    return () => controller.abort()
  }, [])

  const handleCreate = async (newInvoice: InvoiceData) => {
    setSaving(true)
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/invoices/createInvoice`, newInvoice, { withCredentials: true })
      toast.success('Invoice created!')
      navigate('/invoices', { replace: true })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not create the invoice.')
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
        <div className="invoice-page">
          <Link to="/invoices" className="oz-back-link">&larr; Invoices</Link>

          <div className="mb-4">
            <h1 className="oz-page-title">New Invoice</h1>
            <p className="oz-eyebrow mb-0">Choose a customer and add at least one item</p>
          </div>

          {loading && (
            <div className="oz-spinner spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          )}

          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          {!loading && !error && customers.length === 0 && (
            <p className="oz-empty-state">You need a customer first. <Link to="/customers/create">Add a customer</Link></p>
          )}

          {!loading && !error && customers.length > 0 && items.length === 0 && (
            <p className="oz-empty-state">You need an item first. <Link to="/items/create">Add an item</Link></p>
          )}

          {!loading && !error && customers.length > 0 && items.length > 0 && (
            <InvoiceForm
              invoice={invoice}
              setInvoice={setInvoice}
              customers={customers}
              onCustomerCreated={customer => setCustomers(current => [...current, customer])}
              items={items}
              savedLines={[]}
              onSubmit={handleCreate}
              saving={saving}
              submitLabel="Create Invoice"
              savingLabel="Creating..."
              cancelTo="/invoices"
            />
          )}
        </div>
      </main>
    </div>
  )
}
