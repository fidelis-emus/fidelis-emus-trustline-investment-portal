export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'crm' | 'client';
  status: 'active' | 'suspended';
  created_at: string;
  permissions?: {
    can_view_clients: number;
    can_view_investments: number;
    can_update_status: number;
    can_edit_clients: number;
  };
}

export interface Product {
  id: number;
  name: string;
  roi: string;
  duration: string;
  description?: string;
  created_at: string;
}

export interface Investment {
  id: number;
  user_id: number;
  product_id: number;
  
  full_name: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  is_pep: string;
  tax_id?: string;
  marital_status?: string;
  country?: string;
  state?: string;
  nin?: string;
  bvn?: string;
  
  currency: string;
  amount: number;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  duration: string;
  
  nok_name?: string;
  nok_email?: string;
  nok_address?: string;
  nok_phone?: string;
  
  realtor_cid?: string;
  
  rep_group?: string;
  rep_group_cid?: string;
  rep_name?: string;
  rep_phone?: string;
  rep_email?: string;
  
  passport_url?: string;
  id_card_url?: string;
  utility_bill_url?: string;
  signature_url?: string;
  payment_proof_url?: string;
  payment_date?: string;
  
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  client_name?: string;
  product_name?: string;
}

export interface AdminStats {
  totalClients: number;
  totalInvestments: number;
  totalRevenue: number;
  recentTransactions: Investment[];
  monthlyData: { month: string; amount: number }[];
}
