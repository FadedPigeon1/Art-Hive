import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { groupsAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { FaUsers, FaPlus, FaSearch } from "react-icons/fa";

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    icon: "",
    banner: "",
    isPrivate: false,
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const data = await groupsAPI.getAll();
      setGroups(data);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await groupsAPI.create(newGroup);
      setShowCreateModal(false);
      setNewGroup({
        name: "",
        description: "",
        icon: "",
        banner: "",
        isPrivate: false,
      });
      fetchGroups();
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <FaUsers /> Communities
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <FaPlus /> Create Group
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading communities...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Link
              to={`/groups/${group._id}`}
              key={group._id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div
                className="h-32 bg-gray-300 bg-cover bg-center"
                style={{
                  backgroundImage: group.banner
                    ? `url(${group.banner})`
                    : "linear-gradient(to right, #8b5cf6, #ec4899)",
                }}
              ></div>
              <div className="p-4">
                <div className="flex items-center gap-4 -mt-10 mb-3">
                  <div className="w-16 h-16 rounded-full border-4 border-white dark:border-gray-800 bg-gray-200 overflow-hidden">
                    {group.icon ? (
                      <img
                        src={group.icon}
                        alt={group.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-600 text-xl font-bold">
                        {group.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {group.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {group.members.length} members
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 line-clamp-2">
                  {group.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Create New Community
            </h2>
            <form onSubmit={handleCreateGroup}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={newGroup.name}
                  onChange={(e) =>
                    setNewGroup({ ...newGroup, name: e.target.value })
                  }
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  required
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={newGroup.description}
                  onChange={(e) =>
                    setNewGroup({ ...newGroup, description: e.target.value })
                  }
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Icon URL (Optional)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={newGroup.icon}
                  onChange={(e) =>
                    setNewGroup({ ...newGroup, icon: e.target.value })
                  }
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Banner URL (Optional)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={newGroup.banner}
                  onChange={(e) =>
                    setNewGroup({ ...newGroup, banner: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
