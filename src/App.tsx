import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login/Login';
import AdminDashboard from './Admin/AdminDashboard';
import GetAllCustomers from './Admin/AdminFunctionalities/Customers/GetAllCustomers';
import GetOneCustomer from './Admin/AdminFunctionalities/Customers/GetOneCustomer';
import CreateCustomer from './Admin/AdminFunctionalities/Customers/CreateCustomer';
import EditCustomer from './Admin/AdminFunctionalities/Customers/EditCustomer';
import GetAllItems from './Admin/AdminFunctionalities/Items/GetAllItems';
import GetOneItem from './Admin/AdminFunctionalities/Items/GetOneItem';
import CreateItem from './Admin/AdminFunctionalities/Items/CreateItem';
import EditItem from './Admin/AdminFunctionalities/Items/EditItem';
import GetAllInvoices from './Admin/AdminFunctionalities/Invoices/GetAllInvoices';
import GetOneInvoices from './Admin/AdminFunctionalities/Invoices/GetOneInvoices';
import CreateInvoice from './Admin/AdminFunctionalities/Invoices/CreateInvoice';
import EditInvoice from './Admin/AdminFunctionalities/Invoices/EditInvoice';
import GetAllReturnInvoices from './Admin/AdminFunctionalities/ReturnInvoices/GetAllReturnInvoices';
import GetOneReturnInvoice from './Admin/AdminFunctionalities/ReturnInvoices/GetOneReturnInvoice';
import CreateReturnInvoices from './Admin/AdminFunctionalities/ReturnInvoices/CreateReturnInvoices';
import EditReturnInvoices from './Admin/AdminFunctionalities/ReturnInvoices/EditReturnInvoices';
import GetSummary from './Admin/AdminFunctionalities/Summary/GetSummary';
import GetProfit from './Admin/AdminFunctionalities/Summary/GetProfit';
import ObserverDashboard from './Observer/ObserverDashboard';
import ObserverGetAllCustomers from './Observer/ObserverFunctionalities/Customers/ObserverGetAllCustomers';
import ObserverGetOneCustomer from './Observer/ObserverFunctionalities/Customers/ObserverGetOneCustomer';
import ObserverCreateCustomer from './Observer/ObserverFunctionalities/Customers/ObserverCreateCustomer';
import ObserverEditCustomer from './Observer/ObserverFunctionalities/Customers/ObserverEditCustomer';
import ObserverGetAllItems from './Observer/ObserverFunctionalities/Items/ObserverGetAllItems';
import ObserverGetOneItem from './Observer/ObserverFunctionalities/Items/ObserverGetOneItem';
import ObserverCreateItem from './Observer/ObserverFunctionalities/Items/ObserverCreateItem';
import ObserverEditItem from './Observer/ObserverFunctionalities/Items/ObserverEditItem';
import ObserverGetAllInvoices from './Observer/ObserverFunctionalities/Invoices/ObserverGetAllInvoices';
import ObserverGetOneInvoices from './Observer/ObserverFunctionalities/Invoices/ObserverGetOneInvoices';
import ObserverCreateInvoice from './Observer/ObserverFunctionalities/Invoices/ObserverCreateInvoice';
import ObserverEditInvoice from './Observer/ObserverFunctionalities/Invoices/ObserverEditInvoice';
import ObserverGetAllReturnInvoices from './Observer/ObserverFunctionalities/ReturnInvoices/ObserverGetAllReturnInvoices';
import ObserverGetOneReturnInvoice from './Observer/ObserverFunctionalities/ReturnInvoices/ObserverGetOneReturnInvoice';
import ObserverCreateReturnInvoices from './Observer/ObserverFunctionalities/ReturnInvoices/ObserverCreateReturnInvoices';
import ObserverEditReturnInvoices from './Observer/ObserverFunctionalities/ReturnInvoices/ObserverEditReturnInvoices';
import ObserverGetSummary from './Observer/ObserverFunctionalities/Summary/ObserverGetSummary';
import ObserverGetProfit from './Observer/ObserverFunctionalities/Summary/ObserverGetProfit';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
     <>
   <BrowserRouter>
      <Toaster position='top-right' />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/adminDashboard" element={<AdminDashboard />} />
        <Route path="/customers" element={<GetAllCustomers />} />
        <Route path="/customers/create" element={<CreateCustomer />} />
        <Route path="/customers/:id" element={<GetOneCustomer />} />
        <Route path="/customers/:id/edit" element={<EditCustomer />} />
        <Route path="/items" element={<GetAllItems />} />
        <Route path="/items/create" element={<CreateItem />} />
        <Route path="/items/:id" element={<GetOneItem />} />
        <Route path="/items/:id/edit" element={<EditItem />} />
        <Route path="/invoices" element={<GetAllInvoices />} />
        <Route path="/invoices/create" element={<CreateInvoice />} />
        <Route path="/invoices/:id" element={<GetOneInvoices />} />
        <Route path="/invoices/:id/edit" element={<EditInvoice />} />
        <Route path="/returns" element={<GetAllReturnInvoices />} />
        <Route path="/returns/create" element={<CreateReturnInvoices />} />
        <Route path="/returns/:id" element={<GetOneReturnInvoice />} />
        <Route path="/returns/:id/edit" element={<EditReturnInvoices />} />
        <Route path="/summary" element={<GetSummary />} />
        <Route path="/summary/profit" element={<GetProfit />} />
        <Route path="/observerDashboard" element={<ObserverDashboard />} />
        <Route path="/observer/customers" element={<ObserverGetAllCustomers />} />
        <Route path="/observer/customers/create" element={<ObserverCreateCustomer />} />
        <Route path="/observer/customers/:id" element={<ObserverGetOneCustomer />} />
        <Route path="/observer/customers/:id/edit" element={<ObserverEditCustomer />} />
        <Route path="/observer/items" element={<ObserverGetAllItems />} />
        <Route path="/observer/items/create" element={<ObserverCreateItem />} />
        <Route path="/observer/items/:id" element={<ObserverGetOneItem />} />
        <Route path="/observer/items/:id/edit" element={<ObserverEditItem />} />
        <Route path="/observer/invoices" element={<ObserverGetAllInvoices />} />
        <Route path="/observer/invoices/create" element={<ObserverCreateInvoice />} />
        <Route path="/observer/invoices/:id" element={<ObserverGetOneInvoices />} />
        <Route path="/observer/invoices/:id/edit" element={<ObserverEditInvoice />} />
        <Route path="/observer/returns" element={<ObserverGetAllReturnInvoices />} />
        <Route path="/observer/returns/create" element={<ObserverCreateReturnInvoices />} />
        <Route path="/observer/returns/:id" element={<ObserverGetOneReturnInvoice />} />
        <Route path="/observer/returns/:id/edit" element={<ObserverEditReturnInvoices />} />
        <Route path="/observer/summary" element={<ObserverGetSummary />} />
        <Route path="/observer/summary/profit" element={<ObserverGetProfit />} />

      </Routes>
    </BrowserRouter>
   </>
  );
}

export default App;
