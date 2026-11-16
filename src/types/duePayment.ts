export type DuePaymentEntryType = 'invoice' | 'return' | 'receipt'

// What the "get all" route returns: one row per customer that still owes money
export interface DuePaymentSummary {
    due_payment_id: number,
    due_number: number,
    customer_id: number,
    customer_name: string,
    balance: number
}

// One invoice, return or receipt of the month, with the total owed after it
export interface DuePaymentRow {
    type: DuePaymentEntryType,
    id: number,
    number: number,
    date: string,
    amount: number,
    total: number
}

// What the "get one" route returns
export interface DuePayment {
    due_payment_id: number,
    due_number: number,
    month: string,              // YYYY-MM
    Customer: {
        customer_id: number,
        customer_name: string,
        customer_address: string,
        customer_phone: string,
        customer_email: string | null
    },
    opening_balance: number,    // still owed at the start of the month
    rows: DuePaymentRow[],
    totals: { invoices: number, returns: number, receipts: number },
    closing_balance: number     // still owed at the end of the month
}
