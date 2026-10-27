import BrandLogo from "./BrandLogo";
import ThemePicker from "./ThemePicker";

export default function SiteNavbar() {
  return <header className="site-header page-shell premium-navbar">
    <a className="brand" href="/" aria-label="Apna Ghar home"><BrandLogo /></a>
    <form action="/search" className="nav-search" role="search">
      <span aria-hidden="true">⌕</span>
      <input name="location" aria-label="Search by city or locality" placeholder="Search city, locality or project"/>
      <input type="hidden" name="transaction" value="buy"/>
      <button type="submit" aria-label="Search homes">Search homes <span aria-hidden="true">↗</span></button>
    </form>
    <nav className="desktop-nav" aria-label="Main navigation"><a href="/search">Buy</a><a href="/search?transaction=rent">Rent</a><a href="/list-property">Sell</a></nav>
    <div className="header-actions"><ThemePicker compact/><a className="button button-quiet sign-in" href="/sign-in">Sign in</a><a className="button button-primary nav-post" href="/list-property">Post a property <span aria-hidden="true">↗</span></a></div>
  </header>;
}