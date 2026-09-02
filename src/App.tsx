import { BrowserRouter, Route, Routes } from 'react-router-dom'
import ScrollToTop from './components/system/ScrollToTop'
import PublicLayout from './layouts/PublicLayout'
import RequireAuth from './features/auth/RequireAuth'
import RequireAdmin from './features/auth/RequireAdmin'
import AboutPage from './pages/AboutPage'
import AccountPage from './pages/AccountPage'
import CartPage from './pages/CartPage'
import CollectionsPage from './pages/CollectionsPage'
import ContactPage from './pages/ContactPage'
import HomePage from './pages/HomePage'
import MenPage from './pages/MenPage'
import SearchPage from './pages/SearchPage'
import WishlistPage from './pages/WishlistPage'
import WomenPage from './pages/WomenPage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import UpdatePasswordPage from './pages/UpdatePasswordPage'
import ProductPage from './pages/ProductPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderSuccessPage from './pages/OrderSuccessPage'
import AdminPage from './pages/AdminPage'
import AdminHomepagePage from './pages/AdminHomepagePage'
import AdminSettingsPage from './pages/AdminSettingsPage'
import OrdersPage from './pages/OrdersPage'
import AdminProductsPage from './pages/AdminProductsPage'
import AddressesPage from './pages/AddressesPage'

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/men" element={<MenPage />} />
          <Route path="/women" element={<WomenPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/wishlist" element={<RequireAuth><WishlistPage /></RequireAuth>} />
          <Route path="/cart" element={<RequireAuth><CartPage /></RequireAuth>} />
          <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
          <Route path="/order-success/:orderNumber" element={<RequireAuth><OrderSuccessPage /></RequireAuth>} />
          <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
          <Route path="/admin/products" element={<RequireAdmin><AdminProductsPage /></RequireAdmin>} />
          <Route path="/admin/homepage" element={<RequireAdmin><AdminHomepagePage /></RequireAdmin>} />
          <Route path="/admin/settings" element={<RequireAdmin><AdminSettingsPage /></RequireAdmin>} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
          <Route path="/addresses" element={<RequireAuth><AddressesPage /></RequireAuth>} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/update-password" element={<UpdatePasswordPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
