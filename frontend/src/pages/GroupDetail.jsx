import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { groupsAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";
import { FaUsers, FaDoorOpen, FaDoorClosed, FaEdit } from "react-icons/fa";
import { getProfilePicture } from "../utils/imageHelpers";

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    icon: "",
    banner: "",
  });

  useEffect(() => {
    fetchGroupData();
  }, [id]);

  useEffect(() => {
    if (group && user) {
      setIsMember(group.members.some((member) => member._id === user._id));
      setEditForm({
        name: group.name,
        description: group.description,
        icon: group.icon,
        banner: group.banner,
      });
    }
  }, [group, user]);

  const fetchGroupData = async () => {
    try {
      const [groupData, postsData] = await Promise.all([
        groupsAPI.getById(id),
        groupsAPI.getPosts(id),
      ]);
      setGroup(groupData);
      setPosts(postsData);
    } catch (error) {
      console.error("Error fetching group data:", error);
      // navigate('/groups');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLeave = async () => {
    try {
      if (isMember) {
        await groupsAPI.leave(id);
        setIsMember(false);
        setGroup((prev) => ({
          ...prev,
          members: prev.members.filter((m) => m._id !== user._id),
        }));
      } else {
        await groupsAPI.join(id);
        setIsMember(true);
        setGroup((prev) => ({
          ...prev,
          members: [...prev.members, user],
        }));
      }
    } catch (error) {
      console.error("Error joining/leaving group:", error);
    }
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    try {
      const updatedGroup = await groupsAPI.update(id, editForm);
      setGroup((prev) => ({ ...prev, ...updatedGroup }));
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating group:", error);
      alert("Failed to update group");
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!group) return <div className="text-center py-10">Group not found</div>;

  return (
    <div className="container mx-auto px-4 pb-8">
      {/* Header */}
      <div className="relative mb-8">
        <div
          className="h-48 md:h-64 w-full bg-cover bg-center rounded-b-xl"
          style={{
            backgroundImage: group.banner
              ? `url(${group.banner})`
              : "linear-gradient(to right, #8b5cf6, #ec4899)",
          }}
        ></div>
        <div className="absolute -bottom-10 left-4 md:left-10 flex items-end gap-4">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-gray-900 bg-white overflow-hidden shadow-lg">
            {group.icon ? (
              <img
                src={group.icon}
                alt={group.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-600 text-3xl font-bold">
                {group.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="mb-2">
            <h1 className="text-2xl md:text-4xl font-bold text-white drop-shadow-md">
              {group.name}
            </h1>
            <p className="text-white drop-shadow-md opacity-90">
              {group.members.length} members
            </p>
          </div>
        </div>
        <div className="absolute bottom-4 right-4 flex gap-3">
          {group.admins.some((admin) => admin._id === user?._id) && (
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 rounded-full font-bold shadow-lg bg-white text-gray-800 hover:bg-gray-100 transition-all flex items-center gap-2"
            >
              <FaEdit /> Edit
            </button>
          )}
          <button
            onClick={handleJoinLeave}
            className={`px-6 py-2 rounded-full font-bold shadow-lg transition-all ${
              isMember
                ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                : "bg-purple-600 text-white hover:bg-purple-700"
            }`}
          >
            {isMember ? "Joined" : "Join Group"}
          </button>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm sticky top-24">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              About
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {group.description}
            </p>

            <h3 className="font-bold mb-3 text-gray-900 dark:text-white">
              Admins
            </h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {group.admins.map((admin) => (
                <Link
                  to={`/profile/${admin._id}`}
                  key={admin._id}
                  className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full"
                >
                  <img
                    src={getProfilePicture(admin.profilePic)}
                    alt={admin.username}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">
                    {admin.username}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Community Feed
            </h2>
            {isMember && (
              <Link
                to="/upload" // Ideally pass state to pre-select group
                state={{ groupId: group._id, groupName: group.name }}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Post to Group
              </Link>
            )}
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-xl">
              <p className="text-gray-500 dark:text-gray-400">
                No posts yet. Be the first to share!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Group Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Edit Community
            </h2>
            <form onSubmit={handleUpdateGroup}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
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
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Icon URL
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={editForm.icon}
                  onChange={(e) =>
                    setEditForm({ ...editForm, icon: e.target.value })
                  }
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Banner URL
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={editForm.banner}
                  onChange={(e) =>
                    setEditForm({ ...editForm, banner: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetail;
