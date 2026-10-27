"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";

const api=(process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:4000/api/v1").replace(/\/$/,"");

export default function VisitRequestForm({propertyId}:{propertyId:string}) {
  const {isSignedIn,getToken}=useAuth();
  const [date,setDate]=useState("");
  const [time,setTime]=useState("10:00");
  const [message,setMessage]=useState("");
  const [status,setStatus]=useState("");
  const [busy,setBusy]=useState(false);
  if(!isSignedIn) return <a className="button button-outline button-full" href={"/sign-in?redirect_url="+encodeURIComponent("/property/"+propertyId)}>Sign in to request a visit</a>;
  async function submit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();setStatus("");
    if(!date){setStatus("Choose a preferred visit date.");return;}
    setBusy(true);
    try {
      const token=await getToken();
      if(!token)throw new Error("Your session expired. Please sign in again.");
      const response=await fetch(api+"/visit-requests/"+encodeURIComponent(propertyId),{
        method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token,Accept:"application/json"},
        body:JSON.stringify({preferredDate:date,preferredTime:time,message}),
      });
      const body=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(typeof body.message==="string"?body.message:"We couldn't submit the visit request.");
      setStatus("Visit request sent. The owner has not confirmed it yet.");
      setMessage("");
    } catch(error) {setStatus(error instanceof Error?error.message:"Something went wrong. Try again.");}
    finally {setBusy(false);}
  }
  return <form className="visit-request-form" onSubmit={submit}>
    <h3>Request a visit</h3>
    <p className="auth-muted">Choose a preferred time. This sends a request, not a confirmed appointment.</p>
    <label htmlFor="visit-date">Preferred date</label>
    <input id="visit-date" type="date" min={new Date().toISOString().slice(0,10)} value={date} onChange={e=>setDate(e.target.value)} required/>
    <label htmlFor="visit-time">Preferred time</label>
    <select id="visit-time" value={time} onChange={e=>setTime(e.target.value)}><option value="10:00">10:00 AM</option><option value="12:00">12:00 PM</option><option value="14:00">2:00 PM</option><option value="16:00">4:00 PM</option><option value="18:00">6:00 PM</option></select>
    <label htmlFor="visit-message">Message (optional)</label>
    <textarea id="visit-message" rows={3} maxLength={1000} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Anything the owner should know?"/>
    {status&&<p className="form-notice" role="status">{status}</p>}
    <button className="button button-outline button-full" type="submit" disabled={busy}>{busy?"Sending request…":"Request a visit"}</button>
  </form>;
}
