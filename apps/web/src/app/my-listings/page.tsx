import type { Metadata } from "next";
import ThemePicker from "../components/ThemePicker";

export const metadata: Metadata = {
  title: "My listings",
  description: "Manage the property listings you publish on Apna Ghar.",
};

export default function MyListingsPage() {
  return (
    <main className="page-shell interior-page">
      <header className="site-header interior-header">
        <a className="brand" href="/" aria-label="Apna Ghar home">
          <span className="brand-placeholder">INSERT APPROVED APNA GHAR LOGO ASSET</span>
          <span className="brand-name">Apna <b>Ghar</b></span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="/search">Explore homes</a>
          <a href="/list-property">List property</a>
        </nav>
        <div className="header-actions"><ThemePicker compact /></div>
      </header>

      <div className="breadcrumb"><a href="/">Home</a><span>/</span><span>My listings</span></div>

      <section className="listing-intro">
        <p className="eyebrow">OWNER WORKSPACE</p>
        <h1>Your properties,<br /><em>all in one place.</em></h1>
        <p>Manage the homes and spaces you advertise on Apna Ghar.</p>
      </section>

      <section className="owner-dashboard-panel">
        <div className="owner-dashboard-heading">
          <div><p className="eyebrow">PROPERTY MANAGEMENT</p><h2>My listings</h2></div>
          <a className="button button-primary" href="/list-property">Post a property <span aria-hidden="true">↗</span></a>
        </div>
        <div className="owner-empty-state">
          <div className="owner-empty-icon" aria-hidden="true">⌂</div>
          <h3>Your listing workspace is ready</h3>
          <p>Sign-in integration is the next step. Once Clerk is connected, this page will load your own listings, statuses and management actions from the protected API.</p>
          <div className="owner-empty-actions"><a className="button button-primary" href="/sign-in">Continue to sign in</a><a className="button button-outline" href="/list-property">Start a listing</a></div>
        </div>
        <p className="form-help">Integration status: owner API endpoints are implemented; this screen does not yet fetch account data. Do not treat this preview as a connected dashboard.</p>
      </section>
      <footer className="simple-footer">Apna Ghar · Owner workspace</footer>
    </main>
  );
}
