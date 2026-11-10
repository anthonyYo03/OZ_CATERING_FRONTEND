export interface CustomerData {
    customer_name: string,
    customer_email: string,
    customer_phone: string,
    customer_address: string
}

export interface Customer extends CustomerData {
    customer_id: number,
    createdAt: string,
    updatedAt: string
}

export interface CustomerFormProps {
    customer: CustomerData,
    setCustomer: (customer: CustomerData) => void,
    onSubmit: (customer: CustomerData) => void,
    saving: boolean,
    submitLabel: string,
    savingLabel: string,
    cancelTo?: string,      // the Cancel link's destination on a full page
    onCancel?: () => void   // what Cancel does when the form is inside a popup
}
