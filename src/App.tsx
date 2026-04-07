import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Layout, LogIn, PieChart, Users, Briefcase, Settings, LogOut, Menu, X, Plus, CheckCircle, XCircle, Clock, Eye, Trash2, ShieldAlert } from 'lucide-react';
import { formatCurrency, cn } from './lib/utils';
import { User, Product, Investment, AdminStats } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, to, active }: { icon: any, label: string, to: string, active?: boolean }) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
      active ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <ShieldAlert className="text-white" size={20} />
              </div>
              <span className="text-xl font-bold text-gray-900">Trustline</span>
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">Welcome, <span className="font-semibold">{user.name}</span></span>
                <button onClick={logout} className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700">
                  <LogOut size={18} /> Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-700">Login</Link>
            )}
          </div>
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200"
          >
            <div className="px-4 py-4 space-y-2">
              {user ? (
                <>
                  <p className="text-sm text-gray-600 mb-4">Logged in as {user.name}</p>
                  <button onClick={logout} className="w-full text-left px-4 py-2 text-red-600 font-medium">Logout</button>
                </>
              ) : (
                <Link to="/login" className="block px-4 py-2 text-blue-600 font-medium">Login</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// --- Pages ---

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        navigate(data.user.role === 'client' ? '/dashboard' : '/admin');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to login');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-500 mt-2">Login to your Trustline portal</p>
        </div>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            Sign In
          </button>
        </form>
        <p className="text-center mt-6 text-gray-600 text-sm">
          Don't have an account? <Link to="/register" className="text-blue-600 font-semibold">Register here</Link>
        </p>
      </motion.div>
    </div>
  );
};

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (res.ok) {
        navigate('/login');
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to register');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-500 mt-2">Join Trustline Capital Limited</p>
        </div>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            Register
          </button>
        </form>
        <p className="text-center mt-6 text-gray-600 text-sm">
          Already have an account? <Link to="/login" className="text-blue-600 font-semibold">Login here</Link>
        </p>
      </motion.div>
    </div>
  );
};

