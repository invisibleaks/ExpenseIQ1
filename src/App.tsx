import React, { useState, useEffect } from 'react';
import SignUpPage from './components/SignUpPage';
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
  const [currentPage, setCurrentPage] = useState<'home' | 'signup'>('home');
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

  // Show signup page if requested
  if (currentPage === 'signup') {
    return <SignUpPage />;
  }

  return (
<div className={darkMode ? 'dark' : ''}>
  <div className="min-h-screen bg-brand-cream dark:bg-brand-dark-teal transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 dark:bg-brand-dark-teal/90 backdrop-blur-md border-b border-brand-soft-gray/20 dark:border-brand-muted-teal/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-brand-dark-teal dark:bg-white rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white dark:text-brand-dark-teal" />
              </div>
              <span className="text-xl font-bold text-brand-text-dark dark:text-brand-text-light">Expense IQ</span>
            </div>
          
            <div className="hidden sm:flex items-center space-x-6">
              <a href="#features" className="text-brand-text-muted dark:text-brand-soft-gray hover:text-brand-dark-teal dark:hover:text-brand-warm-beige transition-colors">Features</a>
              <a href="#pricing" className="text-brand-text-muted dark:text-brand-soft-gray hover:text-brand-dark-teal dark:hover:text-brand-warm-beige transition-colors">Pricing</a>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-brand-soft-gray/20 dark:bg-brand-muted-teal/50 hover:bg-brand-soft-gray/30 dark:hover:bg-brand-muted-teal/70 transition-colors"
                aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
              >
                {darkMode ? <Sun className="w-4 h-4 text-brand-warm-beige" /> : <Moon className="w-4 h-4 text-brand-dark-teal" />}
              </button>
              <WaitlistButton onClick={openWaitlistModal} size="sm" />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-brand-text-dark dark:text-brand-text-light mb-4 sm:mb-6 leading-tight">
              Stop Drowning in
              <span className="text-brand-text-dark dark:text-brand-text-light block">
                Expense Receipts
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-brand-text-dark dark:text-brand-text-light mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-2">
              <span className="text-brand-text-dark dark:text-brand-text-light">AI-powered expense management that automatically captures, categorizes, and consolidates your business expenses across all accounts.</span>
              <span className="text-brand-dark-teal dark:text-brand-warm-beige font-semibold"> Save 10+ hours every month.</span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8 sm:mb-12">
              <WaitlistButton onClick={openWaitlistModal} size="lg" />
              <button className="border-2 border-brand-soft-gray dark:border-brand-muted-teal text-brand-text-muted dark:text-brand-soft-gray px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold hover:border-brand-dark-teal hover:text-brand-dark-teal dark:hover:border-brand-warm-beige dark:hover:text-brand-warm-beige transition-all flex items-center space-x-2">
                <span>Watch Demo</span>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              </button>
            </div>

         

            
            {/* Trust indicators */}
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-8 items-center justify-center text-sm mb-6 sm:mb-0">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-brand-text-dark dark:text-brand-text-light">No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-brand-text-dark dark:text-brand-text-light">14-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-brand-text-dark dark:text-brand-text-light">Cancel anytime</span>
              </div>
            </div>
            
               {/* Social Proof Badge - Moved to bottom of hero */}
            <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center space-x-2 mb-6 sm:mb-8">
              <div className="flex -space-x-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-brand-dark-teal dark:bg-white border-2 border-white dark:border-brand-dark-teal"></div>
                ))}
              </div>
              <span className="text-sm text-brand-text-dark dark:text-brand-text-light text-center">Trusted by 15,000+ entrepreneurs</span>
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-brand-soft-gray/10 dark:to-brand-muted-teal/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-brand-text-dark dark:text-brand-text-light mb-4">
              See Expense IQ in Action
            </h2>
            <p className="text-lg sm:text-xl text-brand-text-dark dark:text-brand-text-light max-w-2xl mx-auto px-4">
              Watch how our AI transforms chaos into organized, tax-ready expense reports in seconds
            </p>
          </div>
          
          <div className="relative max-w-5xl mx-auto">
            {/* Mock Interface */}
            <div className="bg-white dark:bg-brand-darker-teal rounded-2xl shadow-2xl border border-brand-soft-gray/30 dark:border-brand-muted-teal/50 overflow-hidden">
              {/* Header */}
              <div className="bg-brand-dark-teal p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <span className="text-brand-text-light font-semibold">Expense IQ Dashboard</span>
                </div>
              </div>
              
              {/* Demo Content */}
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  {/* Left: Upload Area */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-brand-text-dark dark:text-brand-text-light">Receipt Processing</h3>
                    <div className="border-2 border-dashed border-brand-warm-beige/50 rounded-xl p-6 sm:p-8 text-center hover:border-brand-warm-beige transition-colors cursor-pointer">
                      <Upload className="w-12 h-12 text-brand-dark-teal dark:text-brand-warm-beige mx-auto mb-4" />
                      <p className="text-brand-text-dark dark:text-brand-text-light mb-2">Drop receipts here or click to upload</p>
                      <p className="text-sm text-brand-text-muted dark:text-brand-soft-gray">Supports photos, PDFs, emails, and bank connections</p>
                    </div>
                    
                    {/* Sample Receipts */}
                    <div className="space-y-3">
                                              {[
                          { name: "Coffee Shop Receipt", amount: "$12.50", category: "Meals", status: "processing" },
                          { name: "Office Supplies", amount: "$89.99", category: "Office", status: "processed" },
                          { name: "Uber Ride", amount: "$28.75", category: "Travel", status: "processed" }
                        ].map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-brand-soft-gray/10 dark:bg-brand-muted-teal/30 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${item.status === 'processing' ? 'bg-brand-warm-beige animate-pulse' : item.category === 'Travel' ? 'bg-blue-500' : 'bg-green-400'}`}></div>
                            <div>
                              <p className="font-medium text-brand-text-dark dark:text-brand-text-light text-sm">{item.name}</p>
                              <p className="text-xs text-brand-text-muted dark:text-brand-soft-gray">{item.category}</p>
                            </div>
                          </div>
                          <span className="font-semibold text-brand-text-dark dark:text-brand-text-light">{item.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Right: Analytics */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-brand-text-dark dark:text-brand-text-light">Monthly Overview</h3>
                    <div className="bg-gradient-to-br from-brand-warm-beige/10 to-brand-dark-teal/10 dark:from-brand-warm-beige/10 dark:to-brand-muted-teal/20 p-6 rounded-xl">
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-brand-dark-teal dark:text-brand-warm-beige">$2,847</p>
                          <p className="text-sm text-brand-text-dark dark:text-brand-text-light">Total Expenses</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-brand-dark-teal dark:text-brand-light-beige">127</p>
                          <p className="text-sm text-brand-text-dark dark:text-brand-text-light">Receipts Processed</p>
                        </div>
                      </div>
                      
                      {/* Mock Chart */}
                      <div className="space-y-2">
                        {[
                          { category: "Meals", amount: 35, color: "bg-brand-warm-beige" },
                          { category: "Travel", amount: 28, color: "bg-blue-500" },
                          { category: "Office", amount: 22, color: "bg-green-500" },
                          { category: "Software", amount: 15, color: "bg-brand-soft-gray" }
                        ].map((item, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="w-16 sm:w-20 text-sm text-brand-text-dark dark:text-brand-text-light">{item.category}</div>
                            <div className="flex-1 bg-brand-soft-gray/30 dark:bg-brand-muted-teal/30 rounded-full h-2">
                              <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.amount}%` }}></div>
                            </div>
                            <div className="text-sm font-medium text-brand-text-dark dark:text-brand-text-light">{item.amount}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-green-700 dark:text-green-300 font-medium">Tax report ready for download</span>
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
            <h2 className="text-4xl font-bold text-brand-text-dark dark:text-brand-text-light mb-4">
              Why Entrepreneurs Choose Expense IQ
            </h2>
            <p className="text-lg sm:text-xl text-brand-text-dark dark:text-brand-text-light max-w-2xl mx-auto px-4">
              Stop losing money to missed deductions and wasted time on manual bookkeeping
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Zap className="w-8 h-8 text-brand-dark-teal dark:text-brand-warm-beige" />,
                title: "10x Faster Processing",
                description: "AI captures and categorizes expenses in seconds, not hours. Upload receipts via photo, email, or bank sync.",
                stat: "Save 10+ hours/month"
              },
              {
                icon: <Brain className="w-8 h-8 text-brand-dark-teal dark:text-brand-warm-beige" />,
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
                icon: <Shield className="w-8 h-8 text-brand-dark-teal dark:text-brand-warm-beige" />,
                title: "Audit-Ready Reports",
                description: "Generate IRS-compliant reports instantly. All receipts stored securely with tamper-proof timestamps.",
                stat: "100% audit protection"
              }
            ].map((benefit, index) => (
              <div key={index} className="group bg-white dark:bg-brand-darker-teal p-8 rounded-2xl shadow-lg border border-brand-soft-gray/30 dark:border-brand-muted-teal/50 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="mb-6 group-hover:scale-110 transition-transform duration-300">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-brand-text-dark dark:text-brand-text-light mb-4">{benefit.title}</h3>
                <p className="text-brand-text-dark dark:text-brand-text-light mb-4 leading-relaxed">{benefit.description}</p>
                <div className="text-sm font-semibold text-brand-dark-teal dark:text-brand-warm-beige">{benefit.stat}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-brand-dark-teal bg-gradient-to-b from-transparent to-brand-soft-gray/10 dark:to-brand-muted-teal/20">

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-brand-text-dark dark:text-brand-text-light mb-4">
              Get Started in Under 5 Minutes
            </h2>
            <p className="text-lg sm:text-xl text-brand-text-dark dark:text-brand-text-light max-w-2xl mx-auto px-4">
              From chaos to organized in four simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                icon: <Link className="w-6 h-6" />,
                title: "Connect Your Accounts",
                description: "Link bank accounts, credit cards and payment apps. Your information is encrypted end to end, not even we can see it"
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
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-brand-soft-gray dark:bg-brand-muted-teal transform translate-x-4"></div>
                )}
                
                <div className="bg-white dark:bg-brand-darker-teal p-6 rounded-2xl shadow-lg border border-brand-soft-gray/30 dark:border-brand-muted-teal/50 relative z-10 h-full flex flex-col">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-brand-dark-teal dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-brand-dark-teal font-bold text-base">
                      {step.step}
                    </div>
                    <div className="w-10 h-10 bg-brand-dark-teal/20 dark:bg-brand-warm-beige/20 rounded-lg flex items-center justify-center text-brand-dark-teal dark:text-brand-warm-beige">
                      <div className="w-6 h-6 flex items-center justify-center">
                        {step.icon}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-brand-text-dark dark:text-brand-text-light mb-3">{step.title}</h3>
                  <p className="text-brand-text-dark dark:text-brand-text-light text-sm leading-relaxed flex-grow">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12 flex justify-center">
            <WaitlistButton onClick={openWaitlistModal} size="lg" />
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-brand-text-dark dark:text-brand-text-light mb-4">
              Loved by 15,000+ Entrepreneurs
            </h2>
            <p className="text-lg sm:text-xl text-brand-text-dark dark:text-brand-text-light px-4">
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
              <div key={index} className="bg-white dark:bg-brand-darker-teal p-8 rounded-2xl shadow-lg border border-brand-soft-gray/30 dark:border-brand-muted-teal/50">
                <div className="flex items-center space-x-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-brand-text-dark dark:text-brand-text-light mb-6 italic leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-brand-dark-teal dark:bg-white rounded-full flex items-center justify-center text-white dark:text-brand-dark-teal font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-brand-text-dark dark:text-brand-text-light">{testimonial.author}</p>
                    <p className="text-sm text-brand-text-dark dark:text-brand-text-light">{testimonial.role}</p>
                    <p className="text-xs text-brand-dark-teal dark:text-brand-warm-beige">{testimonial.business}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-brand-dark-teal bg-gradient-to-b from-transparent to-brand-soft-gray/10 dark:to-brand-muted-teal/20">

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-brand-text-dark dark:text-brand-text-light mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg sm:text-xl text-brand-text-dark dark:text-brand-text-light px-4">
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
              <div key={index} className="bg-white dark:bg-brand-darker-teal border border-brand-soft-gray/30 dark:border-brand-muted-teal/50 rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-brand-soft-gray/10 dark:hover:bg-brand-muted-teal/30 transition-colors"
                >
                  <span className="text-lg font-semibold text-brand-text-dark dark:text-brand-text-light">{faq.question}</span>
                                  <div className="text-brand-dark-teal dark:text-brand-warm-beige">
                  {openFaq === index ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-brand-text-dark dark:text-brand-text-light leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-brand-cream dark:bg-brand-dark-teal">
                  <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-brand-dark-teal dark:text-white mb-6">
              Ready to Reclaim Your Time?
            </h2>
            <p className="text-xl text-brand-text-dark dark:text-brand-text-light font-medium mb-8 max-w-2xl mx-auto">
              Join 15,000+ entrepreneurs who've automated their expense tracking and recovered hours every month.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
              <button
                onClick={openWaitlistModal}
                className="group font-semibold transition-all transform hover:scale-105 focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 flex items-center justify-center space-x-2 rounded-xl bg-brand-dark-teal dark:bg-white text-white dark:text-brand-dark-teal hover:bg-brand-dark-teal/90 dark:hover:bg-white/90 focus:ring-brand-dark-teal dark:focus:ring-white shadow-lg hover:shadow-xl px-8 py-4 text-lg"
                aria-label="Join waitlist for early access to Expense IQ"
              >
                <span>Try It Free</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="text-brand-text-dark dark:text-brand-text-light font-medium text-sm text-center">
                No credit card required • Cancel anytime • Set up in 5 minutes
              </div>
            </div>
            
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-8 items-center justify-center text-brand-text-dark dark:text-brand-text-light">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="font-semibold">14-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="font-semibold">$3,200 average savings</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="font-semibold">10+ hours saved monthly</span>
              </div>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-dark-teal text-brand-text-light py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Logo and Description */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-brand-dark-teal dark:bg-white rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white dark:text-brand-dark-teal" />
                </div>
                <span className="text-2xl font-bold">Expense IQ</span>
              </div>
              <p className="text-brand-text-light/70 mb-6 max-w-md">
                The AI-powered expense management platform that saves entrepreneurs 10+ hours per month and maximizes tax deductions.
              </p>
              <div className="flex space-x-4">
                <Twitter className="w-5 h-5 text-brand-text-light/70 hover:text-brand-warm-beige cursor-pointer transition-colors" />
                <Linkedin className="w-5 h-5 text-brand-text-light/70 hover:text-brand-warm-beige cursor-pointer transition-colors" />
                <Mail className="w-5 h-5 text-brand-text-light/70 hover:text-brand-warm-beige cursor-pointer transition-colors" />
              </div>
            </div>
            
            {/* Product Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-brand-text-light/70">
                <li><a href="#" className="hover:text-brand-warm-beige transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-brand-warm-beige transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-brand-warm-beige transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-brand-warm-beige transition-colors">API</a></li>
              </ul>
            </div>
            
            {/* Support Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-brand-text-light/70">
                <li><a href="#" className="hover:text-brand-warm-beige transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-brand-warm-beige transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-brand-warm-beige transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-brand-warm-beige transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/20 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-brand-text-light/70 text-sm">
                © 2025 Expense IQ. All rights reserved.
              </p>
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 mt-4 md:mt-0">
                <span className="text-sm text-brand-text-light/80">🔒 SOC 2 Type II Compliant</span>
                <span className="text-sm text-brand-text-light/80">🏦 Bank-Level Security</span>
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
    </div>
  );
}

export default App;