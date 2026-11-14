import type { Metadata } from "next";
import PropertySearchResults from "../components/PropertySearchResults";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    page?: string;
  };
}) {
  const loc = searchParams.location?.trim() || "";
  const rawType = (searchParams.type || "").trim().toLowerCase();
  const normalizedCategory =
    rawType === "apartments"
      ? "apartment"
      : rawType === "houses"
      ? "house"
      : rawType === "plots"
      ? "plot"
      : rawType === "villas"
      ? "villa"
      : rawType === "any" || rawType === "all" || rawType === "all property types"
      ? ""
      : rawType;

  const rawTx = (searchParams.transaction || "").trim().toLowerCase();
  const transaction = rawTx === "rent" ? "rent" : rawTx === "buy" || rawTx === "sale" ? "buy" : "all";

  // Determine navbar active tab indicator
  let headerActive = "search";
  if (normalizedCategory === "commercial") {
    headerActive = "commercial";
  } else if (normalizedCategory === "plot") {
    headerActive = "plots";
  } else if (transaction === "buy") {
    headerActive = "buy";
  } else if (transaction === "rent") {
    headerActive = "rent";
  }

  return (
    <div className="search-page-wrapper">
      <SiteHeader active={headerActive} searchValue={loc} />
      <main className="page-shell interior-page">
        <div className="breadcrumb">
          <a href="/">Home</a>
          <span>/</span>
          <span>Explore properties</span>
        </div>

        <section className="search-page-heading">
          <p className="eyebrow">
            {headerActive === "commercial"
              ? "COMMERCIAL REAL ESTATE"
              : headerActive === "plots"
              ? "PLOTS & LAND ACQUISITIONS"
              : transaction === "rent"
              ? "HOMES FOR RENT"
              : transaction === "buy"
              ? "HOMES FOR SALE"
              : loc
              ? `PROPERTIES IN ${loc.toUpperCase()}`
              : "ALL VERIFIED PROPERTIES"}
          </p>
          <h1>
            {loc ? (
              <>
                Properties in <em>{loc}</em>
              </>
            ) : headerActive === "commercial" ? (
              <>
                Commercial Spaces<br />
                <em>Zero Brokerage.</em>
              </>
            ) : headerActive === "plots" ? (
              <>
                Plots &amp; Clear Land<br />
                <em>Direct from Owners.</em>
              </>
            ) : transaction === "rent" ? (
              <>
                Rental Homes<br />
                <em>Direct from Owners.</em>
              </>
            ) : transaction === "buy" ? (
              <>
                Properties for Sale<br />
                <em>Save Brokerage.</em>
              </>
            ) : (
              <>
                Find the place<br />
                that feels <em>right.</em>
              </>
            )}
          </h1>
          <p>
            {loc
              ? `Browse verified direct owner listings in ${loc}. Filter by price, bedrooms, furnishing and configuration.`
              : headerActive === "commercial"
              ? "Explore verified offices, retail shops, warehouses and co-working spaces across India without broker fees."
              : headerActive === "plots"
              ? "Discover residential, agricultural and commercial plots with clear titles and demarcation."
              : transaction === "rent"
              ? "Explore apartments, independent floors and houses for rent directly from verified landlords."
              : transaction === "buy"
              ? "Discover verified apartments, villas, and independent houses for sale with zero middleman commission."
              : "Browse verified direct owner properties across India. Compare prices, specs and connect securely."}
          </p>
        </section>

        <PropertySearchResults
          location={loc}
          transaction={transaction}
          category={normalizedCategory}
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
