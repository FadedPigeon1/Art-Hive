import React, { useEffect, useState } from "react";
import { postsAPI } from "../utils/api";
import { Link } from "react-router-dom";
import { FaFire, FaHeart } from "react-icons/fa";

const TrendingCarousel = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const { data } = await postsAPI.getAllPosts(1, 5, "", "trending");
        setPosts(data.posts);
      } catch (error) {
        console.error("Failed to fetch trending posts", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  if (loading)
    return (
      <div className="h-48 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>
    );
  if (posts.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white flex items-center">
        <FaFire className="mr-2 text-orange-500" /> Trending Now
      </h2>
      <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide">
        {posts.map((post) => (
          <div
            key={post._id}
            className="flex-none w-64 group relative rounded-xl overflow-hidden shadow-lg"
          >
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <h3 className="text-white font-bold truncate">{post.title}</h3>
              <p className="text-gray-300 text-sm truncate">
                by {post.userId?.username}
              </p>
              <div className="flex items-center mt-1 text-pink-400 text-xs font-bold">
                <FaHeart className="mr-1" /> {post.likesCount}
              </div>
            </div>
            {/* Clickable overlay */}
            <Link to={`/post/${post._id}`} className="absolute inset-0" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingCarousel;
