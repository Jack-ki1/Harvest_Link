import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowRight, ArrowUpRight, BadgeCheck, Check, CheckCircle2,
  ChevronDown, CircleHelp, ClipboardList, Handshake, Leaf, ListFilter, LoaderCircle,
  LogIn, Menu, PackageCheck, Plus, Search, ShieldCheck, ShoppingBasket, ShoppingCart,
  Smartphone, Sprout, Store, Truck, Users, Wheat, X, MapPin, Phone, Mail, Send,
  BarChart3, Building2, UserRound, KeyRound, Eye, EyeOff, CircleCheck, ChevronRight,
} from 'lucide-react'
import {
  createBuyerDemand, createFarmerOffer, createProduct, createQuote, getBuyerDemands, getMyOffers, getMyQuotes, getProducts, getSavedDemoUser,
  isDemoMode, signInOrSignUp, signOutUser, starterProducts,
} from './lib/backend'
import './styles.css'

const categories = [
  { name: 'All produce', icon: '🌱', filter: 'All' },
  { name: 'Vegetables', icon: '🥬', filter: 'Vegetables' },
  { name: 'Fruits', icon: '🥭', filter: 'Fruits' },
  { name: 'Leafy greens', icon: '🌿', filter: 'Leafy greens' },
  { name: 'Roots & tubers', icon: '🥕', filter: 'Roots & tubers' },
]
const productFallbackImages = {
  Vegetables: starterProducts[0].image,
  Fruits: starterProducts[2].image,
  'Leafy greens': starterProducts[1].image,
  'Roots & tubers': starterProducts[4].image,
}

