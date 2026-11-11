import { InvoiceSummary } from './invoice'

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'cheque'

export interface PaymentMethodOption {
    value: PaymentMethod,
    label: string
}

// What the "get all" route returns
export interface ReceiptSummary {
    receipt_id: number,
    receipt_number: number,
    invoice_id: number,
    customer_id: number,
    customer_name: string,
    payment_date: string,
    amount: string,
    payment_method: PaymentMethod,
    notes: string | null,
    createdAt: string,
    updatedAt: string,
    Invoice?: { invoice_number: number, invoice_total_amount: string } | null
}

// What the "get one" route returns
export interface Receipt extends ReceiptSummary {
    Customer?: { customer_email: string | null, customer_phone: string } | null
}

export interface ReceiptFormData {
    invoice_id: string,
    payment_date: string,
    amount: string,
    payment_method: PaymentMethod,
    notes: string
}

// What is sent to the server when editing a receipt
export interface ReceiptUpdateData {
    payment_date: string,
    amount: number,
    payment_method: PaymentMethod,
    notes: string
}

// What is sent to the server when creating a receipt
export interface ReceiptData extends ReceiptUpdateData {
    invoice_id: number
}

export interface ReceiptFormProps {
    receiptForm: ReceiptFormData,
    setReceiptForm: (receiptForm: ReceiptFormData) => void,
    invoices: InvoiceSummary[],
    invoiceLabel?: string,      // when set, the invoice is shown as read-only text
    onSubmit: (receiptData: ReceiptData) => void,
    saving: boolean,
    submitLabel: string,
    savingLabel: string,
    cancelTo: string
}
