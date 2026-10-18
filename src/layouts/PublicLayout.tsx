import { Outlet } from "react-router-dom";
import { domAnimation, LazyMotion } from "motion/react";
import SiteFooter from "../components/layout/SiteFooter";
import SiteHeader from "../components/layout/SiteHeader";

// LazyMotion loads only the animation features the site uses. Components
// inside it must use `m.*` elements, not `motion.*` (strict mode enforces it).
function PublicLayout() {
  return (
    <LazyMotion features={domAnimation} strict>
      <div className="flex min-h-screen flex-col bg-blyver-ink">
        <SiteHeader />
        <div className="flex-1">
          <Outlet />
        </div>
        <SiteFooter />
      </div>
    </LazyMotion>
  );
}

export default PublicLayout;
