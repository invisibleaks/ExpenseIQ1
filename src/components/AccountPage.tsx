import React, { useState, useRef, useEffect } from 'react';
import { 
  Brain, 
  Plus, 
  ChevronDown, 
  Calendar, 
  User, 
  Settings, 
  LogOut, 
  Upload, 
  Camera, 
  Mic, 
  Edit3, 
  Search, 
  Filter, 
  MoreHorizontal,
  Check,
  X,
  Eye,
  Trash2,
  Download,
  Tag,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface Expense {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  category?: string;
  paymentMethod?: string;
  source: 'upload' | 'camera' | 'voice' | 'manual';
  confidence?: number;
  status: 'unreviewed' | 'reviewed' | 'flagged';
  receiptUrl?: string;
  notes?: string;
  tags?: string[];
}

interface AccountPageProps {
  onBack: () => void;
  onLogout: () => void;
}

const AccountPage: React.FC<AccountPageProps> = ({ onBack, onLogout }) => {
  // State management
  const [currentView, setCurrentView] = useState<'dashboard' | 'inbox' | 'expenses'>('dashboard');
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [dateRange, setDateRange] = useState('This Month');
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  // Mock data
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: '1',
      merchant: 'Starbucks Coffee',
      amount: 12.50,
      date: '2025-01-15',
      source: 'upload',
      confidence: 95,
      status: 'unreviewed',
      receiptUrl: '/api/receipts/1.jpg'
    },
    {
      id: '2',
      merchant: 'Office Depot',
      amount: 89.99,
      date: '2025-01-14',
      category: 'Office Supplies',
      paymentMethod: 'Credit Card',
      source: 'camera',
      confidence: 88,
      status: 'reviewed',
      tags: ['tax-deductible']
    },
    {
      id: '3',
      merchant: 'Uber',
      amount: 28.75,
      date: '2025-01-13',
      category: 'Travel',
      paymentMethod: 'Credit Card',
      source: 'voice',
      status: 'reviewed'
    }
  ]);

  const categories = ['Meals', 'Travel', 'Office Supplies', 'Software', 'Marketing', 'Other'];
  const paymentMethods = ['Credit Card', 'Debit Card', 'Cash', 'Bank Transfer'];

  // Computed values
  const unreviewedExpenses = expenses.filter(e => e.status === 'unreviewed');
  const reviewedExpenses = expenses.filter(e => e.status === 'reviewed');
  const thisMonthTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const topCategories = ['Meals (35%)', 'Travel (28%)', 'Office (22%)'];

  // File upload handling
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    // Simulate OCR processing
    setTimeout(() => {
      const newExpense: Expense = {
        id: Date.now().toString(),
        merchant: 'New Receipt',
        amount: Math.random() * 100,
        date: new Date().toISOString().split('T')[0],
        source: 'upload',
        confidence: Math.floor(Math.random() * 20) + 80,
        status: 'unreviewed'
      };
      
      setExpenses(prev => [newExpense, ...prev]);
      setIsUploading(false);
    }, 2000);
  };

  // Voice recording
  const handleVoiceRecord = () => {
    setIsRecording(true);
    setTimeout(() => {
      const newExpense: Expense = {
        id: Date.now().toString(),
        merchant: 'Voice Entry',
        amount: Math.random() * 50,
        date: new Date().toISOString().split('T')[0],
        source: 'voice',
        confidence: 75,
        status: 'unreviewed'
      };
      
      setExpenses(prev => [newExpense, ...prev]);
      setIsRecording(false);
    }, 3000);
  };

  // Expense actions
  const acceptExpense = (id: string) => {
    setExpenses(prev => prev.map(e => 
      e.id === id ? { ...e, status: 'reviewed' as const } : e
    ));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Bulk actions
  const handleBulkAccept = () => {
    setExpenses(prev => prev.map(e => 
      selectedExpenses.includes(e.id) ? { ...e, status: 'reviewed' as const } : e
    ));
    setSelectedExpenses([]);
  };

  const handleBulkDelete = () => {
    setExpenses(prev => prev.filter(e => !selectedExpenses.includes(e.id)));
    setSelectedExpenses([]);
  };

  // Filter expenses
  const filteredExpenses = reviewedExpenses.filter(expense => {
    const matchesSearch = expense.merchant.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || expense.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-brand-light-beige">
      {/* Top Bar */}
      <header className="bg-white border-b border-brand-soft-gray/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-brand-dark-teal rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-brand-text-dark">Expense IQ</span>
            </div>

            {/* Center Controls */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Workspace Switcher */}
              <div className="relative">
                <button className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-brand-soft-gray/30 hover:border-brand-muted-teal transition-colors">
                  <span className="text-sm font-medium text-brand-text-dark">My Business</span>
                  <ChevronDown className="w-4 h-4 text-brand-soft-gray" />
                </button>
              </div>

              {/* Date Range Picker */}
              <div className="relative">
                <button className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-brand-soft-gray/30 hover:border-brand-muted-teal transition-colors">
                  <Calendar className="w-4 h-4 text-brand-soft-gray" />
                  <span className="text-sm font-medium text-brand-text-dark">{dateRange}</span>
                  <ChevronDown className="w-4 h-4 text-brand-soft-gray" />
                </button>
              </div>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-brand-soft-gray/10 transition-colors"
              >
                <div className="w-8 h-8 bg-brand-dark-teal rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <ChevronDown className="w-4 h-4 text-brand-soft-gray" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-brand-soft-gray/20 py-2 z-50">
                  <button className="w-full px-4 py-2 text-left text-sm text-brand-text-dark hover:bg-brand-soft-gray/10 flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-brand-text-dark hover:bg-brand-soft-gray/10 flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <hr className="my-2 border-brand-soft-gray/20" />
                  <button
                    onClick={onLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Primary Action Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 space-y-4 sm:space-y-0">
          {/* Add Expense Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAddDropdown(!showAddDropdown)}
              className="bg-brand-dark-teal text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-dark-teal/90 focus:ring-2 focus:ring-brand-dark-teal focus:ring-offset-2 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Expense</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showAddDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-brand-soft-gray/20 py-2 z-50">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 text-left hover:bg-brand-soft-gray/10 flex items-center space-x-3"
                >
                  <Upload className="w-5 h-5 text-brand-dark-teal" />
                  <div>
                    <div className="font-medium text-brand-text-dark">Upload Receipt</div>
                    <div className="text-sm text-brand-text-muted">Drag & drop or click to upload</div>
                  </div>
                </button>
                
                <button className="w-full px-4 py-3 text-left hover:bg-brand-soft-gray/10 flex items-center space-x-3">
                  <Camera className="w-5 h-5 text-brand-dark-teal" />
                  <div>
                    <div className="font-medium text-brand-text-dark">Camera Capture</div>
                    <div className="text-sm text-brand-text-muted">Take photo with camera</div>
                  </div>
                </button>
                
                <button
                  onClick={handleVoiceRecord}
                  disabled={isRecording}
                  className="w-full px-4 py-3 text-left hover:bg-brand-soft-gray/10 flex items-center space-x-3 disabled:opacity-50"
                >
                  <Mic className={`w-5 h-5 text-brand-dark-teal ${isRecording ? 'animate-pulse' : ''}`} />
                  <div>
                    <div className="font-medium text-brand-text-dark">
                      {isRecording ? 'Recording...' : 'Voice Capture'}
                    </div>
                    <div className="text-sm text-brand-text-muted">Press and hold to record</div>
                  </div>
                </button>
                
                <button className="w-full px-4 py-3 text-left hover:bg-brand-soft-gray/10 flex items-center space-x-3">
                  <Edit3 className="w-5 h-5 text-brand-dark-teal" />
                  <div>
                    <div className="font-medium text-brand-text-dark">Manual Entry</div>
                    <div className="text-sm text-brand-text-muted">Enter expense details</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="flex items-center space-x-4">
            <button className="text-brand-muted-teal hover:text-brand-dark-teal font-medium transition-colors">
              Manage Categories
            </button>
            <button className="text-brand-muted-teal hover:text-brand-dark-teal font-medium transition-colors flex items-center space-x-1">
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-brand-soft-gray/10 p-1 rounded-xl w-fit">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              currentView === 'dashboard'
                ? 'bg-white text-brand-dark-teal shadow-sm'
                : 'text-brand-text-muted hover:text-brand-dark-teal'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentView('inbox')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
              currentView === 'inbox'
                ? 'bg-white text-brand-dark-teal shadow-sm'
                : 'text-brand-text-muted hover:text-brand-dark-teal'
            }`}
          >
            <span>Inbox</span>
            {unreviewedExpenses.length > 0 && (
              <span className="bg-brand-dark-teal text-white text-xs px-2 py-1 rounded-full">
                {unreviewedExpenses.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setCurrentView('expenses')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              currentView === 'expenses'
                ? 'bg-white text-brand-dark-teal shadow-sm'
                : 'text-brand-text-muted hover:text-brand-dark-teal'
            }`}
          >
            All Expenses
          </button>
        </div>

        {/* Dashboard View */}
        {currentView === 'dashboard' && (
          <div className="space-y-8">
            {/* Insights Snapshot */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-soft-gray/20">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-brand-dark-teal/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-brand-dark-teal" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-text-dark">This Month</h3>
                    <p className="text-2xl font-bold text-brand-dark-teal">${thisMonthTotal.toFixed(2)}</p>
                  </div>
                </div>
                <p className="text-sm text-brand-text-muted">+12% from last month</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-soft-gray/20">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-brand-dark-teal/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-brand-dark-teal" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-text-dark">Top Categories</h3>
                  </div>
                </div>
                <div className="space-y-1">
                  {topCategories.map((category, index) => (
                    <p key={index} className="text-sm text-brand-text-muted">{category}</p>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-soft-gray/20">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-text-dark">Needs Attention</h3>
                    <p className="text-2xl font-bold text-yellow-600">{unreviewedExpenses.length}</p>
                  </div>
                </div>
                <p className="text-sm text-brand-text-muted">Items awaiting review</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-sm border border-brand-soft-gray/20 p-6">
              <h3 className="text-lg font-semibold text-brand-text-dark mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {expenses.slice(0, 5).map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-brand-dark-teal/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-brand-dark-teal" />
                      </div>
                      <div>
                        <p className="font-medium text-brand-text-dark">{expense.merchant}</p>
                        <p className="text-sm text-brand-text-muted">{expense.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-brand-text-dark">${expense.amount.toFixed(2)}</p>
                      <p className="text-sm text-brand-text-muted capitalize">{expense.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Inbox View */}
        {currentView === 'inbox' && (
          <div className="space-y-6">
            {/* Bulk Actions */}
            {selectedExpenses.length > 0 && (
              <div className="bg-white p-4 rounded-xl shadow-sm border border-brand-soft-gray/20 flex items-center justify-between">
                <span className="text-sm text-brand-text-dark">
                  {selectedExpenses.length} item{selectedExpenses.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleBulkAccept}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Accept All
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    Delete All
                  </button>
                </div>
              </div>
            )}

            {/* Unreviewed Expenses */}
            {unreviewedExpenses.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-brand-soft-gray/20 p-12 text-center">
                <div className="w-16 h-16 bg-brand-dark-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-brand-dark-teal" />
                </div>
                <h3 className="text-lg font-semibold text-brand-text-dark mb-2">All caught up!</h3>
                <p className="text-brand-text-muted">No expenses need your attention right now.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {unreviewedExpenses.map((expense) => (
                  <div key={expense.id} className="bg-white rounded-xl shadow-sm border border-brand-soft-gray/20 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedExpenses.includes(expense.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedExpenses(prev => [...prev, expense.id]);
                            } else {
                              setSelectedExpenses(prev => prev.filter(id => id !== expense.id));
                            }
                          }}
                          className="mt-1 rounded border-brand-soft-gray/50 text-brand-dark-teal focus:ring-brand-dark-teal"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-brand-text-dark">{expense.merchant}</h4>
                            <span className="text-2xl font-bold text-brand-dark-teal">${expense.amount.toFixed(2)}</span>
                            {expense.confidence && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                expense.confidence >= 90 
                                  ? 'bg-green-100 text-green-700'
                                  : expense.confidence >= 70
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {expense.confidence}% confident
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-brand-text-muted mb-4">
                            <span>{expense.date}</span>
                            <span className="capitalize">{expense.source}</span>
                          </div>

                          {/* Quick Edit Fields */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <select className="px-3 py-2 border border-brand-soft-gray/30 rounded-lg focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent">
                              <option value="">Select category</option>
                              {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                            
                            <select className="px-3 py-2 border border-brand-soft-gray/30 rounded-lg focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent">
                              <option value="">Payment method</option>
                              {paymentMethods.map(method => (
                                <option key={method} value={method}>{method}</option>
                              ))}
                            </select>
                            
                            <input
                              type="text"
                              placeholder="Add notes..."
                              className="px-3 py-2 border border-brand-soft-gray/30 rounded-lg focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        {expense.receiptUrl && (
                          <button
                            onClick={() => setShowReceiptPreview(expense.id)}
                            className="p-2 text-brand-muted-teal hover:text-brand-dark-teal hover:bg-brand-soft-gray/10 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => acceptExpense(expense.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          Accept
                        </button>
                        
                        <button className="border border-brand-muted-teal text-brand-muted-teal px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-muted-teal hover:text-white transition-colors">
                          Edit
                        </button>
                        
                        <button
                          onClick={() => deleteExpense(expense.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Expenses Table View */}
        {currentView === 'expenses' && (
          <div className="space-y-6">
            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-brand-soft-gray/20">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-brand-soft-gray" />
                  <input
                    type="text"
                    placeholder="Search expenses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-brand-soft-gray/30 rounded-lg focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent"
                  />
                </div>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-brand-soft-gray/30 rounded-lg focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent"
                >
                  <option value="">All categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                
                <button className="flex items-center space-x-2 px-4 py-2 border border-brand-soft-gray/30 rounded-lg hover:border-brand-muted-teal transition-colors">
                  <Filter className="w-4 h-4" />
                  <span>More Filters</span>
                </button>
              </div>
            </div>

            {/* Expenses Table */}
            <div className="bg-white rounded-xl shadow-sm border border-brand-soft-gray/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-brand-soft-gray/10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-muted uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-muted uppercase tracking-wider">Merchant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-muted uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-muted uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-muted uppercase tracking-wider">Payment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-muted uppercase tracking-wider">Tags</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-muted uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-soft-gray/20">
                    {filteredExpenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-brand-soft-gray/5">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-dark">
                          {expense.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-brand-text-dark">{expense.merchant}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-brand-dark-teal/10 text-brand-dark-teal rounded-full text-xs font-medium">
                            {expense.category || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-brand-text-dark">
                          ${expense.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-muted">
                          {expense.paymentMethod || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {expense.tags?.map(tag => (
                            <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-brand-warm-beige/30 text-brand-dark-teal mr-1">
                              {tag}
                            </span>
                          ))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-muted">
                          <div className="flex items-center space-x-2">
                            {expense.receiptUrl && (
                              <button
                                onClick={() => setShowReceiptPreview(expense.id)}
                                className="text-brand-muted-teal hover:text-brand-dark-teal"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            <button className="text-brand-muted-teal hover:text-brand-dark-teal">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button className="text-brand-soft-gray hover:text-brand-muted-teal">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Receipt Preview Panel */}
      {showReceiptPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-brand-soft-gray/20">
              <h3 className="text-lg font-semibold text-brand-text-dark">Receipt Preview</h3>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-brand-muted-teal hover:text-brand-dark-teal rounded-lg hover:bg-brand-soft-gray/10 transition-colors">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button className="p-2 text-brand-muted-teal hover:text-brand-dark-teal rounded-lg hover:bg-brand-soft-gray/10 transition-colors">
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button className="p-2 text-brand-muted-teal hover:text-brand-dark-teal rounded-lg hover:bg-brand-soft-gray/10 transition-colors">
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowReceiptPreview(null)}
                  className="p-2 text-brand-muted-teal hover:text-brand-dark-teal rounded-lg hover:bg-brand-soft-gray/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 bg-brand-soft-gray/10 flex items-center justify-center min-h-96">
              <div className="text-center">
                <FileText className="w-16 h-16 text-brand-soft-gray mx-auto mb-4" />
                <p className="text-brand-text-muted">Receipt preview would appear here</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="fixed bottom-4 right-4 bg-white rounded-xl shadow-lg border border-brand-soft-gray/20 p-4 z-50">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-dark-teal"></div>
            <div>
              <p className="font-medium text-brand-text-dark">Processing receipt...</p>
              <p className="text-sm text-brand-text-muted">Extracting data with AI</p>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />
    </div>
  );
};

export default AccountPage;