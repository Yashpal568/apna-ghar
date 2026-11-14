import BrandLogo from "./BrandLogo";

const groups = [
  {
    title: "Discover",
    links: [
      ["Buy a home", "/buy"],
      ["Rent a home", "/rent"],
      ["Commercial properties", "/commercial"],
      ["Residential plots", "/plots"],
      ["All properties", "/search"],
      ["Saved homes", "/saved"],
    ],
  },
  {
    title: "Top Cities",
    links: [
      ["Mumbai", "/mumbai"],
      ["Delhi NCR", "/delhi"],
      ["Bengaluru", "/bengaluru"],
      ["Hyderabad", "/hyderabad"],
      ["Pune", "/pune"],
      ["Amritsar", "/amritsar"],
    ],
  },
  {
    title: "Property Types",
    links: [
      ["Apartments & Flats", "/apartments"],
      ["Villas & Houses", "/houses"],
      ["Plots & Land", "/plots"],
      ["Commercial Spaces", "/commercial"],
      ["PG & Co-living", "/pg"],
    ],
  },
  {
    title: "For Owners",
    links: [
      ["Post a property", "/list-property"],
      ["My listings", "/my-listings"],
      ["My profile", "/profile"],
    ],
  },
  {
    title: "Trust & Legal",
    links: [
      ["About Apna Ghar", "/about"],
      ["Trust & safety", "/safety"],
      ["Community guidelines", "/guidelines"],
      ["Contact support", "/contact"],
      ["Privacy policy", "/privacy"],
      ["Terms of use", "/terms"],
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="ag-site-footer">
      <div className="ag-footer-main">
        <div className="ag-footer-brand">
          <a href="/" aria-label="Apna Ghar home">
            <BrandLogo />
          </a>
          <p>
            India's direct owner property marketplace. Connect directly with owners with 0% brokerage and verified property details.
          </p>
          <span className="ag-footer-promise">
            <span />
            100% Direct Deals • Zero Brokerage • Transparent Details
          </span>
        </div>
        {groups.map((group) => (
          <div className="ag-footer-group" key={group.title}>
            <h2>{group.title}</h2>
            {group.links.map(([label, url]) => (
              <a href={url} key={url}>
                {label}
              </a>
            ))}
          </div>
        ))}
      </div>
      <div className="ag-footer-bottom">
        <span>© {new Date().getFullYear()} Apna Ghar. All rights reserved.</span>
        <span>Property listings are published directly by owners. Verify information independently before executing agreements.</span>
      </div>
    </footer>
  );
}
