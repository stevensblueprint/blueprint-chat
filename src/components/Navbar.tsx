import logoBanner from "@/assets/logo_banner.png";

export function Navbar() {
  return (
    <nav className="w-full h-16 bg-white border-b border-border flex items-center px-6 sticky top-0 z-50">
      <div className="w-full flex items-center">
        <a href="/" className="flex items-center">
          <img src={logoBanner} alt="Blueprint Logo" className="h-8" />
        </a>
      </div>
    </nav>
  );
}
