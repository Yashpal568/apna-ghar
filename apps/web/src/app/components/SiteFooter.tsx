import BrandLogo from "./BrandLogo";

const groups = [
  { title: "Discover", links: [["Buy a home", "/search?transaction=buy"], ["Rent a home", "/search?transaction=rent"], ["Explore properties", "/search"], ["Saved homes", "/saved"], ["Appearance & themes", "/appearance"]] },
  { title: "For owners", links: [["Post a property", "/list-property"], ["My listings", "/my-listings"], ["My profile", "/profile"]] },
  { title: "Trust & support", links: [["Trust & safety", "/safety"], ["About Apna Ghar", "/about"], ["Contact", "/contact"]] },
  { title: "Legal", links: [["Privacy policy", "/privacy"], ["Terms of use", "/terms"]] },
];

export default function SiteFooter() {
  return <footer className="ag-site-footer">
    <div className="ag-footer-main">
      <div className="ag-footer-brand"><a href="/" aria-label="Apna Ghar home"><BrandLogo /></a><p>Find a place to call home. Explore properties, compare the details that matter and connect with confidence.</p><span className="ag-footer-promise"><span />Thoughtful search. Better decisions.</span></div>
      {groups.map(group => <div className="ag-footer-group" key={group.title}><h2>{group.title}</h2>{group.links.map(([label, url]) => <a href={url} key={url}>{label}</a>)}</div>)}
    </div>
    <div className="ag-footer-bottom"><span>© {new Date().getFullYear()} Apna Ghar. All rights reserved.</span><span>Property details are provided by listing owners. Verify information before making decisions.</span></div>
  </footer>;
}