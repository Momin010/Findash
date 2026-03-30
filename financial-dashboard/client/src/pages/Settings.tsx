import { useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { cn } from "../lib/utils";
import { collaborationApi } from "../lib/api";
import { UserPlus, Mail, Trash2 } from "lucide-react";
import CustomSelect, { SelectOption } from "../components/CustomSelect";

const tabs = ["Profile", "Preferences", "Notifications"];

const roleOptions: SelectOption[] = [
  { value: "viewer", label: "Viewer", description: "Can view data only" },
  { value: "editor", label: "Editor", description: "Can view and edit data" },
];

function CollaboratorsTab() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const [inviting, setInviting] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setInviting(true);
    try {
      // For now, we'll invite to the user's default dashboard
      // In a full implementation, users would select which dashboard to share
      const response = await collaborationApi.inviteCollaborator("default", email.trim(), role);
      if (response.success) {
        alert("Invitation sent successfully!");
        setEmail("");
      } else {
        alert(response.error || "Failed to send invitation");
      }
    } catch (err) {
      alert("Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h3 className="font-serif font-bold text-lg text-slate-900 mb-6">Invite Collaborators</h3>

      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
        <h4 className="font-medium text-slate-900 mb-4">Send Invitation</h4>
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              required
            />
          </div>
          <CustomSelect
            label="Permission Level"
            options={roleOptions}
            value={role}
            onChange={(e) => setRole(e as "viewer" | "editor")}
            placeholder="Select a permission level"
            maxHeight="max-h-40"
          />
          <button
            type="submit"
            disabled={inviting}
            className="bg-[#4f46e5] hover:bg-[#4338ca] disabled:bg-slate-400 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>{inviting ? "Sending..." : "Send Invitation"}</span>
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <h4 className="font-medium text-slate-900 mb-4">Current Collaborators</h4>
        <div className="text-center py-8 text-slate-500">
          <Mail className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p>No collaborators yet. Send your first invitation above!</p>
        </div>
        {/* TODO: Add list of current collaborators with management options */}
      </div>
    </div>
  );
}

export default function Settings() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState("Profile");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}>
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-2xl">
        {activeTab === "Profile" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="font-serif font-bold text-lg text-slate-900 mb-6">Profile Information</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
              <input type="text" defaultValue={user?.name || ''} readOnly
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input type="email" defaultValue={user?.email || ''} readOnly
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50" />
            </div>
            <p className="text-sm text-slate-500 pt-4 border-t border-slate-100">
              Profile info is managed by your account settings.
            </p>
          </div>
        )}

        {activeTab === "Preferences" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="font-serif font-bold text-lg text-slate-900 mb-6">Display Preferences</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Currency</label>
              <select className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white">
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Theme</label>
              <select className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System Default</option>
              </select>
            </div>
            <div className="pt-4">
              <button className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
                Save Preferences
              </button>
            </div>
          </div>
        )}

        {activeTab === "Notifications" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="font-serif font-bold text-lg text-slate-900 mb-6">Notification Preferences</h3>
            {[
              { label: "Budget Alerts", desc: "Get notified when spending nears budget limits", checked: true },
              { label: "Weekly Report", desc: "Receive a weekly spending summary", checked: true },
              { label: "Large Transactions", desc: "Alert for transactions over $500", checked: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                <div>
                  <p className="font-medium text-slate-900">{item.label}</p>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked={item.checked} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4f46e5]"></div>
                </label>
              </div>
            ))}
            <div className="pt-4">
              <button className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
                Save Notifications
              </button>
            </div>
          </div>
        )}

        {activeTab === "Collaborators" && (
          <CollaboratorsTab />
        )}
      </div>
    </div>
  );
}
