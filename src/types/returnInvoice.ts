import { Invoice, InvoiceSummary } from './invoice'

export type ReturnReason = 'expired' | 'damaged' | 'other'

export interface ReturnReasonOption {
    value: ReturnReason,
    label: string
}

// One line of a saved return. The name and price are copies from the original invoice.
export interface ReturnInvoiceLine {
    return_item_id: number,
    return_id: number,
    invoice_item_id: number,
    item_id: number | null,
    item_name: string,
    unit_price: string,
    quantity: number,
    line_total: string
}

// What the "get all" route returns
export interface ReturnInvoiceSummary {
    return_id: number,
    return_number: number,
    invoice_id: number,
    customer_id: number,
    customer_name: string,
    return_date: string,
    reason: ReturnReason,
    notes: string | null,
    return_total_amount: string,
    createdAt: string,
    updatedAt: string
}

// What the "get one" route returns
export interface ReturnInvoice extends ReturnInvoiceSummary {
    ReturnInvoiceItems: ReturnInvoiceLine[]
}

// One invoice line, with how much of it can still be returned
export interface ReturnableLine {
    invoice_item_id: number,
    item_name: string,
    unit_price: string,
    sold: number,
    left: number
}

export interface ReturnableInvoice {
    invoice: Invoice,
    lines: ReturnableLine[]
}

export interface ReturnFormData {
    invoice_id: string,
    return_date: string,
    reason: ReturnReason,
    notes: string,
    quantities: Record<number, string>
}

export interface ReturnLineData {
    invoice_item_id: number,
    quantity: number
}

// What is sent to the server when editing a return
export interface ReturnUpdateData {
    return_date: string,
    reason: ReturnReason,
    notes: string,
    items: ReturnLineData[]
}

// What is sent to the server when creating a return
export interface ReturnData extends ReturnUpdateData {
    invoice_id: number
}

export interface ReturnFormProps {
    returnForm: ReturnFormData,
    setReturnForm: (returnForm: ReturnFormData) => void,
    invoices: InvoiceSummary[],
    invoiceLabel?: string,      // when set, the invoice is shown as read-only text
    lines: ReturnableLine[],
    linesLoading: boolean,
    linesError: string,
    onSubmit: (returnData: ReturnData) => void,
    saving: boolean,
    submitLabel: string,
    savingLabel: string,
    cancelTo: string
}
