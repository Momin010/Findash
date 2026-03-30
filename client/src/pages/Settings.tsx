import { useState } from "react";
import { cn } from "../lib/utils";

const tabs = ["Profile", "Preferences", "Notifications"];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("Profile");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === tab
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
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
              <input
                type="text"
                defaultValue="Momin Aldahdouh"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50"
                disabled
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                defaultValue="momin.aldahdooh@gmail.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50"
                disabled
              />
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
                <option value="EUR">EUR (â¬)</option>
                <option value="GBP">GBP (Â£)</option>
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
            
            <div className="flex items-center justify-between py-3 border-b border-slate-50">
              <div>
                <p className="font-medium text-slate-900">Budget Alerts</p>
                <p className="text-sm text-slate-500">Get notified when spending nears budget limits</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4f46e5]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-50">
              <div>
                <p className="font-medium text-slate-900">Weekly Report</p>
                <p className="text-sm text-slate-500">Receive a weekly spending summary</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4f46e5]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-slate-900">Large Transactions</p>
                <p className="text-sm text-slate-500">Alert for transactions over $500</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4f46e5]"></div>
              </label>
            </div>

            <div className="pt-4">
              <button className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
                Save Notifications
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
