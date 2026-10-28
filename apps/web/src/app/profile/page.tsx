import dynamic from "next/dynamic";

const ProfileClient = dynamic(() => import("./profile-client"), {
  ssr: false,
  loading: () => (
    <main className="interior-page">
      <div className="profile-page-shell">
        <p className="form-notice" role="status">Loading your profile…</p>
      </div>
    </main>
  ),
});

export default function ProfilePage() {
  return <ProfileClient />;
}
