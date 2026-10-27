"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";

export default function PropertyReportForm({propertyId}:{propertyId:string}) {
  if(!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return <a className="text-link" href={"/sign-in?redirect_url="+encodeURIComponent("/property/"+propertyId)}>Sign in to report this listing</a>;
  return <AuthenticatedPropertyReportForm propertyId={propertyId}/>;
}

function AuthenticatedPropertyReportForm({propertyId}:{propertyId:string}) {
  const {isSignedIn,getToken}=useAuth();
  const [open,setOpen]=useState(false);
  const [reason,setReason]=useState("misleading");
  const [details,setDetails]=useState("");
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("");
  if(!isSignedIn) return <a className="text-link" href={"/sign-in?redirect_url="+encodeURIComponent("/property/"+propertyId)}>Sign in to report this listing</a>;
  async function submit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();setBusy(true);setNotice("");
    try {
      const token=await getToken();if(!token)throw new Error("Please sign in again.");
      const api=(process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:4000/api/v1").replace(/\/$/,"");
      const response=await fetch(api+"/property-reports/"+encodeURIComponent(propertyId),{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token,Accept:"application/json"},body:JSON.stringify({reason,details})});
      const body=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(typeof body.message==="string"?body.message:"Report could not be submitted.");
      setNotice("Report submitted. Our team can review it.");setDetails("");setOpen(false);
    } catch(error) {setNotice(error instanceof Error?error.message:"Something went wrong.");}
    finally {setBusy(false);}
  }
  return <div className="property-report">
    <button type="button" className="text-link" onClick={()=>setOpen(value=>!value)}>{open?"Cancel report":"Report this listing"}</button>
    {open&&<form className="visit-request-form" onSubmit={submit}>
      <label htmlFor="report-reason">Reason for report</label>
      <select id="report-reason" value={reason} onChange={e=>setReason(e.target.value)}><option value="misleading">Misleading listing</option><option value="duplicate">Duplicate listing</option><option value="scam">Possible scam or fraud</option><option value="wrong_information">Incorrect information</option><option value="inappropriate">Inappropriate content</option><option value="other">Other</option></select>
      <label htmlFor="report-details">Details (optional)</label>
      <textarea id="report-details" rows={3} maxLength={1500} value={details} onChange={e=>setDetails(e.target.value)} placeholder="Tell us what looks wrong."/>
      <button className="button button-outline button-full" type="submit" disabled={busy}>{busy?"Submitting…":"Submit report"}</button>
    </form>}
    {notice&&<p className="form-notice" role="status">{notice}</p>}
  </div>;
}
