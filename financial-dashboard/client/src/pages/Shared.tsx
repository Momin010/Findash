import { useState, useEffect } from "react";
import { Users, Plus, Settings, Eye, Edit, Crown } from "lucide-react";
import { collaborationApi } from "../lib/api";
import { SharedDashboard, CollaboratorRole } from "../lib/types";
import { cn } from "../lib/utils";
import { useNavigate } from "react-router-dom";

export default function Shared() {
  const [dashboards, setDashboards] = useState<SharedDashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboards();
  }, []);

  const loadDashboards = async () => {
    try {
      setLoading(true);
      const response = await collaborationApi.getDashboards();
      if (response.success && response.data) {
        setDashboards(response.data.all || []);
      } else {
        setError(response.error || "Failed to load shared dashboards");
      }
    } catch (err) {
      setError("Failed to load shared dashboards");
    } finally {
      setLoading(false);
    }
  };

  const createDashboard = async (name: string, description?: string, memberEmails?: string[]) => {
    try {
      const response = await collaborationApi.createDashboard({ name, description, memberEmails: memberEmails || [] });
      if (response.success && response.data) {
        setDashboards(prev => [...prev, response.data!]);
        setShowCreateModal(false);
      } else {
        alert(response.error || "Failed to create dashboard");
      }
    } catch (err) {
      alert("Failed to create dashboard");
    }
  };

  const getRoleIcon = (role: CollaboratorRole) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'editor':
        return <Edit className="w-4 h-4 text-blue-500" />;
      case 'viewer':
        return <Eye className="w-4 h-4 text-green-500" />;
      default:
        return <Eye className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleLabel = (role: CollaboratorRole) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'editor':
        return 'Editor';
      case 'viewer':
        return 'Viewer';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Shared Dashboards</h1>
          <p className="text-slate-500 mt-1">Collaborate on financial data with others</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-6"></div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-200 rounded w-full"></div>
                <div className="h-3 bg-slate-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Shared Dashboards</h1>
          <p className="text-slate-500 mt-1">Collaborate on financial data with others</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Error Loading Dashboards</h3>
            <p className="text-slate-500">{error}</p>
            <button
              onClick={loadDashboards}
              className="mt-4 bg-[#4f46e5] hover:bg-[#4338ca] text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Shared Dashboards</h1>
          <p className="text-slate-500 mt-1">Collaborate on financial data with others</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Shared Dashboard</span>
        </button>
      </div>

      {dashboards.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 text-center">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-slate-900 mb-2">No shared dashboards yet</h3>
          <p className="text-slate-500 mb-6">Create your first shared dashboard to start collaborating.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm inline-flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Dashboard</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboards.map((dashboard) => (
            <div
              key={dashboard.id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => navigate(`/dashboard/${dashboard.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 group-hover:text-[#4f46e5] transition-colors">
                    {dashboard.name}
                  </h3>
                  {dashboard.description && (
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                      {dashboard.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Open dashboard settings modal
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded-lg"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Owner</span>
                  <span className="text-slate-900 font-medium">
                    {dashboard.owner?.name || 'You'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Collaborators</span>
                  <div className="flex items-center space-x-1">
                    {dashboard.collaborators?.slice(0, 3).map((collaborator) => (
                      <div
                        key={collaborator.id}
                        className="flex items-center space-x-1 bg-slate-100 px-2 py-1 rounded-full"
                        title={`${collaborator.user?.name || 'Unknown'} - ${getRoleLabel(collaborator.role)}`}
                      >
                        {getRoleIcon(collaborator.role)}
                        <span className="text-xs text-slate-700">
                          {collaborator.user?.name?.split(' ')[0] || 'Unknown'}
                        </span>
                      </div>
                    ))}
                    {dashboard.collaborators && dashboard.collaborators.length > 3 && (
                      <div className="bg-slate-100 px-2 py-1 rounded-full text-xs text-slate-700">
                        +{dashboard.collaborators.length - 3}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Last updated</span>
                  <span className="text-slate-900">
                    {new Date(dashboard.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateDashboardModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createDashboard}
        />
      )}
    </div>
  );
}

function CreateDashboardModal({
  onClose,
  onCreate
}: {
  onClose: () => void;
  onCreate: (name: string, description?: string, memberEmails?: string[]) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [memberEmails, setMemberEmails] = useState<string[]>([]);
  const [emailError, setEmailError] = useState<string | null>(null);

  const addEmail = () => {
    const email = currentEmail.trim().toLowerCase();
    setEmailError(null);

    if (!email) {
      setEmailError("Please enter an email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    if (memberEmails.includes(email)) {
      setEmailError("This email is already added");
      return;
    }

    setMemberEmails([...memberEmails, email]);
    setCurrentEmail("");
  };

  const removeEmail = (emailToRemove: string) => {
    setMemberEmails(memberEmails.filter(e => e !== emailToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    if (!name.trim()) {
      setEmailError("Dashboard name is required");
      return;
    }

    if (memberEmails.length === 0) {
      setEmailError("At least one member email is required");
      return;
    }

    onCreate(name.trim(), description.trim() || undefined, memberEmails);
    setName("");
    setDescription("");
    setMemberEmails([]);
    setCurrentEmail("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Create Shared Dashboard</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Dashboard Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Family Budget 2024"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this shared dashboard..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Add Members <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="email"
                value={currentEmail}
                onChange={(e) => setCurrentEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Email address"
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              />
              <button
                type="button"
                onClick={addEmail}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                Add
              </button>
            </div>
            {emailError && (
              <p className="text-red-500 text-xs mt-1">{emailError}</p>
            )}
          </div>
          {memberEmails.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-600">Members ({memberEmails.length}):</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {memberEmails.map((email) => (
                  <div key={email} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                    <span className="text-sm text-slate-700">{email}</span>
                    <button
                      type="button"
                      onClick={() => removeEmail(email)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#4f46e5] hover:bg-[#4338ca] text-white px-4 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={memberEmails.length === 0}
            >
              Create Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}