import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = supabaseUrl && supabaseKey && !supabaseUrl.includes('YOUR_PROJECT_ID') && !supabaseKey.includes('YOUR_')
  ? createClient(supabaseUrl, supabaseKey)
  : null
export const isDemoMode = !supabase

const LOCAL_PRODUCTS_KEY = 'harvestlink-products-v1'
const LOCAL_QUOTES_KEY = 'harvestlink-quotes-v1'
const LOCAL_USER_KEY = 'harvestlink-demo-user-v1'
const LOCAL_USERS_KEY = 'harvestlink-demo-users-v1'

export const starterProducts = [
  { id: 'tomatoes', name: 'Fresh Tomatoes', category: 'Vegetables', location: 'Kiambu County', unit: 'crate', pack: 'Crate (15 kg)', availability: 'Supply being confirmed', image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=900&q=85', description: 'Firm, ripe tomatoes for kitchens, retailers and resellers.', featured: true },
  { id: 'sukuma', name: 'Sukuma Wiki', category: 'Leafy greens', location: 'Murang’a County', unit: 'bunch', pack: 'Bunch / bulk', availability: 'Available by request', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=900&q=85', description: 'Fresh leafy greens harvested to match your order window.' },
  { id: 'avocados', name: 'Hass Avocados', category: 'Fruits', location: 'Kirinyaga County', unit: 'box', pack: 'Box / bulk', availability: 'Supply being confirmed', image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=900&q=85', description: 'Sorted avocado supply for retail and food-service buyers.' },
  { id: 'bananas', name: 'Sweet Bananas', category: 'Fruits', location: 'Kakamega County', unit: 'bunch', pack: 'Bunch / bulk', availability: 'Available by request', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6f9e3c2c?auto=format&fit=crop&w=900&q=85', description: 'Bananas sourced from participating smallholder growers.' },
  { id: 'carrots', name: 'Orange Carrots', category: 'Roots & tubers', location: 'Kiambu County', unit: 'crate', pack: 'Crate / bulk', availability: 'Supply being confirmed', image: 'https://images.unsplash.com/photo-1445282768818-728615cc910a?auto=format&fit=crop&w=900&q=85', description: 'Washed or unwashed carrots according to buyer requirements.' },
  { id: 'mangoes', name: 'Seasonal Mangoes', category: 'Fruits', location: 'Embu County', unit: 'crate', pack: 'Crate / bulk', availability: 'Seasonal supply', image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=900&q=85', description: 'Seasonal fruit with quantities confirmed before dispatch.' },
  { id: 'peppers', name: 'Green Capsicum', category: 'Vegetables', location: 'Nakuru County', unit: 'crate', pack: 'Crate / bulk', availability: 'Available by request', image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=900&q=85', description: 'Green capsicum for restaurant kitchens and produce shops.' },
  { id: 'onions', name: 'Red Onions', category: 'Vegetables', location: 'Nakuru County', unit: 'bag', pack: 'Bag / bulk', availability: 'Supply being confirmed', image: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=900&q=85', description: 'Red onions in agreed bag sizes for repeat buyers.' },
  { id: 'potatoes', name: 'Irish Potatoes', category: 'Roots & tubers', location: 'Nyandarua County', unit: 'bag', pack: 'Bag / bulk', availability: 'Available by request', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=900&q=85', description: 'Bulk potatoes sourced against requested grade and size.' },
]

function readLocal(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback } catch { return fallback }
}
function writeLocal(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* private browsing may block storage */ }
}

export async function getProducts() {
  if (supabase) {
    const { data, error } = await supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map((p) => ({
      ...p, dbId: p.id, location: p.location || 'Kenya', unit: p.unit || 'kg', pack: p.unit || 'kg', availability: p.availability || 'Listed by farmer',
      image: p.image_url || starterProducts.find((s) => s.category === p.category)?.image || starterProducts[0].image,
      ownerId: p.farmer_id,
    }))
  }
  const saved = readLocal(LOCAL_PRODUCTS_KEY, [])
  return [...saved, ...starterProducts]
}

export async function signInOrSignUp({ mode, name, email, password, phone, role }) {
  if (supabase) {
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name, phone, role } },
      })
      if (error) throw error
      if (!data.session) return { user: null, confirmationRequired: true }
      return { user: { id: data.user.id, name: name || email.split('@')[0], email, phone, role }, confirmationRequired: false }
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const meta = data.user.user_metadata || {}
    return { user: { id: data.user.id, name: meta.full_name || email.split('@')[0], email, phone: meta.phone || '', role: meta.role || role || 'buyer' }, confirmationRequired: false }
  }
  const normalizedEmail = email.trim().toLowerCase()
  const users = readLocal(LOCAL_USERS_KEY, [])
  if (mode === 'signin') {
    const existing = users.find((candidate) => candidate.email.toLowerCase() === normalizedEmail)
    if (!existing) throw new Error('No demo account exists for this email. Choose “Create account” first.')
    writeLocal(LOCAL_USER_KEY, existing)
    return { user: existing, confirmationRequired: false }
  }
  if (users.some((candidate) => candidate.email.toLowerCase() === normalizedEmail)) throw new Error('An account for this email already exists. Choose “Sign in” instead.')
  const user = { id: `demo-${Date.now()}`, name: name?.trim() || email.split('@')[0], email: normalizedEmail, phone: phone || '', role: role || 'buyer', demo: true }
  writeLocal(LOCAL_USERS_KEY, [...users, user])
  writeLocal(LOCAL_USER_KEY, user)
  return { user, confirmationRequired: false }
}

export async function getSavedDemoUser() {
  if (supabase) {
    const { data } = await supabase.auth.getSession()
    if (!data.session?.user) return null
    const u = data.session.user
    const meta = u.user_metadata || {}
    return { id: u.id, name: meta.full_name || u.email?.split('@')[0] || 'Member', email: u.email || '', phone: meta.phone || '', role: meta.role || 'buyer' }
  }
  return readLocal(LOCAL_USER_KEY, null)
}

export async function signOutUser() {
  if (supabase) {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }
  try { localStorage.removeItem(LOCAL_USER_KEY) } catch { /* ignored */ }
}

export async function createQuote({ user, product, buyerName, buyerPhone, quantity, unit, deliveryLocation, neededBy, notes }) {
  const quote = {
    id: `Q-${Date.now().toString().slice(-7)}`, productId: product?.id || null,
    productName: product?.name || 'Bulk produce request', buyerName, buyerPhone,
    quantity: Number(quantity), unit, deliveryLocation, neededBy, notes,
    status: 'Pending response', createdAt: new Date().toISOString(), buyerId: user?.id || null,
  }
  if (supabase) {
    if (!user?.id || String(user.id).startsWith('demo-')) throw new Error('Please sign in with a verified account to send a live quote request.')
    const { data, error } = await supabase.from('quote_requests').insert({
      buyer_id: user.id, product_id: product?.dbId || null,
      product_name: quote.productName, buyer_name: buyerName, buyer_phone: buyerPhone,
      quantity: Number(quantity), unit, delivery_location: deliveryLocation, needed_by: neededBy || null, notes,
      status: 'pending',
    }).select().single()
    if (error) throw error
    return { ...quote, id: data.id, status: data.status }
  }
  const quotes = readLocal(LOCAL_QUOTES_KEY, [])
  writeLocal(LOCAL_QUOTES_KEY, [quote, ...quotes])
  return quote
}

export async function getMyQuotes(user) {
  if (supabase) {
    if (!user?.id) return []
    const { data, error } = await supabase.from('quote_requests').select('*').order('created_at', { ascending: false }).limit(50)
    if (error) throw error
    return (data || []).map((q) => ({ id: q.id, productName: q.product_name, buyerName: q.buyer_name, buyerPhone: q.buyer_phone, quantity: q.quantity, unit: q.unit, deliveryLocation: q.delivery_location, status: q.status, createdAt: q.created_at, buyerId: q.buyer_id, notes: q.notes }))
  }
  return readLocal(LOCAL_QUOTES_KEY, []).filter((q) => Boolean(user?.id) && q.buyerId === user.id)
}

export async function createProduct({ user, name, category, quantity, unit, location, description, image }) {
  const product = { id: `local-${Date.now()}`, name, category, available_quantity: Number(quantity), unit, location, description, image: image || starterProducts[0].image, availability: 'New listing', ownerId: user?.id, isLocal: true }
  if (supabase) {
    if (!user?.id || String(user.id).startsWith('demo-')) throw new Error('Please create a live farmer account to publish a shared listing.')
    const { data, error } = await supabase.from('products').insert({
      farmer_id: user.id, name, category, available_quantity: Number(quantity), unit, location,
      description, image_url: image || null, is_active: true,
    }).select().single()
    if (error) throw error
    return { ...product, id: data.id, dbId: data.id, ownerId: user.id }
  }
  const saved = readLocal(LOCAL_PRODUCTS_KEY, [])
  writeLocal(LOCAL_PRODUCTS_KEY, [product, ...saved])
  return product
}

export async function deleteLocalProduct(id) {
  const saved = readLocal(LOCAL_PRODUCTS_KEY, [])
  writeLocal(LOCAL_PRODUCTS_KEY, saved.filter((p) => p.id !== id))
}

const LOCAL_DEMANDS_KEY = 'harvestlink-demands-v1'
const LOCAL_OFFERS_KEY = 'harvestlink-offers-v1'

export async function getBuyerDemands(user) {
  if (supabase) {
    const { data, error } = await supabase.from('buyer_demands').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(100)
    if (error) throw error
    return (data || []).map((d) => ({ id: d.id, buyerId: d.buyer_id, productName: d.product_name, category: d.category, quantity: d.quantity, unit: d.unit, deliveryLocation: d.delivery_location, neededBy: d.needed_by, gradeNotes: d.grade_notes, status: d.status, createdAt: d.created_at }))
  }
  const demands = readLocal(LOCAL_DEMANDS_KEY, [])
  return demands.filter((d) => d.status === 'open')
}

export async function createBuyerDemand({ user, productName, category, quantity, unit, deliveryLocation, neededBy, gradeNotes }) {
  if (!user) throw new Error('Create a buyer account before posting demand.')
  if (supabase) {
    if (!user.id || String(user.id).startsWith('demo-')) throw new Error('Please sign in with a live account to publish shared buyer demand.')
    if (!['buyer', 'institution'].includes(user.role)) throw new Error('Only buyer or institutional accounts can post demand.')
    const { data, error } = await supabase.from('buyer_demands').insert({
      buyer_id: user.id, product_name: productName, category, quantity: Number(quantity), unit,
      delivery_location: deliveryLocation, needed_by: neededBy || null, grade_notes: gradeNotes || '', status: 'open',
    }).select().single()
    if (error) throw error
    return { id: data.id, buyerId: data.buyer_id, productName: data.product_name, category: data.category, quantity: data.quantity, unit: data.unit, deliveryLocation: data.delivery_location, neededBy: data.needed_by, gradeNotes: data.grade_notes, status: data.status, createdAt: data.created_at }
  }
  const demand = { id: `D-${Date.now().toString().slice(-7)}`, buyerId: user.id, buyerName: user.name, productName, category, quantity: Number(quantity), unit, deliveryLocation, neededBy, gradeNotes: gradeNotes || '', status: 'open', createdAt: new Date().toISOString() }
  const demands = readLocal(LOCAL_DEMANDS_KEY, [])
  writeLocal(LOCAL_DEMANDS_KEY, [demand, ...demands])
  return demand
}

export async function createFarmerOffer({ user, demand, quantity, unit, proposedPrice, notes }) {
  if (!user) throw new Error('Sign in with a farmer account to offer supply.')
  if (supabase) {
    if (!user.id || String(user.id).startsWith('demo-')) throw new Error('Please sign in with a live farmer account to send a shared offer.')
    if (user.role !== 'farmer') throw new Error('Only farmer accounts can respond to buyer demand.')
    const { data, error } = await supabase.from('farmer_responses').insert({
      demand_id: demand.id, farmer_id: user.id, supply_quantity: Number(quantity), unit,
      proposed_price: Number(proposedPrice), notes: notes || '', status: 'submitted',
    }).select().single()
    if (error) throw error
    return { id: data.id, demandId: data.demand_id, farmerId: data.farmer_id, productName: demand.productName, quantity: data.supply_quantity, unit: data.unit, proposedPrice: data.proposed_price, notes: data.notes, status: data.status, createdAt: data.created_at }
  }
  const offer = { id: `O-${Date.now().toString().slice(-7)}`, demandId: demand.id, farmerId: user.id, farmerName: user.name, buyerId: demand.buyerId, productName: demand.productName, quantity: Number(quantity), unit, proposedPrice: Number(proposedPrice), notes: notes || '', status: 'submitted', createdAt: new Date().toISOString() }
  const offers = readLocal(LOCAL_OFFERS_KEY, [])
  writeLocal(LOCAL_OFFERS_KEY, [offer, ...offers])
  return offer
}

export async function getMyOffers(user) {
  if (supabase) {
    if (!user?.id) return []
    const { data, error } = await supabase.from('farmer_responses').select('*, buyer_demands(product_name, buyer_id)').order('created_at', { ascending: false }).limit(100)
    if (error) throw error
    return (data || []).map((o) => ({ id: o.id, demandId: o.demand_id, farmerId: o.farmer_id, productName: o.buyer_demands?.product_name || 'Produce request', quantity: o.supply_quantity, unit: o.unit, proposedPrice: o.proposed_price, notes: o.notes, status: o.status, createdAt: o.created_at, buyerId: o.buyer_demands?.buyer_id }))
  }
  return readLocal(LOCAL_OFFERS_KEY, []).filter((o) => o.farmerId === user?.id || o.buyerId === user?.id)
}