function App() {
  const [products, setProducts] = useState(isDemoMode ? starterProducts : [])
  const [user, setUser] = useState(null)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('featured')
  const [dialog, setDialog] = useState(null)
  const [activeProduct, setActiveProduct] = useState(null)
  const [notice, setNotice] = useState(null)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [quotes, setQuotes] = useState([])
  const [demands, setDemands] = useState([])
  const [offers, setOffers] = useState([])
  const [activeDemand, setActiveDemand] = useState(null)
  const [loadingDemands, setLoadingDemands] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [cart, setCart] = useState([])

  const refreshProducts = useCallback(async () => {
    setLoadingProducts(true)
    try { setProducts(await getProducts()) } catch (error) { console.error(error); setProducts([]); setNotice({ type: 'error', text: 'Could not load live produce. Check the Supabase schema and access policies.' }) }
    finally { setLoadingProducts(false) }
  }, [])

  const refreshDemands = useCallback(async () => {
    setLoadingDemands(true)
    try { setDemands(await getBuyerDemands(user)) } catch (error) { console.warn('Could not load buyer demand board', error); setDemands([]); setNotice({ type: 'error', text: 'Could not load buyer requests. Check Supabase setup and access policies.' }) }
    finally { setLoadingDemands(false) }
  }, [user])

  useEffect(() => {
    refreshProducts()
    getSavedDemoUser().then(setUser).catch(console.error)
  }, [refreshProducts])

  useEffect(() => { refreshDemands() }, [refreshDemands])

  useEffect(() => {
    const onShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        document.getElementById('produce-search')?.focus()
      }
    }
    window.addEventListener('keydown', onShortcut)
    return () => window.removeEventListener('keydown', onShortcut)
  }, [])

  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(null), 4200)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    if (dialog?.type === 'dashboard' && user) {
      Promise.all([getMyQuotes(user), getMyOffers(user)]).then(([newQuotes, newOffers]) => { setQuotes(newQuotes); setOffers(newOffers) }).catch((error) => setNotice({ type: 'error', text: error.message || 'Could not load workspace data.' }))
    }
  }, [dialog, user])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    const result = products.filter((product) => {
      const categoryMatches = category === 'All' || product.category === category
      const textMatches = !query || [product.name, product.category, product.location, product.description].join(' ').toLowerCase().includes(query)
      return categoryMatches && textMatches
    })
    if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name))
    if (sort === 'location') result.sort((a, b) => (a.location || '').localeCompare(b.location || ''))
    if (sort === 'featured') result.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
    return result
  }, [products, search, category, sort])

  const openDialog = (type, extra = {}) => setDialog({ type, ...extra })
  const toast = (text, type = 'success') => setNotice({ text, type })

  const handleAuthSubmit = async (formData) => {
    setSubmitting(true)
    try {
      const result = await signInOrSignUp(formData)
      if (result.confirmationRequired) {
        setDialog(null)
        toast('Account created. Check your email to confirm it, then sign in.', 'success')
        return
      }
      setUser(result.user)
      setDialog(null)
      toast(`${formData.mode === 'signup' ? 'Welcome to HarvestLink' : 'You are signed in'}, ${result.user.name}.`)
    } catch (error) {
      toast(error.message || 'Could not sign you in. Check your details and try again.', 'error')
    } finally { setSubmitting(false) }
  }

  const handleQuoteSubmit = async (formData) => {
    setSubmitting(true)
    try {
      const requestedProducts = dialog?.type === 'cart' && cart.length ? cart : [activeProduct]
      const createdQuotes = []
      for (const product of requestedProducts) {
        createdQuotes.push(await createQuote({ user, product, ...formData }))
      }
      setQuotes((old) => [...createdQuotes, ...old])
      setDialog(null)
      setCart([])
      toast(`${createdQuotes.length > 1 ? `${createdQuotes.length} requests sent` : 'Request sent'}. Reference: ${createdQuotes[0].id}. ${isDemoMode ? 'Saved in this browser demo.' : 'You can follow it in your dashboard.'}`)
    } catch (error) {
      toast(error.message || 'Could not submit request.', 'error')
    } finally { setSubmitting(false) }
  }

  const handleProductSubmit = async (formData) => {
    if (!user) { openDialog('auth', { mode: 'signup', role: 'farmer' }); toast('Create a farmer profile to publish your harvest.', 'info'); return }
    if (user.role !== 'farmer') { toast('Switch to a farmer account to list produce.', 'error'); return }
    setSubmitting(true)
    try {
      await createProduct({ user, ...formData })
      await refreshProducts()
      setDialog(null)
      toast('Your produce listing has been added. Confirm availability before accepting orders.')
    } catch (error) {
      toast(error.message || 'Could not publish listing.', 'error')
    } finally { setSubmitting(false) }
  }

  const logout = async () => {
    try { await signOutUser(); setUser(null); setDialog(null); toast('You have signed out.') }
    catch (error) { toast(error.message || 'Could not sign out.', 'error') }
  }

  const askForQuote = (product) => {
    if (!isDemoMode && !user) { openDialog('auth', { mode: 'signup', role: 'buyer' }); toast('Create a buyer account before sending a live quote request.', 'info'); return }
    setActiveProduct(product || null)
    openDialog('quote', { product: product || null })
  }
  const startFarmer = () => {
    if (user?.role === 'farmer') { openDialog('add-product'); return }
    if (user) { toast('This account is set up as a buyer. Sign out and create a separate farmer account to list harvest.', 'info'); return }
    openDialog('auth', { mode: 'signup', role: 'farmer' })
  }
  const chooseBuyerPlan = (plan) => {
    if (!user) { openDialog('auth', { mode: 'signup', role: 'buyer', plan }); return }
    if (user.role === 'buyer' || user.role === 'institution') { openDialog('contact', { subject: `${plan} pilot enquiry` }); return }
    toast('A farmer account cannot subscribe to buyer tools. Use a buyer account for this plan.', 'info')
  }
  const startDemand = () => {
    if (user?.role === 'buyer' || user?.role === 'institution') { openDialog('demand'); return }
    if (user?.role === 'farmer') { document.getElementById('demand-board')?.scrollIntoView({ behavior: 'smooth' }); toast('This account is set up as a farmer. You can respond to open buyer requests below.', 'info'); return }
    openDialog('auth', { mode: 'signup', role: 'buyer' })
  }
  const respondToDemand = (demand) => {
    if (!user) { openDialog('auth', { mode: 'signup', role: 'farmer' }); return }
    if (user.role !== 'farmer') { toast('Use a farmer account to offer supply on a buyer request.', 'info'); return }
    setActiveDemand(demand)
    openDialog('offer', { demand })
  }
  const handleDemandSubmit = async (formData) => {
    setSubmitting(true)
    try {
      const demand = await createBuyerDemand({ user, ...formData })
      setDemands((old) => [demand, ...old])
      setDialog(null)
      toast(`Buyer request posted: ${demand.id}. ${isDemoMode ? 'Visible in this browser demo only.' : 'Farmers can now review the open request.'}`)
    } catch (error) { toast(error.message || 'Could not post buyer demand.', 'error') }
    finally { setSubmitting(false) }
  }
  const handleOfferSubmit = async (formData) => {
    setSubmitting(true)
    try {
      const offer = await createFarmerOffer({ user, demand: activeDemand, ...formData })
      setOffers((old) => [offer, ...old])
      setDialog(null)
      toast(`Supply offer submitted for ${activeDemand?.productName || 'buyer demand'}.`)
    } catch (error) { toast(error.message || 'Could not submit supply offer.', 'error') }
    finally { setSubmitting(false) }
  }
  const addToCart = (product) => {
    if (cart.some((p) => p.id === product.id)) {
      setCart((current) => current.filter((p) => p.id !== product.id))
      toast(`${product.name} removed from your request list.`, 'info')
    } else {
      setCart((current) => [...current, product])
      toast(`${product.name} added to your request list.`)
    }
  }

  return (
    <>
      <div className="utility-bar">
        <div className="wrap utility-inner">
          <span><Leaf size={13} /> Better markets. Fairer harvests.</span>
          <div><MapPin size={13} /><span>Kenya · Pilot corridor to Nairobi</span><span className="utility-divider">|</span><span>KES ▾</span></div>
        </div>
      </div>
      <header className="site-header">
        <div className="wrap nav-inner">
          <a className="brand" href="#home" aria-label="HarvestLink home" onClick={() => setMobileMenu(false)}>
            <span className="brand-mark"><Sprout size={25} strokeWidth={2.4} /></span>
            <span className="brand-name">Harvest<span>Link</span><small>Better markets for every harvest.</small></span>
          </a>
          <button className="mobile-menu-toggle icon-button" aria-label="Open navigation" onClick={() => setMobileMenu(!mobileMenu)}><Menu size={22} /></button>
          <nav className={`main-nav ${mobileMenu ? 'nav-open' : ''}`}>
            <a href="#marketplace" onClick={() => setMobileMenu(false)}>Find Produce</a>
            <a href="#how-it-works" onClick={() => setMobileMenu(false)}>How It Works</a>
            <a href="#farmers" onClick={() => setMobileMenu(false)}>For Farmers</a>
            <a href="#buyers" onClick={() => setMobileMenu(false)}>For Buyers</a>
            <a href="#plans" onClick={() => setMobileMenu(false)}>Plans</a>
          </nav>
          <div className="nav-actions">
            <button className="nav-search" onClick={() => document.getElementById('produce-search')?.focus()} aria-label="Focus produce search"><Search size={17} /></button>
            {user ? <button className="btn btn-outline btn-small" onClick={() => openDialog('dashboard')}><UserRound size={15} /> My account</button> : <button className="btn btn-outline btn-small" onClick={() => openDialog('auth', { mode: 'signin' })}>Sign in</button>}
            <button className="btn btn-primary btn-small" onClick={() => user ? (user.role === 'farmer' ? openDialog('add-product') : openDialog('dashboard')) : openDialog('auth', { mode: 'signup', role: 'buyer' })}>{user ? 'My workspace' : 'Join HarvestLink'} <ArrowUpRight size={15} /></button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-photo" />
          <div className="hero-shade" />
          <div className="wrap hero-inner">
            <div className="hero-copy">
              <div className="eyebrow eyebrow-light"><span className="eyebrow-dot" /> A fairer way to trade fresh produce</div>
              <h1>Good produce<br />deserves a <em>better</em><br />market.</h1>
              <p>Connect Kenyan smallholder farmers with reliable buyers through transparent orders, grouped supply and dependable delivery.</p>
              <div className="hero-buttons">
                <a className="btn btn-lime" href="#marketplace">Explore fresh produce <ArrowRight size={17} /></a>
                <button className="btn btn-glass" onClick={startFarmer}>Sell your harvest <Sprout size={17} /></button>
              </div>
              <div className="hero-pills">
                <span><Smartphone size={15} /> Smartphone + USSD access</span>
                <span><ShieldCheck size={15} /> Transparent order terms</span>
                <span><Handshake size={15} /> Local supply, grouped smartly</span>
              </div>
            </div>
            <div className="hero-side-note">
              <div className="floating-produce-icon"><ShoppingBasket size={27} /></div>
              <div className="floating-line" />
              <div className="floating-buyer-icon"><Store size={28} /></div>
              <div className="floating-caption caption-one">Harvest-ready produce</div>
              <div className="floating-caption caption-two">Buyers with real demand</div>
            </div>
            <div className="hero-note"><span className="note-icon"><Check size={15} /></span><span><b>Demand before dispatch</b><small>Availability is reconfirmed before an order is accepted.</small></span></div>
          </div>
        </section>

        <section className="proof-strip">
          <div className="wrap proof-inner">
            <div><span className="proof-icon"><Leaf size={20} /></span><span><b>Buyer-first demand</b><small>Orders set the signal</small></span></div>
            <div><span className="proof-icon"><ShieldCheck size={21} /></span><span><b>Verified supply</b><small>Availability checked</small></span></div>
            <div><span className="proof-icon"><ScaleIcon /></span><span><b>Clear weights & grades</b><small>Agreed before dispatch</small></span></div>
            <div><span className="proof-icon"><ClipboardList size={20} /></span><span><b>Order & payment records</b><small>One clear paper trail</small></span></div>
          </div>
        </section>

        <section className="market-section section-pad" id="marketplace">
          <div className="wrap">
            <SectionHeading overline="A marketplace for fresh, local food" title="Find produce for your next order" subtitle="Explore sample listings. Final quantities, quality grade and price are confirmed with suppliers before dispatch." />
            <div className="category-row" role="tablist" aria-label="Filter produce by category">
              {categories.map((item) => <button key={item.filter} className={`category-chip ${category === item.filter ? 'selected' : ''}`} role="tab" aria-selected={category === item.filter} onClick={() => setCategory(item.filter)}><span>{item.icon}</span>{item.name}</button>)}
            </div>
            <div className="market-tools">
              <div className="result-count">{loadingProducts ? 'Loading listings…' : <><b>{filteredProducts.length}</b> produce listings <span>·</span> pilot supply network</>}</div>
              <div className="market-controls">
                <label className="search-field" htmlFor="produce-search"><Search size={18} /><input id="produce-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tomatoes, avocados, banana..." /><kbd>⌘ K</kbd></label>
                <label className="sort-field"><ListFilter size={15} /><span className="sr-only">Sort listings</span><select value={sort} onChange={(e) => setSort(e.target.value)}><option value="featured">Featured</option><option value="name">Name A–Z</option><option value="location">Location</option></select><ChevronDown size={14} /></label>
              </div>
            </div>
            <div className="product-grid">
              {filteredProducts.map((product) => <ProductCard key={product.id} product={product} onQuote={() => askForQuote(product)} onAdd={() => addToCart(product)} isInCart={cart.some((p) => p.id === product.id)} />)}
              {!loadingProducts && filteredProducts.length === 0 && <div className="empty-state"><Search size={30} /><h3>{products.length ? 'No matching produce' : 'No live produce listings yet'}</h3><p>{products.length ? 'Try another name or category, or clear your search.' : isDemoMode ? 'Try another search or reset filters to browse the sample listings.' : 'The live marketplace is waiting for farmers to publish their first listings.'}</p><button className="btn btn-outline" onClick={() => { if (products.length) { setSearch(''); setCategory('All') } else startFarmer() }}>{products.length ? 'Clear filters' : 'List harvest'}</button></div>}
            </div>
            <div className="market-bottom"><span><ShieldCheck size={17} /> Availability is confirmed before you commit.</span><button className="text-link" onClick={() => { setCategory('All'); setSearch('') }}>View all produce <ArrowRight size={16} /></button></div>
          </div>
        </section>

        <section className="buyer-banner wrap" id="buyers">
          <div className="buyer-banner-image" role="img" aria-label="Chef preparing fresh produce" />
          <div className="buyer-banner-copy"><div className="eyebrow"><span className="eyebrow-dot" /> For commercial buyers</div><h2>Buying for a restaurant, shop<br className="desktop-br" /> or institution?</h2><p>Post your weekly quantities, quality grade and delivery window. We help match demand to grouped local supply.</p><button className="btn btn-orange" onClick={startDemand}>Post a buyer request <ArrowRight size={16} /></button></div>
          <div className="buyer-types"><div><UtensilsIcon /><span>Restaurants</span></div><div><Store size={22} /><span>Retailers</span></div><div><ChefHatIcon /><span>Caterers</span></div><div><Building2 size={22} /><span>Institutions</span></div></div>
        </section>

        <section className="demand-board section-pad" id="demand-board">
          <div className="wrap">
            <div className="demand-board-heading"><SectionHeading overline="Demand-led sourcing" title="Buyer requests, ready for farmer supply" subtitle="Buyers post specific requirements; farmers can review open requests and propose available quantities and prices." /><button className="btn btn-primary" onClick={startDemand}><Plus size={16} /> Post a buyer request</button></div>
            {loadingDemands ? <div className="demand-board-empty"><LoaderCircle className="spin" size={24} /><p>Loading buyer requests…</p></div> : demands.length ? <div className="demand-grid">{demands.map((demand) => <DemandCard key={demand.id} demand={demand} user={user} onOffer={() => respondToDemand(demand)} />)}</div> : <div className="demand-board-empty"><span className="demand-empty-icon"><ClipboardList size={24} /></span><h3>No open buyer requests yet</h3><p>This board will show actual customer demand as pilot buyers post their needs. No sample orders are shown as if they were real.</p><button className="btn btn-outline-green" onClick={startDemand}>Post the first request <ArrowRight size={15} /></button></div>}
          </div>
        </section>

        <section className="how-section section-pad" id="how-it-works">
          <div className="wrap">
            <SectionHeading overline="Simple. Transparent. Reliable." title="How HarvestLink works" subtitle="Make the order clear first. Then coordinate supply, quality and delivery around it." />
            <div className="steps-grid">
              <Step number="01" icon={<ClipboardList size={27} />} title="Share demand" text="Buyers post quantity, grade and delivery window." />
              <div className="step-arrow"><ArrowRight size={18} /></div>
              <Step number="02" icon={<Wheat size={27} />} title="Match supply" text="Farmers share harvest availability by app or USSD." />
              <div className="step-arrow"><ArrowRight size={18} /></div>
              <Step number="03" icon={<ScaleIcon size={28} />} title="Weigh & verify" text="Agreed grade, clear weights and collection records." />
              <div className="step-arrow"><ArrowRight size={18} /></div>
              <Step number="04" icon={<Truck size={28} />} title="Deliver & settle" text="Delivery evidence and transparent payment records." />
            </div>
            <div className="process-footnote"><CircleHelp size={15} /> HarvestLink coordinates matches and records; delivery and payment terms are agreed explicitly per order.</div>
          </div>
        </section>

        <section className="ussd-section" id="ussd">
          <div className="ussd-leaves leaf-left"><Leaf size={95} /></div><div className="ussd-leaves leaf-right"><Sprout size={120} /></div>
          <div className="wrap ussd-inner">
            <div className="ussd-copy"><div className="eyebrow eyebrow-light"><Smartphone size={15} /> Built for every farmer</div><h2>No smartphone?<br /><em>You still belong.</em></h2><p>Farmers without smartphones can use a simple USSD menu or SMS support to view buyer demand, share harvest availability and check order status.</p><button className="btn btn-orange" onClick={() => openDialog('ussd')}>Explore USSD access <ArrowRight size={16} /></button><small className="ussd-disclaimer">USSD short code and telecom integration are planned, not live yet.</small></div>
            <div className="phone-illustration"><div className="phone-speaker" /><div className="phone-screen"><div className="screen-header"><Sprout size={15} /> HarvestLink</div><span className="screen-caption">Welcome</span><div className="ussd-menu-item"><b>1.</b> View buyer requests</div><div className="ussd-menu-item"><b>2.</b> Share harvest</div><div className="ussd-menu-item"><b>3.</b> Check order status</div><div className="ussd-menu-item"><b>4.</b> Talk to support</div><div className="phone-input">Reply with option…</div></div><div className="phone-button" /></div>
            <div className="ussd-photo" role="img" aria-label="Farmer using a mobile phone on a farm" />
          </div>
        </section>

        <section className="audience-section section-pad" id="farmers">
          <div className="wrap audience-grid">
            <AudienceCard kind="farmer" image="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=900&q=85" overline="For farmers" title="Sell with more confidence." text="Build a clearer picture of who wants your harvest, what grade they need and when they need it." bullets={['See real buyer requests', 'Share harvest availability from basic phones', 'Agree grade, quantity and price before dispatch', 'Keep an order and payment record']} cta="Start as a farmer" onClick={startFarmer} />
            <AudienceCard kind="buyer" image="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=900&q=85" overline="For buyers" title="Source with fewer surprises." text="Organise your fresh-produce purchasing around consistent supply, agreed quality and realistic delivery windows." bullets={['Source from a grouped local supply network', 'Set consistent grade and delivery windows', 'Compare itemised order and delivery costs', 'Record orders for easier follow-up']} cta="Source for your business" onClick={startDemand} />
          </div>
        </section>

        <section className="plans-section section-pad" id="plans">
          <div className="wrap">
            <SectionHeading overline="Fair access. Clear value." title="Plans built around real value" subtitle="Proposed pilot pricing. Farmers can start free; buyers pay for tools that simplify repeat sourcing." />
            <div className="plans-grid">
              <PlanCard icon={<Leaf size={22} />} audience="For farmers" title="Farmer Basic" price="Free" unit="always" note="List harvest availability and get matched to buyer demand." features={['Create a farmer profile', 'List produce and availability', 'Access through smartphone or supported USSD flow', 'Basic order updates and records']} cta="Start for free" onClick={startFarmer} />
              <PlanCard featured icon={<Users size={22} />} audience="For growing buyers" title="Buyer Starter" price="1,500" unit="KES / month" note="For smaller restaurants, shops and regular produce buyers." features={['Post produce requests', 'Access supplier matches', 'Track order requests', 'Basic purchase history']} cta="Join the buyer pilot" onClick={() => chooseBuyerPlan('Buyer Starter')} />
              <PlanCard icon={<BarChart3 size={22} />} audience="For frequent buyers" title="Buyer Growth" price="3,500" unit="KES / month" note="For operations that need more structure and repeat ordering." features={['Everything in Starter', 'Recurring order templates', 'Delivery window coordination', 'Priority support during pilot']} cta="Discuss Growth plan" onClick={() => chooseBuyerPlan('Buyer Growth')} />
            </div>
            <div className="institution-note"><Building2 size={19} /><span><b>Institutional procurement</b><small>Proposed range: KSh 5,000–15,000 per month, depending on procurement needs. Final pricing should be validated with pilot customers.</small></span><button className="text-link" onClick={() => openDialog('contact', { subject: 'Institutional procurement' })}>Talk to us <ArrowRight size={15} /></button></div>
            <p className="pricing-caveat">Pilot concept pricing, not a final tariff. Produce costs, transport, sorting, handling and payment fees should be disclosed separately per order. No payment is collected on this website.</p>
          </div>
        </section>

        <section className="trust-section section-pad">
          <div className="wrap">
            <SectionHeading overline="Good trade is built on trust" title="Trust is built into every order" subtitle="The marketplace sets expectations early, so both sides know what is agreed before produce moves." />
            <div className="trust-grid"><TrustCard icon={<BadgeCheck size={23} />} title="Clear grading rules" text="Agree product grade, size and acceptable defects before dispatch." /><TrustCard icon={<ScaleIcon size={24} />} title="Weighed & recorded" text="Record actual weights and collection evidence to reduce disputes." /><TrustCard icon={<Truck size={23} />} title="Visible delivery costs" text="Delivery charges and responsibilities are shared before confirmation." /><TrustCard icon={<ShieldCheck size={23} />} title="Fair dispute process" text="Keep a record of the agreed terms and an escalation path for issues." /></div>
          </div>
        </section>

        <section className="final-cta">
          <div className="final-cta-photo" />
          <div className="wrap final-cta-inner"><div><div className="eyebrow eyebrow-light"><Sprout size={15} /> Be part of the pilot</div><h2>Start with one reliable route.<br /><em>Grow from repeat orders.</em></h2><p>We are starting with selected fruit and vegetable supply into Nairobi, proving reliability before scaling.</p></div><button className="btn btn-orange btn-large" onClick={() => openDialog('join-pilot')}>Join the pilot network <ArrowRight size={17} /></button></div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="wrap footer-main">
          <div className="footer-brand"><a className="brand brand-inverse" href="#home"><span className="brand-mark"><Sprout size={25} /></span><span className="brand-name">Harvest<span>Link</span><small>Better markets for every harvest.</small></span></a><p>Connecting local harvests with reliable demand—one transparent order at a time.</p><div className="footer-badges"><span><Leaf size={14} /> Local first</span><span><Handshake size={14} /> Built for both sides</span></div></div>
          <div className="footer-col"><b>Marketplace</b><a href="#marketplace">Find Produce</a><a href="#how-it-works">How It Works</a><a href="#ussd">USSD Access</a></div>
          <div className="footer-col"><b>For Farmers</b><a href="#farmers">Farmer benefits</a><button onClick={startFarmer}>Farmer plans</button><button onClick={startFarmer}>List a harvest</button></div>
          <div className="footer-col"><b>For Buyers</b><a href="#buyers">Buyer benefits</a><a href="#plans">Buyer plans</a><button onClick={() => openDialog('contact', { subject: 'Buyer support' })}>Buyer support</button></div>
          <div className="footer-col"><b>Get in touch</b><button onClick={() => openDialog('contact', { subject: 'General enquiry' })}>Contact HarvestLink</button><button onClick={() => openDialog('contact', { subject: 'Partnership enquiry' })}>Partnerships</button><span className="footer-pilot">Pilot-stage platform<br />Kenya · Nairobi corridor</span></div>
        </div>
        <div className="footer-bottom"><div className="wrap footer-bottom-inner"><span>© {new Date().getFullYear()} HarvestLink. All rights reserved.</span><div><a href="#privacy" onClick={(e) => { e.preventDefault(); openDialog('policy', { policy: 'Privacy' }) }}>Privacy</a><a href="#terms" onClick={(e) => { e.preventDefault(); openDialog('policy', { policy: 'Terms' }) }}>Terms</a><span className="demo-label">{isDemoMode ? 'DEMO MODE' : 'CONNECTED MODE'}</span></div></div></div>
      </footer>

      {cart.length > 0 && <button className="floating-cart" onClick={() => { setActiveProduct(null); openDialog('cart') }}><ShoppingCart size={18} /><span>{cart.length} selected</span><ArrowRight size={16} /></button>}
      {notice && <div className={`toast toast-${notice.type}`} role="status"><span>{notice.type === 'error' ? <CircleHelp size={19} /> : <CircleCheck size={19} />}</span><p>{notice.text}</p><button aria-label="Dismiss notification" onClick={() => setNotice(null)}><X size={16} /></button></div>}
      {dialog && <DialogHost dialog={dialog} user={user} cart={cart} quotes={quotes} offers={offers} products={products} submitting={submitting} onClose={() => setDialog(null)} onAuthSubmit={handleAuthSubmit} onQuoteSubmit={handleQuoteSubmit} onProductSubmit={handleProductSubmit} onDemandSubmit={handleDemandSubmit} onOfferSubmit={handleOfferSubmit} onLogout={logout} onAddProduct={() => openDialog('add-product')} onSubmitContact={(form) => { setDialog(null); if (isDemoMode) { try { const key = 'harvestlink-interests-v1'; const previous = JSON.parse(localStorage.getItem(key) || '[]'); localStorage.setItem(key, JSON.stringify([{ ...form, id: `I-${Date.now()}`, createdAt: new Date().toISOString() }, ...previous])); } catch { /* local storage may be disabled */ } toast(`Thanks. Your interest was saved in this browser demo. No email or notification has been sent.`); } else { toast('Thanks. This interest form is not connected to a message-delivery service yet.', 'info'); } }} onQuote={askForQuote} />}
    </>
  )
}

