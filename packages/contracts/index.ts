export type PropertyCategory = 'house' | 'apartment' | 'villa' | 'plot' | 'other';
export type ListingStatus = 'active' | 'hidden' | 'removed';
export interface ApiHealthResponse { status:'ok'; service:'apna-ghar-api'; timestamp:string; note:string }
export interface PropertySummary { id:string; title:string; category:PropertyCategory; price:number; currency:'INR'; city:string; locality?:string; status:ListingStatus }