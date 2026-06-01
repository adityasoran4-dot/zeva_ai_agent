import { User } from "./users";

export type UOMStatus = "Active" | "Inactive" | "Allocated";
export type StockLocationStatus = "Active" | "Inactive" | "Allocated";
export type SupplierStatus = "Active" | "Inactive" | "Allocated";
export type PurchaseRecordStatus =
  | "New"
  | "Approved"
  | "Partly_Delivered"
  | "Delivered"
  | "Partly_Invoiced"
  | "Invoiced"
  | "Rejected"
  | "Cancelled"
  | "Deleted"
  | "Converted_To_PO"
  | "Converted_To_PI"
  | "Converted_To_GRN";
export type PurchaseRecordType =
  | "Purchase_Order"
  | "Purchase_Request"
  | "Purchase_Invoice"
  | "GRN_Regular";

export type UOM = {
  _id: string;
  clinicId: string;
  name: string;
  category: string;
  status: UOMStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type StockLocation = {
  _id: string;
  clinicId: string;
  location: string;
  status: StockLocationStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PurchaseRecordItem = {
  _id?: string;
  itemId?: string;
  code?: string;
  name: string;
  description?: string;
  expiryDate?: string;
  quantity: number;
  uom?: string;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
  discountType?: "Fixed" | "Percentage";
  discountAmount?: number;
  netPrice: number;
  vatAmount?: number;
  vatType?: "Exclusive" | "Inclusive";
  vatPercentage?: number;
  netPlusVat?: number;
  freeQuantity?: number;
  freeQuantityExpiryDate?: string;
  level0?: {
    price?: number;
    uom?: string;
  };
  packagingStructure?: {
    level1?: {
      quantity?: number;
      price?: number;
      uom?: string;
    };
    level2?: {
      quantity?: number;
      price?: number;
      uom?: string;
    };
  };
};

export type PurchaseRecord = {
  _id: string;
  clinicId: string;
  orderNo: string;
  branch: any;
  date: string;
  enqNo?: string;
  quotationNo?: string;
  quotationDate?: string;
  validityDays?: string;
  paymentTermsDays?: string;
  supplier: any; // Reference to Supplier
  type: PurchaseRecordType;
  supplierInvoiceNo?: string;
  notes?: string;
  status: PurchaseRecordStatus;
  shipTo?: {
    to?: string;
    address?: string;
    telephone?: string;
    email?: string;
  };
  billTo?: {
    to?: string;
    address?: string;
    telephone?: string;
    email?: string;
  };
  contactInfoOfBuyer?: {
    to?: string;
    address?: string;
    telephone?: string;
    email?: string;
  };
  items: PurchaseRecordItem[];
  createdBy: User;
  createdAt: string;
  updatedAt: string;
};

export type Supplier = {
  _id: string;
  code: string;
  clinicId: string;
  branch: any;
  name: string;
  vatRegNo: string;
  telephone: string;
  mobile: string;
  email: string;
  url: string;
  creditDays: number;
  address: string;
  notes: string;
  status: SupplierStatus;
  openingBalance: number;
  openingBalanceType: "Debit" | "Credit";
  invoiceTotal: number;
  totalPaid: number;
  totalBalance: number;
  invoiceCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};