function SectionHeading({ overline, title, subtitle }) {
  return <div className="section-heading"><div className="eyebrow"><span className="eyebrow-dot" />{overline}</div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
}

function ProductCard({ product, onQuote, onAdd, isInCart }) {
  const image = product.image || product.image_url || productFallbackImages[product.category] || starterProducts[0].image
  return <article className="product-card">
    <div className="product-image-wrap"><img src={image} alt={product.name} loading="lazy" onError={(e) => { e.currentTarget.src = starterProducts[0].image }} /><span className="product-unit">{product.pack || product.unit || 'Bulk'}</span><button className={`quick-add ${isInCart ? 'quick-added' : ''}`} onClick={onAdd} aria-label={isInCart ? `Remove or view ${product.name} request` : `Add ${product.name} to request list`} title="Add to request list">{isInCart ? <Check size={16} /> : <Plus size={16} />}</button></div>
    <div className="product-card-body"><div className="product-card-top"><span className="product-category">{product.category}</span>{product.featured && <span className="featured-label"><span /> Featured</span>}</div><h3>{product.name}</h3><p className="product-description">{product.description || 'Produce supplied against confirmed buyer requirements.'}</p><div className="product-meta"><span><MapPin size={13} /> {product.location || 'Kenya'}</span><span><PackageCheck size={13} /> {product.availability || 'Availability to confirm'}</span></div><div className="product-card-footer"><span className="price-placeholder"><b>Request a quote</b><small>Price confirmed for your order</small></span><button className="btn btn-card" onClick={onQuote}>Get quote <ArrowUpRight size={15} /></button></div></div>
  </article>
}

