export type UserRole = 'USER' | 'MERCHANT' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  phone_number: string;
  full_name: string;
  role: UserRole;
  is_verified: boolean;
  two_factor_enabled: boolean;
  date_joined: string;
}

export interface Profile {
  id: number;
  avatar_url?: string;
  bio?: string;
  kyc_status: 'VERIFIED' | 'PENDING' | 'NOT_SUBMITTED';
  country: string;
  city: string;
  security_score: number;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_email: string;
  user_name: string;
  balance: string;
  currency: string;
  status: 'ACTIVE' | 'FROZEN' | 'RESTRICTED';
  updated_at: string;
}

export interface WalletLedgerItem {
  id: string;
  transaction_type: 'CREDIT' | 'DEBIT';
  amount: string;
  balance_before: string;
  balance_after: string;
  reference_type: string;
  reference_id: string;
  description: string;
  created_at: string;
}

export interface CardToken {
  id: string;
  card_brand: 'VISA' | 'MASTERCARD' | 'RUPAY' | 'AMEX' | 'OTHER';
  cardholder_name: string;
  masked_number: string;
  last_four_digits: string;
  expiry_month: number;
  expiry_year: number;
  is_default: boolean;
  created_at: string;
}

export interface BankAccount {
  id: string;
  account_holder_name: string;
  bank_name: string;
  masked_account_number: string;
  ifsc_code: string;
  account_type: 'SAVINGS' | 'CURRENT';
  is_primary: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface UPIAccount {
  id: string;
  upi_id: string;
  is_primary: boolean;
  qr_payload: string;
  user_name: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  transaction_id: string;
  sender?: string;
  sender_name?: string;
  sender_email?: string;
  receiver?: string;
  receiver_name?: string;
  receiver_email?: string;
  amount: string;
  fee: string;
  currency: string;
  payment_method: 'WALLET' | 'UPI' | 'CARD' | 'NET_BANKING';
  description: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESSFUL' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  reference_id: string;
  failure_reason?: string;
  is_flagged_fraud: boolean;
  fraud_reason?: string;
  created_at: string;
  completed_at?: string;
}

export interface PaymentRequest {
  id: string;
  requester: string;
  requester_name: string;
  payer: string;
  payer_name: string;
  amount: string;
  note: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  expires_at: string;
  created_at: string;
}

export interface Merchant {
  id: string;
  business_name: string;
  business_category: string;
  business_id: string;
  website: string;
  is_verified: boolean;
  created_at: string;
}

export interface PaymentLink {
  id: string;
  link_code: string;
  merchant_name: string;
  title: string;
  description: string;
  amount: string | null;
  currency: string;
  status: 'ACTIVE' | 'PAID' | 'EXPIRED' | 'DISABLED';
  expires_at?: string;
  is_expired: boolean;
  checkout_url: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  notification_type: 'PAYMENT_RECEIVED' | 'PAYMENT_SENT' | 'PAYMENT_REQUEST' | 'REFUND' | 'SECURITY_ALERT' | 'SYSTEM';
  is_read: boolean;
  reference_id: string;
  created_at: string;
}

export interface LoginActivityItem {
  id: number;
  ip_address: string;
  device_name: string;
  status: string;
  timestamp: string;
}

export interface SecurityEventItem {
  id: number;
  event_type: string;
  description: string;
  ip_address: string;
  created_at: string;
}
