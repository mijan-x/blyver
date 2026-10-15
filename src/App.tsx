import { lazy, Suspense } from "react";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import ScrollToTop from "./components/system/ScrollToTop";
import PublicLayout from "./layouts/PublicLayout";
import RequireAuth from "./features/auth/RequireAuth";
import RequireAdmin from "./features/auth/RequireAdmin";
import HomePage from "./pages/HomePage";

const AboutPage = lazy(() => import("./pages/AboutPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CollectionsPage = lazy(() => import("./pages/CollectionsPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const MenPage = lazy(() => import("./pages/MenPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const WomenPage = lazy(() => import("./pages/WomenPage"));
const SignInPage = lazy(() => import("./pages/SignInPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const UpdatePasswordPage = lazy(() => import("./pages/UpdatePasswordPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const OrderSuccessPage = lazy(() => import("./pages/OrderSuccessPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AdminCollectionsPage = lazy(() => import("./pages/AdminCollectionsPage"));
const AdminHomepagePage = lazy(() => import("./pages/AdminHomepagePage"));
const AdminSettingsPage = lazy(() => import("./pages/AdminSettingsPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const AdminProductsPage = lazy(() => import("./pages/AdminProductsPage"));
const AdminOrdersPage = lazy(() => import("./pages/AdminOrdersPage"));
const AddressesPage = lazy(() => import("./pages/AddressesPage"));

function PageOutlet() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <Outlet />
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route element={<PageOutlet />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/men" element={<MenPage />} />
            <Route path="/women" element={<WomenPage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route
              path="/wishlist"
              element={
                <RequireAuth>
                  <WishlistPage />
                </RequireAuth>
              }
            />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route
              path="/order-success/:orderNumber"
              element={<OrderSuccessPage />}
            />
            <Route
              path="/orders"
              element={
                <RequireAuth>
                  <OrdersPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/products"
              element={
                <RequireAdmin>
                  <AdminProductsPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <RequireAdmin>
                  <AdminOrdersPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/collections"
              element={
                <RequireAdmin>
                  <AdminCollectionsPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/homepage"
              element={
                <RequireAdmin>
                  <AdminHomepagePage />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <RequireAdmin>
                  <AdminSettingsPage />
                </RequireAdmin>
              }
            />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route
              path="/account"
              element={
                <RequireAuth>
                  <AccountPage />
                </RequireAuth>
              }
            />
            <Route
              path="/addresses"
              element={
                <RequireAuth>
                  <AddressesPage />
                </RequireAuth>
              }
            />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/update-password" element={<UpdatePasswordPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
