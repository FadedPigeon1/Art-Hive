import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { groupsAPI } from "../utils/api/groups";
import { useAuth } from "../context/AuthContext";

const FeaturedGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await groupsAPI.getAll({ limit: 5 });
        setGroups(data);
      } catch (error) {
        console.error("Error fetching featured groups:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">
          Trending Groups
        </h3>
        <Link
          to="/groups"
          className="text-sm text-primary-light dark:text-primary-dark hover:underline"
        >
          View All
        </Link>
      </div>
      <div className="space-y-3">
        {groups.map((group) => (
          <Link
            key={group._id}
            to={`/groups/${group._id}`}
            className="flex items-center space-x-3 group hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg transition-colors"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
              {group.icon ? (
                <img
                  src={group.icon}
                  alt={group.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-lg">
                  {group.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-800 dark:text-white truncate group-hover:text-primary-light dark:group-hover:text-primary-dark transition-colors">
                {group.name}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {group.membersCount || group.members.length} members
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FeaturedGroups;
