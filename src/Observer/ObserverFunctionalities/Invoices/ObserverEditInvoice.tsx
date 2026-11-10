import React, { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams } from 'react-router-dom'
import logo from '../../../assets/oz-logo-white.png'
import { Customer } from '../../../types/customer'
import { Item } from '../../../types/item'
import { Invoice, InvoiceData, InvoiceFormData, InvoiceLine, InvoiceLineData, InvoiceUpdateData } from '../../../types/invoice'
import ObserverInvoiceForm from './ObserverInvoiceForm'
import './ObserverInvoices.css'

// Puts lines in the same order so two lists can be compared
const observerDescribeLines = (lines: InvoiceLineData[]) =>
  lines.map(line => `${line.item_id}:${line.quantity}`).sort().join(',')

export default function ObserverEditInvoice() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<InvoiceFormData | null>(null)
  const [savedLines, setSavedLines] = useState<InvoiceLine[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    const observerFetchInvoice = async () => {
      try {
        const [invoiceResponse, customersResponse, itemsResponse] = await Promise.all([
          axios.get<Invoice>(`${process.env.REACT_APP_BACKEND_URL}/api/invoices/getInvoice/${id}`, { withCredentials: true, signal: controller.signal }),
          axios.get<Customer[]>(`${process.env.REACT_APP_BACKEND_URL}/api/customers/getAllCustomers`, { withCredentials: true, signal: controller.signal }),
          axios.get<Item[]>(`${process.env.REACT_APP_BACKEND_URL}/api/items/getItems`, { withCredentials: true, signal: controller.signal }),
        ])
        const loaded = invoiceResponse.data
        setSavedLines(loaded.InvoiceItems)
        setCustomers(customersResponse.data)
        setItems(itemsResponse.data)
        setInvoice({
          customer_id: String(loaded.customer_id),
          invoice_issued_date: loaded.invoice_issued_date,
          lines: loaded.InvoiceItems.map((line, index) => ({
            key: index + 1,
            item_id: line.item_id === null ? '' : String(line.item_id),
            quantity: String(line.quantity),
            ...(line.item_id === null && { saved_name: line.item_name, saved_price: line.unit_price }),
          })),
        })
        setLoading(false)
      } catch (err: any) {
        if (axios.isCancel(err)) return
        setError(err.response?.data?.message || 'Could not load this invoice.')
        setLoading(false)
        console.error(err)
      }
    }

    observerFetchInvoice()
    return () => controller.abort()
  }, [id])

  const observerHandleUpdate = async (updatedInvoice: InvoiceData) => {
    const originalLines = savedLines.map(line => ({ item_id: line.item_id, quantity: line.quantity }))
    const itemsChanged = observerDescribeLines(updatedInvoice.items) !== observerDescribeLines(originalLines)

    // The server matches saved lines by item_id, so it cannot tell two deleted items apart
    // and would save them with the wrong name and price
    if (itemsChanged && savedLines.filter(line => line.item_id === null).length > 1) {
      toast.error('Items cannot be changed: this invoice has more than one deleted item')
      return
    }

    // Items are only sent if they changed, because the server refuses any
    // change of items once an invoice has returns
    const changes: InvoiceUpdateData = {
      customer_id: updatedInvoice.customer_id,
      invoice_issued_date: updatedInvoice.invoice_issued_date,
      ...(itemsChanged && { items: updatedInvoice.items }),
    }

    setSaving(true)
    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/invoices/updateInvoice/${id}`, changes, { withCredentials: true })
      toast.success('Invoice updated!')
      navigate(`/observer/invoices/${id}`, { replace: true })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not update the invoice.')
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
          <Link to={`/observer/invoices/${id}`} className="oz-back-link">&larr; Invoice details</Link>

          <div className="mb-4">
            <h1 className="oz-page-title">Edit Invoice</h1>
            <p className="oz-eyebrow mb-0">Change the customer, date or items</p>
          </div>

          {loading && (
            <div className="oz-spinner spinner-border" role="status">
              <span className="visually-hidden">Loading invoice...</span>
            </div>
          )}

          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          {invoice && (
            <ObserverInvoiceForm
              invoice={invoice}
              setInvoice={setInvoice}
              customers={customers}
              onCustomerCreated={customer => setCustomers(current => [...current, customer])}
              items={items}
              savedLines={savedLines}
              onSubmit={observerHandleUpdate}
              saving={saving}
              submitLabel="Save Changes"
              savingLabel="Saving..."
              cancelTo={`/observer/invoices/${id}`}
            />
          )}
        </div>
      </main>
    </div>
  )
}
