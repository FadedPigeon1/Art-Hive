import React from "react";
import { FiGrid, FiLock } from "react-icons/fi";

const CollectionCard = ({ collection, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 bg-surface-light dark:bg-surface-dark"
    >
      {collection.coverImage ? (
        <img
          src={collection.coverImage}
          alt={collection.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700">
          <FiGrid size={48} className="text-gray-300 dark:text-gray-500" />
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
        <h3 className="text-white font-bold truncate">{collection.name}</h3>
        <p className="text-white/70 text-sm mt-0.5">
          {collection.postsCount || 0} artwork
          {collection.postsCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Privacy badge */}
      {!collection.isPublic && (
        <div className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full">
          <FiLock size={13} className="text-white" />
        </div>
      )}

      {/* Always-visible bottom strip (when no hover) */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent group-hover:opacity-0 transition-opacity duration-300">
        <h3 className="text-white font-semibold text-sm truncate">
          {collection.name}
        </h3>
      </div>
    </div>
  );
};

export default CollectionCard;