const ClientDashboard = () => {
  const { token, user: authUser } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'investments' | 'profile'>('investments');
  const [profileData, setProfileData] = useState({
    name: authUser?.name || '',
    email: authUser?.email || '',
    password: ''
  });
  
  const [formData, setFormData] = useState({
    full_name: authUser?.name || '',
    email: authUser?.email || '',
    confirm_email: '',
    phone: '',
    dob: '',
    gender: 'MALE',
    is_pep: 'NO',
    tax_id: '',
    marital_status: 'SINGLE',
    country: 'Nigeria',
    state: '',
    nin: '',
    bvn: '',
    currency: 'NGN',
    amount: '',
    bank_name: '',
    account_number: '',
    account_name: '',
    duration: '12 Months',
    nok_name: '',
    nok_email: '',
    nok_address: '',
    nok_phone: '',
    realtor_cid: '',
    rep_group: '',
    rep_group_cid: '',
    rep_name: '',
    rep_phone: '',
    rep_email: '',
    payment_date: ''
  });

  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    passport: null,
    id_card: null,
    utility_bill: null,
    signature: null,
    payment_proof: null
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [invRes, prodRes] = await Promise.all([
      fetch('/api/my-investments', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/products')
    ]);
    setInvestments(await invRes.json());
    setProducts(await prodRes.json());
  };

  const handleInvestClick = (product: Product) => {
    setSelectedProduct(product);
    setFormData(prev => ({
      ...prev,
      productId: product.id.toString(),
      duration: product.name === 'REAL ESTATE TREIN' ? '12 Months' : '12 Months'
    }));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.email !== formData.confirm_email) {
      alert("Emails do not match!");
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'confirm_email') {
        data.append(key, value as string);
      }
    });
    
    Object.entries(files).forEach(([key, file]) => {
      if (file) data.append(key, file as Blob);
    });

    const res = await fetch('/api/investments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: data
    });
    if (res.ok) {
      setIsModalOpen(false);
      fetchData();
      alert("Your Investment Application was Submit Successful and Your KYC documnet are under review");
    } else {
      const err = await res.json();
      alert(err.error || "Failed to submit request");
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(profileData)
    });
    if (res.ok) {
      alert("Profile updated successfully!");
      setProfileData(prev => ({ ...prev, password: '' }));
    } else {
      const err = await res.json();
      alert(err.error || "Failed to update profile");
    }
  };

  const totalInvested = investments.reduce((sum, inv) => inv.status === 'approved' ? sum + inv.amount : sum, 0);

  const realtorGroups = [
    "ABN REALTORS GROUP", "BRG", "FORMIDABLE REALTOR NETWORK", 
    "PEAK PERFORMAER BUSINESS NETWORK", "PLATINUM CAPE REALTOR GROUP", 
    "REAL ESTATE MANAGMENT SOCIETY", "REALTOR HOMINS", "TEAM FOCUS REALTORS", 
    "TOP NOTCH REALTOR GROUP", "ULTIMATE VIBRANT GROUP", 
    "VIBRANT GLOBAL REALTORS GROUP", "02 REALTORS"
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Dashboard</h1>
          <p className="text-gray-500">Manage your investments and portfolio</p>
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('investments')}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all",
              activeTab === 'investments' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Investments
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all",
              activeTab === 'profile' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Profile Settings
          </button>
        </div>
      </div>

      {activeTab === 'investments' ? (
        <>
          {/* Products Section */}
          <div className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Available Investment Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products.map(product => (
                <div key={product.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{product.name}</h3>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-blue-600 font-bold">{product.roi} ROI</span>
                    <span className="text-gray-500 text-sm">{product.duration}</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-6">{product.description || 'Secure investment opportunity with competitive returns.'}</p>
                  <button
                    onClick={() => handleInvestClick(product)}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Invest Now
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Total Approved Investments</p>
              <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(totalInvested)}</h3>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Active Products</p>
              <h3 className="text-2xl font-bold text-gray-900">{new Set(investments.filter(i => i.status === 'approved').map(i => i.product_id)).size}</h3>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Pending Requests</p>
              <h3 className="text-2xl font-bold text-gray-900">{investments.filter(i => i.status === 'pending').length}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Investment History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3">Product</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Duration</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {investments.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{inv.product_name}</td>
                      <td className="px-6 py-4 text-gray-600">{inv.currency} {inv.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-600">{inv.duration}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-semibold",
                          inv.status === 'approved' ? "bg-green-100 text-green-700" :
                          inv.status === 'rejected' ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                        )}>
                          {inv.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{new Date(inv.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {investments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No investments found. Start your first one today!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="max-w-2xl bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Settings</h2>
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={profileData.name}
                onChange={e => setProfileData({ ...profileData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={profileData.email}
                onChange={e => setProfileData({ ...profileData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password (leave blank to keep current)</label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={profileData.password}
                onChange={e => setProfileData({ ...profileData, password: e.target.value })}
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all"
            >
              Update Profile
            </button>
          </form>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Investment Application</h3>
                  <p className="text-sm text-blue-600 font-medium">Product: {selectedProduct?.name}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh]">
                {/* Bank Details Notice */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 flex items-start gap-4">
                  <div className="bg-blue-600 p-2 rounded-lg text-white">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900">Official Payment Details</h4>
                    <p className="text-sm text-blue-800 mt-1">Please make your payment to the account below before completing this form.</p>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-blue-500">Bank Name</p>
                        <p className="font-bold text-blue-900">United Bank of Africa (UBA)</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-blue-500">Account Number</p>
                        <p className="font-bold text-blue-900 text-lg">1027571898</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-blue-500">Account Name</p>
                        <p className="font-bold text-blue-900">Trustline UBA NOM</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Info */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 border-b pb-2">Personal Information</h4>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Client's Full Name</label>
                      <input type="text" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                        <input type="email" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm Email</label>
                        <input type="email" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.confirm_email} onChange={e => setFormData({...formData, confirm_email: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                        <input type="tel" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date of Birth</label>
                        <input type="date" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gender</label>
                        <select className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                          <option>MALE</option>
                          <option>FEMALE</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Politically Exposed Person (PEP)?</label>
                        <select className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.is_pep} onChange={e => setFormData({...formData, is_pep: e.target.value})}>
                          <option>NO</option>
                          <option>YES</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Client Tax ID</label>
                        <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.tax_id} onChange={e => setFormData({...formData, tax_id: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Marital Status</label>
                        <select className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.marital_status} onChange={e => setFormData({...formData, marital_status: e.target.value})}>
                          <option>SINGLE</option>
                          <option>MARRIED</option>
                          <option>DIVORCED</option>
                          <option>WIDOWED</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Country</label>
                        <input type="text" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">State</label>
                        <input type="text" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Client NIN</label>
                        <input type="text" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.nin} onChange={e => setFormData({...formData, nin: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Client BVN</label>
                        <input type="text" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.bvn} onChange={e => setFormData({...formData, bvn: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  {/* Investment & Financial */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 border-b pb-2">Investment & Financial Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Currency</label>
                        <select className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})}>
                          <option>NGN</option>
                          <option>USD</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Input Amount</label>
                        <input type="number" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bank Name</label>
                      <input type="text" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.bank_name} onChange={e => setFormData({...formData, bank_name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Number</label>
                        <input type="text" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.account_number} onChange={e => setFormData({...formData, account_number: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Name</label>
                        <input type="text" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.account_name} onChange={e => setFormData({...formData, account_name: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Duration</label>
                      <select 
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                        value={formData.duration} 
                        onChange={e => setFormData({...formData, duration: e.target.value})}
                        disabled={selectedProduct?.name === 'REAL ESTATE TREIN'}
                      >
                        {selectedProduct?.name === 'REAL ESTATE TREIN' ? (
                          <option>12 Months</option>
                        ) : (
                          <>
                            <option>3 Months</option>
                            <option>6 Months</option>
                            <option>12 Months</option>
                          </>
                        )}
                      </select>
                      {selectedProduct?.name === 'REAL ESTATE TREIN' && <p className="text-[10px] text-blue-600 mt-1">Note: Real Estate Trein is fixed at 12 months.</p>}
                    </div>

                    <h4 className="font-bold text-gray-900 border-b pb-2 pt-4">Next of Kin Details</h4>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                      <input type="text" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.nok_name} onChange={e => setFormData({...formData, nok_name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                        <input type="email" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.nok_email} onChange={e => setFormData({...formData, nok_email: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                        <input type="tel" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.nok_phone} onChange={e => setFormData({...formData, nok_phone: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address</label>
                      <input type="text" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.nok_address} onChange={e => setFormData({...formData, nok_address: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* Document Uploads */}
                <div className="mt-8 space-y-4">
                  <h4 className="font-bold text-gray-900 border-b pb-2">Document Uploads</h4>
                  <p className="text-sm text-gray-500">Kindly upload the following documents (Max 5MB each)</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { id: 'passport', label: 'Passport Photograph' },
                      { id: 'id_card', label: 'Valid ID Card' },
                      { id: 'utility_bill', label: 'Utility Bill' },
                      { id: 'signature', label: 'Client Signature' },
                      { id: 'payment_proof', label: 'Evidence of Payment' },
                    ].map(doc => (
                      <div key={doc.id} className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 transition-colors">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{doc.label}</label>
                        <input 
                          type="file" 
                          accept="image/*,.pdf" 
                          className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          onChange={e => setFiles({...files, [doc.id]: e.target.files?.[0] || null})}
                        />
                      </div>
                    ))}
                    <div className="p-4 border border-gray-200 rounded-xl">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Date of Payment</label>
                      <input type="date" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.payment_date} onChange={e => setFormData({...formData, payment_date: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* Realtor Info */}
                <div className="mt-8 space-y-4">
                  <h4 className="font-bold text-gray-900 border-b pb-2">Realtor Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Realtor's CID</label>
                      <input type="text" placeholder="Ensure your CID is correct" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.realtor_cid} onChange={e => setFormData({...formData, realtor_cid: e.target.value})} />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mt-6">
                    <h5 className="font-bold text-gray-900 mb-2 uppercase text-xs">External Realtors Group (REP GROUP)</h5>
                    <p className="text-xs text-gray-500 mb-4">Please fill only if a REP GROUP, otherwise leave blank.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Group</label>
                        <select className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.rep_group} onChange={e => setFormData({...formData, rep_group: e.target.value})}>
                          <option value="">None</option>
                          {realtorGroups.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Enter Your Group CID</label>
                        <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.rep_group_cid} onChange={e => setFormData({...formData, rep_group_cid: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                        <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.rep_name} onChange={e => setFormData({...formData, rep_name: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                          <input type="tel" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.rep_phone} onChange={e => setFormData({...formData, rep_phone: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                          <input type="email" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.rep_email} onChange={e => setFormData({...formData, rep_email: e.target.value})} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] bg-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
                  >
                    Submit Investment Application
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminDashboard = () => {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'investments' | 'products' | 'staff'>('overview');
  const [clients, setClients] = useState<User[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [newFiles, setNewFiles] = useState<{ [key: string]: File | null }>({});
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'crm' as 'admin' | 'crm', permissions: { can_view_clients: true, can_view_investments: true, can_update_status: true, can_edit_clients: false } });

  const canViewClients = user?.role === 'admin' || user?.permissions?.can_view_clients === 1;
  const canViewInvestments = user?.role === 'admin' || user?.permissions?.can_view_investments === 1;
  const canUpdateStatus = user?.role === 'admin' || user?.permissions?.can_update_status === 1;
  const canEditClients = user?.role === 'admin' || user?.permissions?.can_edit_clients === 1;

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const res = await fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } });
    setStats(await res.json());
  };

  const fetchClients = async () => {
    const res = await fetch('/api/admin/clients', { headers: { Authorization: `Bearer ${token}` } });
    setClients(await res.json());
  };

  const fetchInvestments = async () => {
    const res = await fetch('/api/admin/investments', { headers: { Authorization: `Bearer ${token}` } });
    setInvestments(await res.json());
  };

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    setProducts(await res.json());
  };

  const fetchStaff = async () => {
    const res = await fetch('/api/admin/staff', { headers: { Authorization: `Bearer ${token}` } });
    setStaff(await res.json());
  };

  useEffect(() => {
    if (activeTab === 'clients') fetchClients();
    if (activeTab === 'investments') fetchInvestments();
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'staff') fetchStaff();
  }, [activeTab]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newStaff)
    });
    if (res.ok) {
      setShowStaffModal(false);
      fetchStaff();
      setNewStaff({ name: '', email: '', password: '', role: 'crm', permissions: { can_view_clients: true, can_view_investments: true, can_update_status: true, can_edit_clients: false } });
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  const deleteStaff = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;
    const res = await fetch(`/api/admin/staff/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) fetchStaff();
  };

  const updateInvestmentStatus = async (id: number, status: string) => {
    const res = await fetch(`/api/admin/investments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      fetchInvestments();
      if (selectedInvestment?.id === id) {
        setSelectedInvestment(prev => prev ? { ...prev, status: status as any } : null);
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedInvestment) return;
    const formData = new FormData();
    Object.entries(editData).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, value as string);
    });
    Object.entries(newFiles).forEach(([key, file]) => {
      if (file) formData.append(key, file as Blob);
    });

    const res = await fetch(`/api/admin/investments/${selectedInvestment.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    if (res.ok) {
      setIsEditing(false);
      setNewFiles({});
      fetchInvestments();
      // Refresh selected investment
      const updatedRes = await fetch('/api/admin/investments', { headers: { Authorization: `Bearer ${token}` } });
      const allInv = await updatedRes.json();
      const updated = allInv.find((i: any) => i.id === selectedInvestment.id);
      setSelectedInvestment(updated);
      alert("Changes saved successfully!");
    }
  };

  const deleteClient = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    const res = await fetch(`/api/admin/clients/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) fetchClients();
  };

  const DetailItem = ({ label, field, value }: { label: string, field: string, value?: string | number }) => (
    <div>
      <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">{label}</p>
      {isEditing ? (
        <input
          type="text"
          className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
          value={editData[field] ?? value ?? ''}
          onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
        />
      ) : (
        <p className="text-sm font-medium text-gray-900">{value || 'N/A'}</p>
      )}
    </div>
  );

  const DocLink = ({ label, field, url }: { label: string, field: string, url?: string }) => (
    <div className="p-3 border border-gray-100 rounded-lg bg-gray-50 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-gray-600 uppercase">{label}</span>
        <div className="flex gap-2">
          {url && (
            <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs font-bold">
              <Eye size={14} /> VIEW
            </a>
          )}
          {isEditing && (
            <button
              onClick={() => setEditData({ ...editData, [`delete_${field}`]: 'true' })}
              className="text-red-600 hover:text-red-800 text-xs font-bold"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
      {isEditing && (
        <input
          type="file"
          className="text-[10px] w-full"
          onChange={(e) => setNewFiles({ ...newFiles, [field]: e.target.files?.[0] || null })}
        />
      )}
    </div>
  );

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-6 hidden lg:block">
        <div className="space-y-2">
          <div onClick={() => setActiveTab('overview')}><SidebarItem icon={PieChart} label="Overview" to="#" active={activeTab === 'overview'} /></div>
          {canViewClients && <div onClick={() => setActiveTab('clients')}><SidebarItem icon={Users} label="Clients" to="#" active={activeTab === 'clients'} /></div>}
          {canViewInvestments && <div onClick={() => setActiveTab('investments')}><SidebarItem icon={Briefcase} label="Investments" to="#" active={activeTab === 'investments'} /></div>}
          <div onClick={() => setActiveTab('products')}><SidebarItem icon={Settings} label="Products" to="#" active={activeTab === 'products'} /></div>
          {user?.role === 'admin' && (
            <div onClick={() => setActiveTab('staff')}><SidebarItem icon={ShieldAlert} label="Staff" to="#" active={activeTab === 'staff'} /></div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'overview' && stats && (
          <div className="space-y-8">
            <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Total Clients</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.totalClients}</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Total Investments</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.totalInvestments}</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
                <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Pending Tasks</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.recentTransactions.filter(t => t.status === 'pending').length}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Investment Trends (Approved)</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.monthlyData.length > 0 ? stats.monthlyData : [
                    { month: 'No Data', amount: 0 }
                  ]}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Area type="monotone" dataKey="amount" stroke="#2563eb" fillOpacity={1} fill="url(#colorVal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-3">Client</th>
                      <th className="px-6 py-3">Product</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.recentTransactions.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{t.client_name}</td>
                        <td className="px-6 py-4 text-gray-600">{t.product_name}</td>
                        <td className="px-6 py-4 text-gray-600">{formatCurrency(t.amount)}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                            t.status === 'approved' ? "bg-green-100 text-green-700" :
                            t.status === 'rejected' ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                          )}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'clients' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Joined</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clients.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                      <td className="px-6 py-4 text-gray-600">{c.email}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                          c.status === 'active' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 flex gap-2">
                        <button className="text-blue-600 hover:text-blue-800"><Eye size={18} /></button>
                        {user?.role === 'admin' && (
                          <button onClick={() => deleteClient(c.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'investments' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Investment Management</h1>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3">Client</th>
                    <th className="px-6 py-3">Product</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {investments.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{inv.full_name}</td>
                      <td className="px-6 py-4 text-gray-600">{inv.product_name}</td>
                      <td className="px-6 py-4 text-gray-600">{inv.currency} {inv.amount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                          inv.status === 'approved' ? "bg-green-100 text-green-700" :
                          inv.status === 'rejected' ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                        )}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button onClick={() => { setSelectedInvestment(inv); setIsEditing(false); setEditData({}); }} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs font-bold">
                          <Eye size={18} /> VIEW DETAILS
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
              {user?.role === 'admin' && (
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                  <Plus size={20} /> Add Product
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products.map(p => (
                <div key={p.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-gray-900">{p.name}</h3>
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">{p.roi} ROI</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{p.duration} Duration</p>
                  <div className="flex gap-2">
                    <button className="text-sm font-medium text-blue-600 hover:underline">Edit</button>
                    {user?.role === 'admin' && (
                      <button className="text-sm font-medium text-red-600 hover:underline">Delete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
              <button
                onClick={() => setShowStaffModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
              >
                <Plus size={20} /> Add Staff
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Permissions</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {staff.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{s.name}</td>
                      <td className="px-6 py-4 text-gray-600">{s.email}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700">
                          {s.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {s.can_view_clients === 1 && <span className="text-[9px] bg-gray-100 px-1 rounded">Clients</span>}
                          {s.can_view_investments === 1 && <span className="text-[9px] bg-gray-100 px-1 rounded">Investments</span>}
                          {s.can_update_status === 1 && <span className="text-[9px] bg-gray-100 px-1 rounded">Status</span>}
                          {s.can_edit_clients === 1 && <span className="text-[9px] bg-gray-100 px-1 rounded">Edit</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {s.id !== user?.id && (
                          <button onClick={() => deleteStaff(s.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Staff Modal */}
      <AnimatePresence>
        {showStaffModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50" onClick={() => setShowStaffModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Add New Staff</h3>
              <form onSubmit={handleCreateStaff} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                  <input type="text" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                  <input type="email" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                  <input type="password" required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={newStaff.password} onChange={e => setNewStaff({ ...newStaff, password: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
                  <select className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value as any })}>
                    <option value="crm">CRM User</option>
                    <option value="admin">Admin User</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Permissions</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(newStaff.permissions).map(([key, val]) => (
                      <label key={key} className="flex items-center gap-2 text-sm text-gray-600">
                        <input type="checkbox" checked={val} onChange={e => setNewStaff({ ...newStaff, permissions: { ...newStaff.permissions, [key]: e.target.checked } })} />
                        {key.replace(/_/g, ' ').replace('can ', '')}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowStaffModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-bold text-gray-600">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Create Staff</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Investment Detail Modal */}
      <AnimatePresence>
        {selectedInvestment && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedInvestment(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-8 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Investment Details & KYC</h3>
                  <p className="text-sm text-gray-500">Review and modify client information</p>
                </div>
                <div className="flex items-center gap-4">
                  {canEditClients && (
                    !isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-100 transition-all"
                      >
                        Edit Information
                      </button>
                    ) : (
                      <button
                        onClick={handleSaveEdit}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-all"
                      >
                        Save Changes
                      </button>
                    )
                  )}
                  <button onClick={() => setSelectedInvestment(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[80vh]">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Personal & Financial */}
                  <div className="lg:col-span-2 space-y-8">
                    <section>
                      <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest mb-4 border-b border-blue-50 pb-2">Client Information</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                        <DetailItem label="Full Name" field="full_name" value={selectedInvestment.full_name} />
                        <DetailItem label="Email" field="email" value={selectedInvestment.email} />
                        <DetailItem label="Phone" field="phone" value={selectedInvestment.phone} />
                        <DetailItem label="Date of Birth" field="dob" value={selectedInvestment.dob} />
                        <DetailItem label="Gender" field="gender" value={selectedInvestment.gender} />
                        <DetailItem label="PEP Status" field="is_pep" value={selectedInvestment.is_pep} />
                        <DetailItem label="Tax ID" field="tax_id" value={selectedInvestment.tax_id} />
                        <DetailItem label="Marital Status" field="marital_status" value={selectedInvestment.marital_status} />
                        <DetailItem label="Country" field="country" value={selectedInvestment.country} />
                        <DetailItem label="State" field="state" value={selectedInvestment.state} />
                        <DetailItem label="NIN" field="nin" value={selectedInvestment.nin} />
                        <DetailItem label="BVN" field="bvn" value={selectedInvestment.bvn} />
                      </div>
                    </section>

                    <section>
                      <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest mb-4 border-b border-blue-50 pb-2">Investment Details</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                        <DetailItem label="Product" field="product_name" value={selectedInvestment.product_name} />
                        <DetailItem label="Amount" field="amount" value={`${selectedInvestment.currency} ${selectedInvestment.amount.toLocaleString()}`} />
                        <DetailItem label="Duration" field="duration" value={selectedInvestment.duration} />
                        <DetailItem label="Bank Name" field="bank_name" value={selectedInvestment.bank_name} />
                        <DetailItem label="Account Number" field="account_number" value={selectedInvestment.account_number} />
                        <DetailItem label="Account Name" field="account_name" value={selectedInvestment.account_name} />
                        <DetailItem label="Payment Date" field="payment_date" value={selectedInvestment.payment_date} />
                        <DetailItem label="Status" field="status" value={selectedInvestment.status.toUpperCase()} />
                      </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <section>
                        <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest mb-4 border-b border-blue-50 pb-2">Next of Kin</h4>
                        <div className="space-y-4">
                          <DetailItem label="Name" field="nok_name" value={selectedInvestment.nok_name} />
                          <DetailItem label="Email" field="nok_email" value={selectedInvestment.nok_email} />
                          <DetailItem label="Phone" field="nok_phone" value={selectedInvestment.nok_phone} />
                          <DetailItem label="Address" field="nok_address" value={selectedInvestment.nok_address} />
                        </div>
                      </section>
                      <section>
                        <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest mb-4 border-b border-blue-50 pb-2">Realtor Info</h4>
                        <div className="space-y-4">
                          <DetailItem label="Realtor CID" field="realtor_cid" value={selectedInvestment.realtor_cid} />
                          <DetailItem label="REP Group" field="rep_group" value={selectedInvestment.rep_group} />
                          <DetailItem label="Group CID" field="rep_group_cid" value={selectedInvestment.rep_group_cid} />
                          <DetailItem label="REP Name" field="rep_name" value={selectedInvestment.rep_name} />
                        </div>
                      </section>
                    </div>
                  </div>

                  {/* Right Column: Documents & Actions */}
                  <div className="space-y-8">
                    <section>
                      <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest mb-4 border-b border-blue-50 pb-2">KYC Documents</h4>
                      <div className="space-y-3">
                        <DocLink label="Passport Photo" field="passport" url={selectedInvestment.passport_url} />
                        <DocLink label="Valid ID Card" field="id_card" url={selectedInvestment.id_card_url} />
                        <DocLink label="Utility Bill" field="utility_bill" url={selectedInvestment.utility_bill_url} />
                        <DocLink label="Client Signature" field="signature" url={selectedInvestment.signature_url} />
                        <DocLink label="Payment Proof" field="payment_proof" url={selectedInvestment.payment_proof_url} />
                      </div>
                    </section>

                    <section className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                      <h4 className="text-sm font-bold text-gray-900 mb-4">Status Actions</h4>
                      <div className="space-y-3">
                        {canUpdateStatus && selectedInvestment.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => updateInvestmentStatus(selectedInvestment.id, 'approved')}
                              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all"
                            >
                              <CheckCircle size={20} /> Approve Investment
                            </button>
                            <button
                              onClick={() => updateInvestmentStatus(selectedInvestment.id, 'rejected')}
                              className="w-full bg-red-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all"
                            >
                              <XCircle size={20} /> Reject Investment
                            </button>
                          </>
                        ) : (
                          <div className={cn(
                            "p-4 rounded-xl text-center font-bold uppercase tracking-wider",
                            selectedInvestment.status === 'approved' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          )}>
                            Status: {selectedInvestment.status}
                          </div>
                        )}
                        {!canUpdateStatus && selectedInvestment.status === 'pending' && (
                          <div className="p-4 bg-gray-100 text-gray-500 rounded-xl text-center font-bold">
                            No Permission to Update Status
                          </div>
                        )}
                        <button
                          onClick={() => setSelectedInvestment(null)}
                          className="w-full bg-white border border-gray-200 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all"
                        >
                          Close View
                        </button>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Home = () => {
  return (
    <div className="bg-white">
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-6"
            >
              Secure Your Future with <br />
              <span className="text-blue-600">Trustline Capital</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 max-w-2xl mx-auto mb-10"
            >
              Professional asset management and investment solutions tailored for your growth. Join thousands of investors today.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center gap-4"
            >
              <Link to="/register" className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200">
                Start Investing
              </Link>
              <Link to="/login" className="bg-white text-gray-900 border border-gray-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all">
                Client Portal
              </Link>
            </motion.div>
          </div>
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400 rounded-full blur-3xl" />
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Our Investment Products</h2>
            <p className="text-gray-500 mt-2">Choose the best plan for your financial goals</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'FIIN NAIRA NOTE', roi: '15%', duration: '12 Months', desc: 'Stable returns in local currency.' },
              { name: 'FIIN DOLLAR NOTES', roi: '8%', duration: '12 Months', desc: 'Hedge against inflation with USD.' },
              { name: 'REAL ESTATE TREIN', roi: '25%', duration: '24 Months', desc: 'Long-term growth in property assets.' },
            ].map((p, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                  <Briefcase size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{p.name}</h3>
                <p className="text-gray-500 mb-6">{p.desc}</p>
                <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">ROI</p>
                    <p className="text-lg font-bold text-blue-600">{p.roi}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase font-bold">Duration</p>
                    <p className="text-lg font-bold text-gray-900">{p.duration}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const AppContent = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={user ? <Navigate to={user.role === 'client' ? '/dashboard' : '/admin'} /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/dashboard" element={user?.role === 'client' ? <ClientDashboard /> : <Navigate to="/login" />} />
        <Route path="/admin" element={['admin', 'crm'].includes(user?.role || '') ? <AdminDashboard /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
