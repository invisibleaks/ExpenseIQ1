import React, { useState, useEffect } from 'react';
import WaitlistModal from './components/WaitlistModal';
import WaitlistButton from './components/WaitlistButton';
import { 
  Brain, 
  Clock, 
  DollarSign, 
  FileText, 
  CheckCircle, 
  ArrowRight, 
  Sun, 
  Moon, 
  Star, 
  Zap, 
  Shield, 
  TrendingUp,
  Camera,
  Link,
  BarChart3,
  Upload,
  Plus,
  Minus,
  ChevronDown,
  Twitter,
  Linkedin,
  Mail
} from 'lucide-react';

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const openWaitlistModal = () => {
    setIsWaitlistModalOpen(true);
  };

  const closeWaitlistModal = () => {
    setIsWaitlistModalOpen(false);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-slate-900' : 'bg-gray-50'}`}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/10 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200/20 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Expense IQ</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <a href="#features" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Features</a>
              <a href="#pricing" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Pricing</a>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-gray-200/50 dark:bg-slate-700/50 hover:bg-gray-300/50 dark:hover:bg-slate-600/50 transition-colors"
                aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
              >
                {darkMode ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>
              <WaitlistButton onClick={openWaitlistModal} size="sm" />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Stop Drowning in
              <span className="bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-400 bg-clip-text text-transparent block">
                Expense Receipts
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              AI-powered expense management that automatically captures, categorizes, and consolidates your business expenses across all accounts. 
              <span className="text-cyan-400 font-semibold"> Save 10+ hours every month.</span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
              <WaitlistButton onClick={openWaitlistModal} size="lg" />
              <button className="border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-xl text-lg font-semibold hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all flex items-center space-x-2">
                <span>Watch Demo</span>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              </button>
            </div>

         

            
            {/* Trust indicators */}
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
               {/* Social Proof Badge - Moved to bottom of hero */}
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600/10 to-cyan-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-8">
              <div className="flex -space-x-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 border-2 border-white dark:border-slate-900"></div>
                ))}
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Trusted by 15,000+ entrepreneurs</span>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Demo Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-purple-50/50 dark:to-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              See Expense IQ in Action
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Watch how our AI transforms chaos into organized, tax-ready expense reports in seconds
            </p>
          </div>
          
          <div className="relative max-w-5xl mx-auto">
            {/* Mock Interface */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-cyan-500 p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <span className="text-white font-semibold">Expense IQ Dashboard</span>
                </div>
              </div>
              
              {/* Demo Content */}
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Upload Area */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Receipt Processing</h3>
                    <div className="border-2 border-dashed border-purple-300 dark:border-purple-500/50 rounded-xl p-8 text-center hover:border-purple-500 transition-colors cursor-pointer">
                      <Upload className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 mb-2">Drop receipts here or click to upload</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">Supports photos, PDFs, emails, and bank connections</p>
                    </div>
                    
                    {/* Sample Receipts */}
                    <div className="space-y-3">
                      {[
                        { name: "Coffee Shop Receipt", amount: "$12.50", category: "Meals", status: "processing" },
                        { name: "Office Supplies", amount: "$89.99", category: "Office", status: "processed" },
                        { name: "Uber Ride", amount: "$28.75", category: "Travel", status: "processed" }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${item.status === 'processing' ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">{item.name}</p>
                              <p className="text-xs text-gray-500">{item.category}</p>
                            </div>
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white">{item.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Right: Analytics */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Overview</h3>
                    <div className="bg-gradient-to-br from-purple-50 to-cyan-50 dark:from-slate-700 dark:to-slate-600 p-6 rounded-xl">
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">$2,847</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-cyan-500">127</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Receipts Processed</p>
                        </div>
                      </div>
                      
                      {/* Mock Chart */}
                      <div className="space-y-2">
                        {[
                          { category: "Meals", amount: 35, color: "bg-purple-500" },
                          { category: "Travel", amount: 28, color: "bg-cyan-500" },
                          { category: "Office", amount: 22, color: "bg-green-500" },
                          { category: "Software", amount: 15, color: "bg-yellow-500" }
                        ].map((item, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="w-20 text-sm text-gray-600 dark:text-gray-400">{item.category}</div>
                            <div className="flex-1 bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                              <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.amount}%` }}></div>
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{item.amount}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-green-800 dark:text-green-400 font-medium">Tax report ready for download</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Entrepreneurs Choose Expense IQ
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Stop losing money to missed deductions and wasted time on manual bookkeeping
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Zap className="w-8 h-8 text-yellow-500" />,
                title: "10x Faster Processing",
                description: "AI captures and categorizes expenses in seconds, not hours. Upload receipts via photo, email, or bank sync.",
                stat: "Save 10+ hours/month"
              },
              {
                icon: <Brain className="w-8 h-8 text-purple-500" />,
                title: "Smart Auto-Categorization",
                description: "Machine learning adapts to your business patterns. 99.2% accuracy in expense classification.",
                stat: "99.2% accuracy rate"
              },
              {
                icon: <TrendingUp className="w-8 h-8 text-green-500" />,
                title: "Maximize Tax Deductions",
                description: "Never miss a deductible expense again. Automatic flagging of tax-saving opportunities.",
                stat: "Average $3,200 more in deductions"
              },
              {
                icon: <Shield className="w-8 h-8 text-cyan-500" />,
                title: "Audit-Ready Reports",
                description: "Generate IRS-compliant reports instantly. All receipts stored securely with tamper-proof timestamps.",
                stat: "100% audit protection"
              }
            ].map((benefit, index) => (
              <div key={index} className="group bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="mb-6 group-hover:scale-110 transition-transform duration-300">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{benefit.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">{benefit.description}</p>
                <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">{benefit.stat}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-50/50 to-transparent dark:from-slate-800/50 dark:to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Get Started in Under 5 Minutes
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              From chaos to organized in four simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                icon: <Link className="w-6 h-6" />,
                title: "Connect Your Accounts",
                description: "Link bank accounts, credit cards, and payment apps. Bank-level security with 256-bit encryption."
              },
              {
                step: "02",
                icon: <Camera className="w-6 h-6" />,
                title: "Capture Expenses",
                description: "Snap photos, forward emails, or let our AI automatically import transactions from connected accounts."
              },
              {
                step: "03",
                icon: <Brain className="w-6 h-6" />,
                title: "AI Categorizes Everything",
                description: "Our AI learns your business patterns and automatically sorts expenses into tax categories."
              },
              {
                step: "04",
                icon: <FileText className="w-6 h-6" />,
                title: "Generate Reports",
                description: "Get tax-ready reports, profit & loss statements, and expense analytics with one click."
              }
            ].map((step, index) => (
              <div key={index} className="relative">
                {/* Connector Line */}
                {index < 3 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-purple-300 to-cyan-300 dark:from-purple-600 dark:to-cyan-600 transform translate-x-4"></div>
                )}
                
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 relative z-10">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {step.step}
                    </div>
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400">
                      {step.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{step.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <WaitlistButton onClick={openWaitlistModal} size="lg" />
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Loved by 15,000+ Entrepreneurs
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              See what business owners are saying about Expense IQ
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "Expense IQ saved me 15 hours per month and found $4,200 in missed deductions last year. The AI is scary accurate at categorizing my freelance expenses.",
                author: "Sarah Chen",
                role: "Freelance Designer",
                business: "3 income streams",
                avatar: "SC"
              },
              {
                quote: "As a consultant traveling constantly, receipt management was my nightmare. Now I just snap photos and everything's organized automatically. Game changer.",
                author: "Marcus Rodriguez",
                role: "Business Consultant",
                business: "6-figure consultancy",
                avatar: "MR"
              },
              {
                quote: "The audit report feature gave me confidence during my IRS review. Everything was perfectly organized and documented. Worth every penny.",
                author: "Jennifer Park",
                role: "E-commerce Owner",
                business: "Online retail business",
                avatar: "JP"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
                <div className="flex items-center space-x-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-6 italic leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{testimonial.author}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">{testimonial.business}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-purple-50/50 dark:to-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Everything you need to know about Expense IQ
            </p>
          </div>
          
          <div className="space-y-4">
            {[
              {
                question: "How accurate is the AI categorization?",
                answer: "Our AI achieves 99.2% accuracy in expense categorization. It learns from your spending patterns and improves over time. You can always manually adjust categories, and the AI will remember your preferences for similar expenses in the future."
              },
              {
                question: "Is my financial data secure?",
                answer: "Absolutely. We use bank-level 256-bit encryption, SOC 2 Type II compliance, and zero-trust architecture. Your data is encrypted both in transit and at rest. We never sell your data and you maintain full ownership of all your information."
              },
              {
                question: "Which banks and credit cards do you support?",
                answer: "We support over 12,000 financial institutions including all major banks, credit unions, and credit cards. We also integrate with PayPal, Stripe, Square, and other payment processors commonly used by entrepreneurs."
              },
              {
                question: "Can I use this for multiple businesses?",
                answer: "Yes! Expense IQ is perfect for entrepreneurs with multiple income streams. You can create separate projects for each business, track expenses across different entities, and generate separate reports for each one."
              },
              {
                question: "What happens to my data if I cancel?",
                answer: "You can export all your data anytime in multiple formats (CSV, PDF, Excel). After cancellation, your data is retained for 90 days to allow for reactivation, then permanently deleted from our servers upon your request."
              },
              {
                question: "Do you offer support for tax preparation?",
                answer: "Yes! We generate IRS-compliant reports and work with major tax software like TurboTax, QuickBooks, and Xero. Many users report saving 5-10 hours during tax season with our organized, categorized expense reports."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">{faq.question}</span>
                  <div className="text-purple-600 dark:text-purple-400">
                    {openFaq === index ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </div>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-900 to-slate-900 dark:from-purple-800 dark:to-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Reclaim Your Time?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Join 15,000+ entrepreneurs who've automated their expense tracking and recovered hours every month.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
            <WaitlistButton onClick={openWaitlistModal} size="lg" className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600" />
            <div className="text-purple-200 text-sm">
              No credit card required • Cancel anytime • Set up in 5 minutes
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-8 text-purple-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              <span>$3,200 average savings</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              <span>10+ hours saved monthly</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Logo and Description */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold">Expense IQ</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                The AI-powered expense management platform that saves entrepreneurs 10+ hours per month and maximizes tax deductions.
              </p>
              <div className="flex space-x-4">
                <Twitter className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
                <Linkedin className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
                <Mail className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              </div>
            </div>
            
            {/* Product Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            {/* Support Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2025 Expense IQ. All rights reserved.
              </p>
              <div className="flex items-center space-x-6 mt-4 md:mt-0">
                <span className="text-sm text-gray-400">🔒 SOC 2 Type II Compliant</span>
                <span className="text-sm text-gray-400">🏦 Bank-Level Security</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Waitlist Modal */}
      <WaitlistModal 
        isOpen={isWaitlistModalOpen} 
        onClose={closeWaitlistModal} 
      />
    </div>
  );
}

export default App;