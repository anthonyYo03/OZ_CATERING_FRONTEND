import { Customer } from './customer'
import { Item } from './item'

// One line of a saved invoice. The name and price are copies from the day it was sold.
// item_id is null if the item was later deleted from the catalog.
export interface InvoiceLine {
    invoice_item_id: number,
    invoice_id: number,
    item_id: number | null,
    item_name: string,
    unit_price: string,
    quantity: number,
    line_total: string
}

// What the "get all" route returns
export interface InvoiceSummary {
    invoice_id: number,
    invoice_number: number,
    customer_id: number,
    customer_name: string,
    invoice_issued_date: string,
    invoice_total_amount: string,
    createdAt: string,
    updatedAt: string
}

// What the "get one" route returns
export interface Invoice extends InvoiceSummary {
    InvoiceItems: InvoiceLine[],
    Customer?: { customer_email: string | null, customer_phone: string } | null
}

// One line while it is being typed in the form
export interface InvoiceLineInput {
    key: number,
    item_id: string,
    quantity: string,
    saved_name?: string,   // only set on a line whose item was deleted from the catalog
    saved_price?: string   // only set on a line whose item was deleted from the catalog
}

export interface InvoiceFormData {
    customer_id: string,
    invoice_issued_date: string,
    lines: InvoiceLineInput[]
}

export interface InvoiceLineData {
    item_id: number | null,
    quantity: number
}

// What is sent to the server when creating an invoice
export interface InvoiceData {
    customer_id: number,
    invoice_issued_date: string,
    items: InvoiceLineData[]
}

// What is sent to the server when editing an invoice. items is left out if they did not change.
export interface InvoiceUpdateData {
    customer_id: number,
    invoice_issued_date: string,
    items?: InvoiceLineData[]
}

export interface InvoiceFormProps {
    invoice: InvoiceFormData,
    setInvoice: (invoice: InvoiceFormData) => void,
    customers: Customer[],
    onCustomerCreated: (customer: Customer) => void,
    items: Item[],
    savedLines: InvoiceLine[],
    onSubmit: (invoice: InvoiceData) => void,
    saving: boolean,
    submitLabel: string,
    savingLabel: string,
    cancelTo: string
}