function DemandCard({ demand, user, onOffer }) {
  const ownsDemand = user?.id && user.id === demand.buyerId
  return <article className="demand-card"><div className="demand-card-top"><span className="product-category">{demand.category}</span><span className="demand-status"><span /> Open request</span></div><h3>{demand.productName}</h3><div className="demand-quantity">{Number(demand.quantity).toLocaleString()} <span>{demand.unit}</span></div><div className="demand-details"><span><MapPin size={14} />{demand.deliveryLocation}</span><span><CalendarIcon />Needed by {demand.neededBy || 'Date to be agreed'}</span></div>{demand.gradeNotes && <p className="demand-notes">{demand.gradeNotes}</p>}<div className="demand-card-footer">{ownsDemand ? <span className="own-demand-label"><CheckCircle2 size={15} /> Your request</span> : <span className="demand-id">Ref. {String(demand.id).slice(0, 12)}</span>}<button className="btn btn-card" disabled={ownsDemand} onClick={onOffer}>{ownsDemand ? 'Waiting for offers' : 'Offer supply'} <ArrowRight size={14} /></button></div></article>
}
function CalendarIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>}

function Step({ number, icon, title, text }) { return <div className="step-card"><span className="step-number">{number}</span><div className="step-icon">{icon}</div><h3>{title}</h3><p>{text}</p></div> }

