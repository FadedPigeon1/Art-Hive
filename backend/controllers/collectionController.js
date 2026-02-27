import Collection from "../models/Collection.js";
import Post from "../models/Post.js";

const shapeCollection = (col) => ({
  _id: col._id,
  name: col.name,
  description: col.description,
  isPublic: col.isPublic,
  coverImage: col.coverImage,
  postsCount: col.posts ? col.posts.length : 0,
  posts: col.posts || [],
  userId: col.userId,
  createdAt: col.createdAt,
  updatedAt: col.updatedAt,
});

// @desc    Get current user's own collections (all including private)
// @route   GET /api/collections/my
// @access  Private
export const getMyCollections = async (req, res) => {
  try {
    const collections = await Collection.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ collections: collections.map(shapeCollection) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a user's collections (public only unless own profile)
// @route   GET /api/collections/user/:userId
// @access  Public (optional auth)
export const getUserCollections = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const isOwner = req.user && req.user._id.toString() === userId.toString();

    const filter = { userId };
    if (!isOwner) {
      filter.isPublic = true;
    }

    const collections = await Collection.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit + 1)
      .lean();

    const hasMore = collections.length > limit;
    if (hasMore) collections.pop();

    res.json({ collections: collections.map(shapeCollection), hasMore });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single collection with paginated posts
// @route   GET /api/collections/:id
// @access  Public (optional auth)
export const getCollectionById = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id)
      .populate("userId", "username profilePic")
      .lean();

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    const isOwner =
      req.user && req.user._id.toString() === collection.userId._id.toString();

    if (!collection.isPublic && !isOwner) {
      return res.status(403).json({ message: "This collection is private" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const allPostIds = collection.posts || [];
    const start = (page - 1) * limit;
    const pageSlice = allPostIds.slice(start, start + limit + 1);

    const hasMore = pageSlice.length > limit;
    const postIdsForPage = hasMore ? pageSlice.slice(0, limit) : pageSlice;

    const postsFromDb = await Post.find({ _id: { $in: postIdsForPage } })
      .populate("userId", "username profilePic")
      .lean();

    // Maintain insertion order from collection.posts
    const postMap = new Map(postsFromDb.map((p) => [p._id.toString(), p]));
    const orderedPosts = postIdsForPage
      .map((id) => postMap.get(id.toString()))
      .filter(Boolean);

    res.json({
      collection: {
        _id: collection._id,
        name: collection.name,
        description: collection.description,
        isPublic: collection.isPublic,
        coverImage: collection.coverImage,
        postsCount: allPostIds.length,
        userId: collection.userId,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
      },
      posts: orderedPosts,
      page,
      hasMore,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a collection
// @route   POST /api/collections
// @access  Private
export const createCollection = async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Collection name is required" });
    }

    const collection = await Collection.create({
      userId: req.user._id,
      name: name.trim(),
      description: description ? description.trim() : "",
      isPublic: isPublic !== undefined ? isPublic : true,
    });

    res.status(201).json(shapeCollection(collection.toObject()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a collection
// @route   PUT /api/collections/:id
// @access  Private
export const updateCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    if (collection.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this collection" });
    }

    if (req.body.name !== undefined) {
      collection.name = req.body.name.trim();
    }
    if (req.body.description !== undefined) {
      collection.description = req.body.description.trim();
    }
    if (req.body.isPublic !== undefined) {
      collection.isPublic = req.body.isPublic;
    }

    await collection.save();
    res.json(shapeCollection(collection.toObject()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a collection
// @route   DELETE /api/collections/:id
// @access  Private
export const deleteCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    if (collection.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this collection" });
    }

    await collection.deleteOne();
    res.json({ message: "Collection deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a post to a collection
// @route   PUT /api/collections/:id/posts/:postId
// @access  Private
export const addPostToCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    if (collection.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const post = await Post.findById(req.params.postId).lean();
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const alreadyIn = collection.posts.some(
      (id) => id.toString() === req.params.postId,
    );
    if (alreadyIn) {
      return res
        .status(400)
        .json({ message: "Post already in this collection" });
    }

    collection.posts.push(req.params.postId);

    // Auto-set cover to first post's image
    if (collection.posts.length === 1) {
      collection.coverImage = post.imageUrl;
    }

    await collection.save();
    res.json(shapeCollection(collection.toObject()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove a post from a collection
// @route   DELETE /api/collections/:id/posts/:postId
// @access  Private
export const removePostFromCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    if (collection.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const removedPost = await Post.findById(req.params.postId)
      .select("imageUrl")
      .lean();

    collection.posts = collection.posts.filter(
      (id) => id.toString() !== req.params.postId,
    );

    // Refresh cover image
    if (removedPost && collection.coverImage === removedPost.imageUrl) {
      if (collection.posts.length > 0) {
        const firstPost = await Post.findById(collection.posts[0])
          .select("imageUrl")
          .lean();
        collection.coverImage = firstPost ? firstPost.imageUrl : "";
      } else {
        collection.coverImage = "";
      }
    }

    await collection.save();
    res.json(shapeCollection(collection.toObject()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
