import type { Metadata } from "next";
import PropertySearchResults from "../components/PropertySearchResults";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: {
    location?: string;
    type?: string;
    transaction?: string;
  };
}): Promise<Metadata> {
  const loc = searchParams.location?.trim();
  const rawType = searchParams.type?.trim();
  const typeMap: Record<string, string> = {
    apartment: "Flats & Apartments",
    apartments: "Flats & Apartments",
    house: "Villas & Houses",
    houses: "Villas & Houses",
    plot: "Plots & Land",
    plots: "Plots & Land",
    commercial: "Commercial Properties",
    pg: "PG & Co-Living Spaces",
    villa: "Luxury Villas",
    villas: "Luxury Villas",
  };
  const categoryLabel = rawType && rawType !== "all property types" ? typeMap[rawType.toLowerCase()] || rawType : "";
  const tx = searchParams.transaction === "rent" ? "for Rent" : "for Sale";

  let title = "Explore Properties across India | Apna Ghar";
  let description = "Explore verified direct owner property listings across India without agent commission.";

  if (loc && categoryLabel) {
    title = `${categoryLabel} ${tx} in ${loc} | Apna Ghar`;
    description = `Discover verified direct owner ${categoryLabel.toLowerCase()} ${tx} in ${loc}. 0% brokerage on Apna Ghar.`;
  } else if (loc) {
    title = `Properties ${tx} in ${loc} | Direct Owner Homes | Apna Ghar`;
    description = `Explore houses, apartments, and plots ${tx} in ${loc}. Connect directly with owners with zero brokerage.`;
  } else if (categoryLabel) {
    title = `${categoryLabel} ${tx} in India | Apna Ghar`;
    description = `Compare verified direct owner ${categoryLabel.toLowerCase()} ${tx} across top cities in India.`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "Apna Ghar",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function SearchPage({
  searchParams,
}: {
  searchParams: {
    location?: string;
    type?: string;
    transaction?: string;
    minPrice?: string;
    maxPrice?: string;
    minBedrooms?: string;
    minBathrooms?: string;
    furnishing?: string;
    sort?: string;
  };
}) {
  const location = searchParams.location?.trim() || "";
  const rawType = searchParams.type && searchParams.type !== "any" ? searchParams.type : "all property types";
  const type =
    rawType === "apartments"
      ? "apartment"
      : rawType === "houses"
      ? "house"
      : rawType === "plots"
      ? "plot"
      : rawType === "villas"
      ? "villa"
      : rawType;
  const transaction = searchParams.transaction === "rent" ? "rent" : "buy";

  return (
    <div className="search-page-wrapper">
      <SiteHeader active="search" searchValue={location} />
      <main className="page-shell interior-page">
        <div className="breadcrumb">
          <a href="/">Home</a>
          <span>/</span>
          <span>Explore properties</span>
        </div>
        <section className="search-page-heading">
          <p className="eyebrow">
            {location ? `PROPERTIES IN ${location.toUpperCase()}` : "YOUR SEARCH, YOUR PACE"}
          </p>
          <h1>
            {location ? (
              <>
                Homes in <em>{location}</em>
              </>
            ) : (
              <>
                Find the place<br />
                that feels <em>right.</em>
              </>
            )}
          </h1>
          <p>
            {location
              ? `Browse direct owner listings in ${location}. Filter by price, bedrooms and configuration.`
              : "Browse with a clear head. Compare the details that matter to you."}
          </p>
        </section>
        <form action="/search" className="search-card search-page-form">
          <div className="search-field">
            <label htmlFor="location">Location</label>
            <input
              id="location"
              name="location"
              defaultValue={location}
              placeholder="City, area or PIN code"
            />
          </div>
          <div className="search-field">
            <label htmlFor="transaction">Looking to</label>
            <select id="transaction" name="transaction" defaultValue={transaction}>
              <option value="buy">Buy</option>
              <option value="rent">Rent</option>
            </select>
          </div>
          <div className="search-field">
            <label htmlFor="type">Property type</label>
            <select id="type" name="type" defaultValue={type}>
              <option value="all property types">All types</option>
              <option value="apartment">Apartment / flat</option>
              <option value="house">Independent house</option>
              <option value="villa">Villa</option>
              <option value="plot">Plot / land</option>
              <option value="commercial">Commercial property</option>
              <option value="pg">PG &amp; Co-living</option>
            </select>
          </div>
          <div className="search-field">
            <label htmlFor="minPrice">Min price (₹)</label>
            <input
              id="minPrice"
              name="minPrice"
              type="number"
              min="0"
              inputMode="numeric"
              defaultValue={searchParams.minPrice}
              placeholder="No minimum"
            />
          </div>
          <div className="search-field">
            <label htmlFor="maxPrice">Max price (₹)</label>
            <input
              id="maxPrice"
              name="maxPrice"
              type="number"
              min="0"
              inputMode="numeric"
              defaultValue={searchParams.maxPrice}
              placeholder="No maximum"
            />
          </div>
          <div className="search-field">
            <label htmlFor="minBedrooms">Bedrooms</label>
            <select id="minBedrooms" name="minBedrooms" defaultValue={searchParams.minBedrooms || ""}>
              <option value="">Any bedrooms</option>
              <option value="1">1+ bedroom</option>
              <option value="2">2+ bedrooms</option>
              <option value="3">3+ bedrooms</option>
              <option value="4">4+ bedrooms</option>
              <option value="5">5+ bedrooms</option>
            </select>
          </div>
          <div className="search-field">
            <label htmlFor="minBathrooms">Bathrooms</label>
            <select id="minBathrooms" name="minBathrooms" defaultValue={searchParams.minBathrooms || ""}>
              <option value="">Any bathrooms</option>
              <option value="1">1+ bathroom</option>
              <option value="2">2+ bathrooms</option>
              <option value="3">3+ bathrooms</option>
              <option value="4">4+ bathrooms</option>
            </select>
          </div>
          <div className="search-field">
            <label htmlFor="furnishing">Furnishing</label>
            <select id="furnishing" name="furnishing" defaultValue={searchParams.furnishing || ""}>
              <option value="">Any furnishing</option>
              <option value="furnished">Furnished</option>
              <option value="semi-furnished">Semi-furnished</option>
              <option value="unfurnished">Unfurnished</option>
            </select>
          </div>
          <button className="button button-primary" type="submit">
            Update search ↗
          </button>
        </form>
        <PropertySearchResults
          location={location}
          transaction={transaction}
          category={type}
          minPrice={searchParams.minPrice}
          maxPrice={searchParams.maxPrice}
          minBedrooms={searchParams.minBedrooms}
          minBathrooms={searchParams.minBathrooms}
          furnishing={searchParams.furnishing}
          initialSort={searchParams.sort}
        />
        <SiteFooter />
      </main>
    </div>
  );
}
