import React from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { CustomerFormProps } from '../../../types/customer'

// The fields shared by ObserverCreateCustomer and ObserverEditCustomer
export default function ObserverCustomerForm({ customer, setCustomer, onSubmit, saving, submitLabel, savingLabel, cancelTo, onCancel }: CustomerFormProps) {
  const observerHandleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedCustomer = {
      customer_name: customer.customer_name.trim(),
      customer_email: customer.customer_email.trim(),
      customer_phone: customer.customer_phone.trim(),
      customer_address: customer.customer_address.trim(),
    }

    if (!trimmedCustomer.customer_name || !trimmedCustomer.customer_phone || !trimmedCustomer.customer_address) {
      toast.error('Please fill in name, phone and address')
      return
    }

    onSubmit(trimmedCustomer)
  }

  return (
    <form onSubmit={observerHandleSubmit} className="oz-panel">
      <div className="mb-3">
        <label htmlFor="customer_name" className="form-label">Name</label>
        <input
          type="text"
          id="customer_name"
          className="form-control"
          maxLength={255}
          autoComplete="off"
          value={customer.customer_name}
          onChange={e => setCustomer({ ...customer, customer_name: e.target.value })}
          placeholder="Enter the customer's name"
        />
      </div>

      <div className="mb-3">
        <label htmlFor="customer_email" className="form-label">Email (optional)</label>
        <input
          type="email"
          id="customer_email"
          className="form-control"
          maxLength={255}
          autoComplete="off"
          value={customer.customer_email}
          onChange={e => setCustomer({ ...customer, customer_email: e.target.value })}
          placeholder="Enter the customer's email"
        />
      </div>

      <div className="mb-3">
        <label htmlFor="customer_phone" className="form-label">Phone</label>
        <input
          type="tel"
          id="customer_phone"
          className="form-control"
          maxLength={255}
          autoComplete="off"
          value={customer.customer_phone}
          onChange={e => setCustomer({ ...customer, customer_phone: e.target.value })}
          placeholder="Enter the customer's phone number"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="customer_address" className="form-label">Address</label>
        <input
          type="text"
          id="customer_address"
          className="form-control"
          maxLength={255}
          autoComplete="off"
          value={customer.customer_address}
          onChange={e => setCustomer({ ...customer, customer_address: e.target.value })}
          placeholder="Enter the customer's address"
        />
      </div>

      <div className="d-flex gap-3 pt-2">
        {cancelTo !== undefined ? (
          <Link to={cancelTo} className="btn btn-outline-secondary">
            Cancel
          </Link>
        ) : (
          <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary flex-grow-1" disabled={saving}>
          {saving ? savingLabel : submitLabel}
        </button>
      </div>
    </form>
  )
}
