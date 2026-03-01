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
      <div className="bg-background-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-4 animate-pulse">
        <div className="h-6 bg-surface-light dark:bg-background-dark rounded w-1/2 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-3 -mx-2 p-2">
              <div className="w-10 h-10 bg-surface-light dark:bg-background-dark rounded-xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-surface-light dark:bg-background-dark rounded w-3/4"></div>
                <div className="h-2.5 bg-surface-light dark:bg-background-dark rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (groups.length === 0) return null;

  return (
    <div className="bg-background-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-4 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
          Featured Communities
        </h3>
      </div>

      <div className="space-y-3">
        {groups.map((group) => (
          <Link
            key={group._id}
            to={`/groups/${group._id}`}
            className="flex items-center gap-3 group hover:bg-surface-light dark:hover:bg-background-dark p-2 -mx-2 rounded-xl transition-all duration-300"
          >
            <div className="w-10 h-10 bg-surface-light dark:bg-background-dark rounded-xl flex-shrink-0 overflow-hidden ring-2 ring-transparent group-hover:ring-primary-light/30 transition-all duration-300">
              {group.icon ? (
                <img
                  src={group.icon}
                  alt={group.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary-light/10 text-primary-light font-bold">
                  {group.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark truncate group-hover:text-primary-light dark:group-hover:text-primary-light transition-colors">
                {group.name}
              </h4>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                {group.membersCount} members
              </p>
            </div>
          </Link>
        ))}
      </div>

      <Link
        to="/groups"
        className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-primary-light hover:text-primary-dark dark:text-primary-light dark:hover:text-primary-dark transition-colors w-full py-2.5 bg-primary-light/5 hover:bg-primary-light/10 active:bg-primary-light/20 rounded-xl"
      >
        Explore Groups <FaArrowRight className="text-xs" />
      </Link>
    </div>
  );
};

export default FeaturedGroupsWidget;