function AudienceCard({ kind, image, overline, title, text, bullets, cta, onClick }) {
  return <article className={`audience-card audience-${kind}`}><div className="audience-photo"><img src={image} alt="" loading="lazy" onError={(e) => { e.currentTarget.src = starterProducts[0].image }} /></div><div className="audience-content"><div className="eyebrow"><span className="eyebrow-dot" />{overline}</div><h3>{title}</h3><p>{text}</p><ul>{bullets.map((item) => <li key={item}><Check size={15} />{item}</li>)}</ul><button className="btn btn-green" onClick={onClick}>{cta} <ArrowRight size={15} /></button></div></article>
}

function PlanCard({ icon, audience, title, price, unit, note, features, cta, onClick, featured = false }) {
  return <article className={`plan-card ${featured ? 'plan-featured' : ''}`}>{featured && <span className="plan-ribbon">MOST POPULAR</span>}<div className="plan-icon">{icon}</div><div className="plan-audience">{audience}</div><h3>{title}</h3><div className="plan-price">{price !== 'Free' && <small>KSh </small>}{price}<span>{unit}</span></div><p className="plan-note">{note}</p><div className="plan-divider" /><ul>{features.map((item) => <li key={item}><CheckCircle2 size={16} />{item}</li>)}</ul><button className={`btn ${featured ? 'btn-orange' : 'btn-outline-green'}`} onClick={onClick}>{cta} <ArrowRight size={15} /></button></article>
}

