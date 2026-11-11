import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Customer, CustomerData, CustomerFormProps } from '../types/customer'

interface CreateCustomerPopupProps {
  FormComponent: React.ComponentType<CustomerFormProps>,
  onCreated: (customer: Customer) => void,
  onClose: () => void
}

// Creates a customer on top of the current page, so whatever is being typed there is kept
export default function CreateCustomerPopup({ FormComponent, onCreated, onClose }: CreateCustomerPopupProps) {
  const [customer, setCustomer] = useState<CustomerData>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
  })
  const [saving, setSaving] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    popupRef.current?.querySelector('input')?.focus()

    // The page behind must not scroll while the popup is open
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [saving, onClose])

  const handleCreate = async (newCustomer: CustomerData) => {
    setSaving(true)
    try {
      const response = await axios.post<Customer>(`${process.env.REACT_APP_BACKEND_URL}/api/customers/createCustomer`, newCustomer, { withCredentials: true })
      toast.success('Customer created!')
      onCreated(response.data)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not create the customer.')
      console.error(err)
      setSaving(false)
    }
  }

  return (
    <div className="oz-popup-backdrop">
      <div className="oz-popup" role="dialog" aria-modal="true" aria-labelledby="create_customer_title" ref={popupRef}>
        <div className="mb-4">
          <h2 className="oz-page-title" id="create_customer_title">New Customer</h2>
          <p className="oz-eyebrow mb-0">All fields are required except email</p>
        </div>

        <FormComponent
          customer={customer}
          setCustomer={setCustomer}
          onSubmit={handleCreate}
          saving={saving}
          submitLabel="Create Customer"
          savingLabel="Creating..."
          onCancel={onClose}
        />
      </div>
    </div>
  )
}
