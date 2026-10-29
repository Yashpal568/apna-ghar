"use client";

import { useState } from "react";

type Transaction = "buy" | "rent";

export default function MarketplaceSearchForm() {
  const [transaction, setTransaction] = useState<Transaction>("buy");
  const [type, setType] = useState("all property types");
  const [maxPrice, setMaxPrice] = useState("");

  return <div className="ag-marketplace-search-card">
    <div className="ag-marketplace-transaction-tabs" aria-label="Property transaction">
      <button className={transaction === "buy" ? "is-selected" : ""} type="button" aria-pressed={transaction === "buy"} onClick={() => setTransaction("buy")}>Buy</button>
      <button className={transaction === "rent" ? "is-selected" : ""} type="button" aria-pressed={transaction === "rent"} onClick={() => setTransaction("rent")}>Rent</button>
      <button className={type === "plot" ? "is-selected" : ""} type="button" aria-pressed={type === "plot"} onClick={() => setType("plot")}>Plots &amp; land</button>
      <button className={type === "commercial" ? "is-selected" : ""} type="button" aria-pressed={type === "commercial"} onClick={() => setType("commercial")}>Commercial</button>
    </div>
    <form action="/search" className="ag-marketplace-search-form" role="search">
      <label><span>City or locality</span><input name="location" placeholder="Enter city, neighbourhood or PIN code" /></label>
      <label><span>Property type</span><select name="type" value={type} onChange={(event) => setType(event.target.value)}><option value="all property types">All property types</option><option value="house">Independent house</option><option value="apartment">Apartment</option><option value="villa">Villa</option><option value="plot">Plot / land</option><option value="commercial">Commercial</option></select></label>
      <label><span>Maximum budget</span><select name="maxPrice" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)}><option value="">Any budget</option><option value="2500000">Up to ₹25 lakh</option><option value="5000000">Up to ₹50 lakh</option><option value="10000000">Up to ₹1 crore</option><option value="50000000">Up to ₹5 crore</option></select></label>
      <input type="hidden" name="transaction" value={transaction} />
      <button className="button button-primary" type="submit"><span aria-hidden="true">⌕</span> Search properties</button>
    </form>
    <div className="ag-marketplace-search-foot"><span><b>✓</b> Browse at your pace</span><span><b>✓</b> Save listings you like</span><span><b>✓</b> Post your property</span></div>
  </div>;
}