function TrustCard({ icon, title, text }) { return <article className="trust-card"><span className="trust-icon">{icon}</span><h3>{title}</h3><p>{text}</p></article> }
function ScaleIcon({ size = 20 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v18M5 6h14M7 6l-4 7h8L7 6Zm10 0-4 7h8l-4-7ZM8 21h8" /></svg> }
function UtensilsIcon() { return <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 2v7m4-7v7M7 5h4M9 9v13M17 2c-2 3-2 6 0 8h3V2m-3 8v12" /></svg> }
function ChefHatIcon() { return <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 11a4 4 0 1 1 7.5-2A4.5 4.5 0 1 1 18 15H6a4 4 0 0 1 0-8"/><path d="M5 15v4h14v-4" /></svg> }

function DialogHost({ dialog, user, cart, quotes, offers, products, submitting, onClose, onAuthSubmit, onQuoteSubmit, onProductSubmit, onDemandSubmit, onOfferSubmit, onLogout, onSubmitContact, onQuote, onAddProduct }) {
  const [mode, setMode] = useState(dialog.mode || 'signup')
  const [role, setRole] = useState(dialog.role || 'buyer')
  const [showPassword, setShowPassword] = useState(false)
  const [selectedTab, setSelectedTab] = useState('requests')
  const [error, setError] = useState('')
  const [ussdStep, setUssdStep] = useState(0)

  const submit = async (event, callback) => {
    event.preventDefault(); setError('')
    const data = Object.fromEntries(new FormData(event.currentTarget).entries())
    await callback(data)
  }
  const titleMap = {
    auth: mode === 'signin' ? 'Welcome back' : 'Join HarvestLink', quote: 'Request today’s quote', 'add-product': 'List your harvest', dashboard: 'Your HarvestLink workspace', cart: 'Build a produce request', demand: 'Post a buyer request', offer: 'Offer supply to this buyer', ussd: 'USSD access for every farmer', contact: 'Talk to HarvestLink', 'join-pilot': 'Join the pilot network', policy: dialog.policy === 'Privacy' ? 'Privacy overview' : 'Marketplace terms',
  }
  const title = titleMap[dialog.type] || 'HarvestLink'
  const isAuth = dialog.type === 'auth'

  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
    <section className={`modal-card ${dialog.type === 'dashboard' ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
      <button className="modal-close icon-button" onClick={onClose} aria-label="Close dialog"><X size={20} /></button>
      <div className="modal-heading"><span className="modal-mark"><Sprout size={20} /></span><div><h2>{title}</h2><p>{isDemoMode ? 'Interactive demo · actions are saved in this browser' : 'HarvestLink marketplace'}</p></div></div>

      {isAuth && <>
        <div className="auth-tabs"><button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Create account</button><button className={mode === 'signin' ? 'active' : ''} onClick={() => setMode('signin')}>Sign in</button></div>
        <form className="modal-form" onSubmit={(e) => submit(e, onAuthSubmit)}>
          <input type="hidden" name="mode" value={mode} />
          {mode === 'signup' && <label>Full name<input name="name" placeholder="e.g. Wanjiku Kamau" autoComplete="name" required /></label>}
          <label>Email address<div className="input-with-icon"><Mail size={16} /><input type="email" name="email" placeholder="you@example.com" autoComplete="email" required /></div></label>
          <label>Password<div className="input-with-icon"><KeyRound size={16} /><input type={showPassword ? 'text' : 'password'} name="password" placeholder="At least 6 characters" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={6} required /><button type="button" className="show-password" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
          {mode === 'signup' && <>
            <label>Mobile number <span className="optional-label">for order coordination</span><div className="input-with-icon"><Phone size={16} /><input name="phone" placeholder="07xx xxx xxx" autoComplete="tel" /></div></label>
            <label>I am joining as<select name="role" value={role} onChange={(e) => setRole(e.target.value)}><option value="buyer">Buyer — restaurant, retailer or business</option><option value="farmer">Farmer / farmer group</option><option value="institution">Institutional buyer</option></select></label>
          </>}
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn-primary btn-full" type="submit" disabled={submitting}>{submitting ? <LoaderCircle className="spin" size={17} /> : mode === 'signup' ? <UserRound size={17} /> : <LogIn size={17} />}{mode === 'signup' ? 'Create my account' : 'Sign in'} <ArrowRight size={16} /></button>
          <p className="form-footnote">{isDemoMode ? 'Demo accounts do not authenticate on a server. Connect Supabase before using with real customers.' : 'Your account is handled through the connected authentication provider.'}</p>
        </form>
      </>}

      {(dialog.type === 'quote' || dialog.type === 'cart') && <>
        {dialog.type === 'cart' && <div className="cart-selected-list">{cart.map((item) => <div key={item.id}><span><PackageCheck size={16} />{item.name}</span><button onClick={() => onQuote(item)}>Request separately</button></div>)}</div>}
        <form className="modal-form" onSubmit={(e) => submit(e, onQuoteSubmit)}>
          <div className="quote-product-summary"><span className="quote-product-image"><img src={dialog.type === 'quote' && dialog.product ? (dialog.product.image || productFallbackImages[dialog.product.category] || starterProducts[0].image) : starterProducts[0].image} alt="" /></span><span><small>Produce request</small><b>{dialog.type === 'quote' && dialog.product ? dialog.product.name : 'Bulk produce request'}</b><em>{dialog.type === 'quote' && dialog.product ? dialog.product.location : 'Multiple products can be coordinated during pilot support'}</em></span></div>
          {dialog.type === 'cart' && <p className="modal-intro">You selected {cart.length} items. The quantity and unit below will apply to each item, and a separate request record will be created for every produce type.</p>}
          <div className="form-two-col"><label>Your name<input name="buyerName" defaultValue={user?.name || ''} placeholder="Full name" required /></label><label>Mobile number<input name="buyerPhone" defaultValue={user?.phone || ''} placeholder="07xx xxx xxx" required /></label></div>
          <div className="form-two-col"><label>Quantity needed<input name="quantity" type="number" min="1" step="any" placeholder="e.g. 10" required /></label><label>Unit<select name="unit" defaultValue={dialog.type === 'quote' && dialog.product?.unit || 'crate'}><option value="kg">Kilograms (kg)</option><option value="crate">Crates</option><option value="bag">Bags</option><option value="bunch">Bunches</option><option value="piece">Pieces</option><option value="tonne">Tonnes</option></select></label></div>
          <label>Delivery location<input name="deliveryLocation" placeholder="e.g. Westlands, Nairobi" required /></label>
          <label>Required delivery date<input name="neededBy" type="date" min={new Date().toISOString().slice(0, 10)} /></label>
          <label>Quality, grade or other notes<textarea name="notes" rows="3" placeholder="Preferred size, ripeness, packaging, repeat delivery…" /></label>
          <div className="privacy-note"><ShieldCheck size={16} /> No payment is taken now. Price, quality, delivery cost and payment terms must be agreed before dispatch.</div>
          <button className="btn btn-primary btn-full" type="submit" disabled={submitting}>{submitting ? <LoaderCircle className="spin" size={17} /> : <Send size={16} />} Send quote request <ArrowRight size={16} /></button>
        </form>
      </>}

      {dialog.type === 'add-product' && <form className="modal-form" onSubmit={(e) => submit(e, onProductSubmit)}>
        <p className="modal-intro">Tell buyers what you expect to harvest. Your listing should not be treated as confirmed until the quantity and dispatch date are reconfirmed.</p>
        <label>Produce name<input name="name" placeholder="e.g. Fresh tomatoes" required /></label>
        <div className="form-two-col"><label>Category<select name="category" required><option>Vegetables</option><option>Fruits</option><option>Leafy greens</option><option>Roots & tubers</option></select></label><label>Available quantity<input type="number" name="quantity" min="1" step="any" placeholder="e.g. 20" required /></label></div>
        <div className="form-two-col"><label>Unit<select name="unit"><option value="kg">Kilograms (kg)</option><option value="crate">Crates</option><option value="bag">Bags</option><option value="bunch">Bunches</option><option value="tonne">Tonnes</option></select></label><label>County / location<input name="location" placeholder="e.g. Kiambu County" required /></label></div>
        <label>Harvest and quality notes<textarea name="description" rows="3" placeholder="Expected harvest date, grade, packaging, irrigation…" /></label>
        <label>Image URL <span className="optional-label">optional</span><input name="image" type="url" placeholder="https://…" /></label>
        <button className="btn btn-primary btn-full" type="submit" disabled={submitting}>{submitting ? <LoaderCircle className="spin" size={17} /> : <Plus size={17} />} Publish produce listing <ArrowRight size={16} /></button>
        <p className="form-footnote">Do not publish produce you cannot reasonably supply. All supply details should be reconfirmed before accepting orders.</p>
      </form>}

      {dialog.type === 'demand' && <form className="modal-form" onSubmit={(e) => submit(e, onDemandSubmit)}>
        <p className="modal-intro">Describe the produce you need. Farmers who use the platform can respond with the quantity they can supply and their proposed price. Keep buyer contact details private until you choose to share them.</p>
        <label>Produce needed<input name="productName" placeholder="e.g. Fresh tomatoes" required /></label>
        <div className="form-two-col"><label>Category<select name="category" required><option>Vegetables</option><option>Fruits</option><option>Leafy greens</option><option>Roots & tubers</option></select></label><label>Quantity needed<input name="quantity" type="number" min="1" step="any" placeholder="e.g. 100" required /></label></div>
        <div className="form-two-col"><label>Unit<select name="unit"><option value="kg">Kilograms (kg)</option><option value="crate">Crates</option><option value="bag">Bags</option><option value="bunch">Bunches</option><option value="tonne">Tonnes</option></select></label><label>Delivery location<input name="deliveryLocation" placeholder="e.g. Westlands, Nairobi" required /></label></div>
        <label>Required by<input name="neededBy" type="date" min={new Date().toISOString().slice(0, 10)} /></label>
        <label>Quality grade, packaging and schedule<textarea name="gradeNotes" rows="3" placeholder="Preferred sizes, maturity, packaging, weekly frequency…" /></label>
        <div className="privacy-note"><ShieldCheck size={16} /> Pricing and delivery remain proposals until both sides agree. No payment is collected here.</div>
        <button className="btn btn-primary btn-full" type="submit" disabled={submitting}>{submitting ? <LoaderCircle className="spin" size={17} /> : <Send size={16} />} Publish buyer request <ArrowRight size={16} /></button>
      </form>}

      {dialog.type === 'offer' && <form className="modal-form" onSubmit={(e) => submit(e, onOfferSubmit)}>
        <div className="quote-product-summary"><span className="quote-product-image"><img src={starterProducts.find((p) => p.category === dialog.demand?.category)?.image || starterProducts[0].image} alt="" /></span><span><small>Buyer wants</small><b>{dialog.demand?.productName || activeDemand?.productName || 'Produce request'}</b><em>{dialog.demand?.quantity} {dialog.demand?.unit} · {dialog.demand?.deliveryLocation}</em></span></div>
        <p className="modal-intro">Offer only what you can supply. The price below is your proposal per selected unit, not an automatically accepted sale.</p>
        <div className="form-two-col"><label>Quantity you can supply<input name="quantity" type="number" min="1" step="any" placeholder="e.g. 40" required /></label><label>Unit<select name="unit" defaultValue={dialog.demand?.unit || 'kg'}><option value="kg">Kilograms (kg)</option><option value="crate">Crates</option><option value="bag">Bags</option><option value="bunch">Bunches</option><option value="tonne">Tonnes</option></select></label></div>
        <label>Proposed price per unit (KSh)<input name="proposedPrice" type="number" min="0.01" step="0.01" placeholder="Your price per unit" required /></label>
        <label>Harvest timing, quality and delivery notes<textarea name="notes" rows="3" placeholder="Expected harvest date, grade, transport plan…" /></label>
        <button className="btn btn-primary btn-full" type="submit" disabled={submitting}>{submitting ? <LoaderCircle className="spin" size={17} /> : <Send size={16} />} Send supply offer <ArrowRight size={16} /></button>
      </form>}

      {dialog.type === 'dashboard' && <div className="dashboard-content">
        <div className="dashboard-greeting"><span className="dashboard-avatar"><UserRound size={22} /></span><div><b>Hello, {user?.name || 'member'}</b><span>{user?.role === 'farmer' ? 'Farmer account' : user?.role === 'institution' ? 'Institutional buyer' : 'Buyer account'}{user?.demo ? ' · demo profile' : ''}</span></div><button className="btn btn-outline btn-small" onClick={onLogout}>Sign out</button></div>
        <div className="dashboard-tabs"><button className={selectedTab === 'requests' ? 'active' : ''} onClick={() => setSelectedTab('requests')}><ClipboardList size={15} /> Quote requests</button><button className={selectedTab === 'listings' ? 'active' : ''} onClick={() => setSelectedTab('listings')}><PackageCheck size={15} /> My listings</button><button className={selectedTab === 'offers' ? 'active' : ''} onClick={() => setSelectedTab('offers')}><Handshake size={15} /> Supply offers</button></div>
        {selectedTab === 'requests' && <div className="dashboard-list">{quotes.length ? quotes.map((q) => <div className="dashboard-row" key={q.id}><span className="dashboard-row-icon"><ShoppingBasket size={17} /></span><span className="dashboard-row-main"><b>{q.productName}</b><small>{q.quantity} {q.unit} · {q.deliveryLocation}</small></span><span className="dashboard-status">{q.status}</span></div>) : <div className="dashboard-empty"><ClipboardList size={28} /><b>No quote requests yet</b><p>Your requests and updates will appear here after you submit a quote.</p><button className="btn btn-primary btn-small" onClick={() => onQuote(null)}>Request produce <ArrowRight size={14} /></button></div>}</div>}
        {selectedTab === 'listings' && <div className="dashboard-list">{productsForDashboard(user, products).length ? productsForDashboard(user, products).map((p) => <div className="dashboard-row" key={p.id}><span className="dashboard-row-icon"><Sprout size={17} /></span><span className="dashboard-row-main"><b>{p.name}</b><small>{p.category} · {p.location || 'Kenya'}</small></span><span className="dashboard-status">{p.availability || 'Listed'}</span></div>) : <div className="dashboard-empty"><PackageCheck size={28} /><b>No listings in your workspace yet</b><p>{user?.role === 'farmer' ? 'Add your first produce listing after closing this workspace.' : 'Your own listings will appear here if you join HarvestLink as a farmer.'}</p><button className="btn btn-primary btn-small" onClick={() => user?.role === 'farmer' ? onAddProduct() : onClose()}>{user?.role === 'farmer' ? 'List produce' : 'Close workspace'} <ArrowRight size={14} /></button></div>}</div>}
        {selectedTab === 'offers' && <div className="dashboard-list">{offers?.length ? offers.map((o) => <div className="dashboard-row" key={o.id}><span className="dashboard-row-icon"><Handshake size={17} /></span><span className="dashboard-row-main"><b>{o.productName}</b><small>{o.quantity} {o.unit} · KSh {Number(o.proposedPrice).toLocaleString()} per {o.unit} · {o.notes || 'No extra notes'}</small></span><span className="dashboard-status">{o.status}</span></div>) : <div className="dashboard-empty"><Handshake size={28} /><b>No supply offers yet</b><p>Farmer offers and replies to your buyer requests will appear here.</p><button className="btn btn-outline-green btn-small" onClick={onClose}>Browse marketplace <ArrowRight size={14} /></button></div>}</div>}
        <div className="dashboard-note"><ShieldCheck size={16} /> {isDemoMode ? 'This workspace is a local demo. Data is stored only in this browser.' : 'Order visibility depends on your account permissions and database policies.'}</div>
      </div>}

      {dialog.type === 'ussd' && <div className="ussd-modal-body"><p className="modal-intro">This prototype shows the intended feature-phone experience. The short code and telecom gateway must be acquired and integrated before this can run on real mobile networks.</p><div className="ussd-demo-phone"><div className="ussd-demo-top"><Sprout size={16} /> HarvestLink USSD <button onClick={() => setUssdStep(0)}><X size={15} /></button></div>{ussdStep === 0 ? <><h3>Welcome to HarvestLink</h3><p>Choose an option:</p>{['View buyer requests', 'Share my harvest', 'Check order status', 'Contact support'].map((t, i) => <button className="ussd-option" key={t} onClick={() => setUssdStep(i + 1)}><b>{i + 1}.</b> {t}<ChevronRight size={15} /></button>)}</> : <><button className="ussd-back" onClick={() => setUssdStep(0)}>← Main menu</button><h3>{['', 'Buyer requests', 'Share your harvest', 'Order status', 'Contact support'][ussdStep]}</h3><p>{['', 'Buyer demand would be shown here after matching to your county and produce.', 'A real flow would ask for produce, expected quantity, harvest date and location.', 'Enter your order reference to check the latest recorded status.', 'Support channels will be displayed after a support number is configured.'][ussdStep]}</p><div className="ussd-placeholder">Feature preview · not connected to a mobile network</div></>}</div><button className="btn btn-primary btn-full" onClick={() => { onClose() }}>Got it <Check size={16} /></button></div>}

      {(dialog.type === 'contact' || dialog.type === 'join-pilot') && <form className="modal-form" onSubmit={(e) => submit(e, (f) => onSubmitContact({ ...f, subject: dialog.subject || (dialog.type === 'join-pilot' ? 'Pilot network' : 'General enquiry') }))}>
        <p className="modal-intro">{dialog.type === 'join-pilot' ? 'Tell us whether you are a farmer, buyer or supply partner. This helps shape the first pilot corridor.' : `Send a note about ${dialog.subject || 'your question'}. This is a prototype form; no email will be sent until a contact backend is connected.`}</p>
        <label>Your name<input name="name" defaultValue={user?.name || ''} placeholder="Full name" required /></label><label>Email address<input name="email" type="email" defaultValue={user?.email || ''} placeholder="you@example.com" required /></label><label>Mobile number <span className="optional-label">optional</span><input name="phone" defaultValue={user?.phone || ''} placeholder="07xx xxx xxx" /></label><label>I am a…<select name="kind"><option>Farmer / farmer group</option><option>Restaurant or caterer</option><option>Retailer / produce shop</option><option>Institutional buyer</option><option>Logistics / aggregation partner</option><option>Other</option></select></label><label>Message<textarea name="message" rows="3" placeholder="County, produce type, estimated weekly volume…" /></label><button className="btn btn-primary btn-full" type="submit"><Send size={16} /> Submit interest <ArrowRight size={16} /></button>
      </form>}

      {dialog.type === 'policy' && <div className="policy-copy"><p><b>{dialog.policy === 'Privacy' ? 'Privacy overview' : 'Marketplace terms'}</b></p>{dialog.policy === 'Privacy' ? <><p>This prototype collects only the information entered into demo forms. In demo mode, account and quote information is saved in local browser storage and is not sent to HarvestLink.</p><p>Before launch, publish a full privacy notice covering identity and contact details, order information, lawful basis, retention, access, deletion and support requests. If using Supabase, configure appropriate row-level security and restrict access to customer records.</p></> : <><p>Produce listings in this prototype are illustrative. Availability, quality grade, weights, delivery and price must be agreed by the relevant parties before dispatch.</p><p>HarvestLink is presented as an early-stage coordination marketplace. No payment is collected here, and no live USSD or delivery service is implied. Publish reviewed marketplace terms and dispute procedures before accepting commercial orders.</p></>}<button className="btn btn-primary btn-full" onClick={onClose}>Close</button></div>}
    </section>
  </div>
}

function productsForDashboard(user, products = []) {
  if (!user) return []
  return products.filter((p) => p.ownerId === user.id)
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
