const { User } = require('../models');
const { Game } = require('../models');
const { Post } = require('../models');
const { Comment } = require('../models');
const { Reaction } = require('../models');
const { Notification } = require('../models');
const { signToken, AuthenticationError } = require('../utils/auth.js');
const mongoose = require('mongoose');
const { ObjectId } = require('mongoose');

const resolvers = {
  Query: {
    // parent, args, then context
    me: async (_, __, context) => {
      if (context.user) {
        return await User.findOne({ _id: context.user._id });
      }
      throw new AuthenticationError('You must be logged in to view this information!');
    },
    getPost: async (_, { postId }, context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to view this post!');
      }
      return await Post.findById(postId);
    },
    getAllPosts: async (_, __, context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to view posts!');
      }
      return await Post.find();
    },
    comments: async (parent, { postId }, context) => {
      try {
        const comments = await Comment.find({ post: postId }).populate('author');
        return comments;
      } catch (error) {
        throw new Error('Failed to fetch comments');
      }
    },
  },
  Mutation: {
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw AuthenticationError('Invalid email or password');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw AuthenticationError;
      }

      const token = signToken(user);

      return { token, user };
    },
    createPost: async (_, { title, content, authorId }, context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to create a post!');
      }
      const newPost = new Post({ title, content, author: authorId });
      const savedPost = await newPost.save();
      // Format timestamps to a readable format
      savedPost.createdAt = savedPost.createdAt.toLocaleString();
      savedPost.updatedAt = savedPost.updatedAt.toLocaleString(); 
      return savedPost;
    },
    updatePost: async (_, { postId, content }, context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to update a post!');
      }

      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { content, updatedAt: new Date().toISOString() },
        { new: true }
      );
      if (!updatedPost) {
        throw new Error('Post not found')
      }
      return updatedPost;
    },
    // delete post function 
    deletePost: async (_, { postId }) => {
      try {
        const deletedPost = await Post.findByIdAndDelete(postId);

        if (!deletedPost) {
          throw new Error('Post not found');
        }

        return deletedPost; // Return the deleted post
      } catch (error) {
        console.error('Error deleting post:', error);
        throw new Error('Failed to delete post');
      }
    },
    addComment: async (parent, { postId, text, authorId }, context) => {
      try {
        const newComment = new Comment({
          content: text,
          author: authorId,
          post: postId,
        });
        const savedComment = await newComment.save();
        return savedComment;
      } catch (error) {
        throw new Error('Failed to add comment');
      }
    },
    updateComment: async (parent, { id, text }, context) => {
      try {
        const updatedComment = await Comment.findByIdAndUpdate(
          id,
          { text, updatedAt: new Date() }, // Set text and updatedAt fields
          { new: true }
        );

        if (!updatedComment) {
          throw new Error('Comment not found');
        }

        return updatedComment;
      } catch (error) {
        throw new Error('Failed to update comment');
      }
    },
    deleteComment: async (parent, { id }, context) => {
      try {
        await Comment.findByIdAndDelete(id);
        return id;
      } catch (error) {
        throw new Error('Failed to delete comment');
      }
    },
    // addToWishlist: async (parent, { input }, context) => {
    //   const { userId } = context.user;
    //   const { gameId } = input;

    //   try {
    //     const game = await Game.findById(ObjectId(gameId));


    //     if (!game) {
    //       throw new Error('Game not found');
    //     }

    //     await User.findByIdAndUpdate(userId, { $push: { wishlist: game } });

    //     return game;
    //   } catch (error) {
    //     console.error('Error adding to wishlist:', error);
    //     throw new Error('Failed to add to wishlist');
    //   }
    // },
    // addToWishlist: async (_, { input }, context) => {
    //   // Ensure the user is logged in
    //   if (context.user) {
    //     const { userId } = context.user;
    //     const { gameId } = input;
    //     console.log(`Attempting to add game with ID: ${gameId}`);
    //     try {
    //       // Check if the game exists
    //       const game = await gameSchema.findById(gameId);
    //       if (!game) {
    //         throw new Error('Game not found');
    //       }

    //       // Add the game to the user's wishlist
    //       const updatedUser = await User.findByIdAndUpdate(
    //         userId,
    //         { $addToSet: { wishlist: ObjectId(game.id) } },
    //         { new: true, runValidators: true }
    //       );

    //       return game; // Return the added game
    //     } catch (error) {
    //       console.error('Error adding to wishlist:', error);
    //       throw new ApolloError('Failed to add to wishlist', 'ADD_TO_WISHLIST_ERROR');
    //     }
    //   } else {
    //     throw new AuthenticationError('Not logged in');
    //   }
    // },

    addToWishlist: async (_, { input }, context) => {
      // Ensure the user is logged in
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { wishlist: input } },
          { new: true, runValidators: true }
        );
        return updatedUser;
      }

      throw new AuthenticationError('Not logged in');
    },

    addToCurrentlyPlaying: async (parent, { input }, context) => {
      const { userId } = context.user;
      const { gameId } = input;

      try {
        const game = await Game.findById(gameId);

        if (!game) {
          throw new Error('Game not found');
        }

        await User.findByIdAndUpdate(userId, {
          $push: { currentlyPlaying: game },
        });

        return game;
      } catch (error) {
        console.error('Error adding to currently playing:', error);
        throw new Error('Failed to add to currently playing');
      }
    },
  },
  Post: {
    author: async (parent) => {
      return await User.findById(parent.author);
    },
  },
};

module.exports = resolvers;