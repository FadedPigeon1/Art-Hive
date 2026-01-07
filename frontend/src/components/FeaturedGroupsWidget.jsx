import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaUsers, FaArrowRight } from "react-icons/fa";
import { groupsAPI } from "../utils/api";

const FeaturedGroupsWidget = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await groupsAPI.getTrending();
        setGroups(data);
      } catch (error) {
        console.error("Failed to fetch featured groups", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm p-4 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (groups.length === 0) return null;

  return (
    <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <FaUsers className="text-blue-500" />
          Featured Communities
        </h3>
      </div>

      <div className="space-y-4">
        {groups.map((group) => (
          <Link
            key={group._id}
            to={`/groups/${group._id}`}
            className="flex items-center gap-3 group hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
              {group.icon ? (
                <img
                  src={group.icon}
                  alt={group.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500 font-bold">
                  {group.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition">
                {group.name}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {group.membersCount} members
              </p>
            </div>
          </Link>
        ))}
      </div>

      <Link
        to="/groups"
        className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition w-full py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
      >
        Explore Groups <FaArrowRight className="text-xs" />
      </Link>
    </div>
  );
};

export default FeaturedGroupsWidget;
