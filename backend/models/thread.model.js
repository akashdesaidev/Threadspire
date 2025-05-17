const mongoose = require("mongoose");

const segmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    reactions: {
      "🤯": {
        count: { type: Number, default: 0 },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
      "💡": {
        count: { type: Number, default: 0 },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
      "😌": {
        count: { type: Number, default: 0 },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
      "🔥": {
        count: { type: Number, default: 0 },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
      "🫶": {
        count: { type: Number, default: 0 },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
    },
  },
  {
    timestamps: true,
  }
);

const threadSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    segments: [segmentSchema],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    bookmarkCount: {
      type: Number,
      default: 0,
    },
    forkCount: {
      type: Number,
      default: 0,
    },
    originalThread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
      default: null,
    },
    originalAuthor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Add a virtual for total reactions
threadSchema.virtual("totalReactions").get(function () {
  // Check if segments exist and is an array
  if (
    !this.segments ||
    !Array.isArray(this.segments) ||
    this.segments.length === 0
  ) {
    return 0;
  }

  return this.segments.reduce((total, segment) => {
    // Check if segment and segment.reactions exist
    if (!segment || !segment.reactions) {
      return total;
    }

    const segmentTotal = Object.values(segment.reactions).reduce(
      (sum, reaction) => sum + (reaction?.count || 0),
      0
    );
    return total + segmentTotal;
  }, 0);
});

// Enable virtuals in JSON
threadSchema.set("toJSON", { virtuals: true });
threadSchema.set("toObject", { virtuals: true });

const Thread = mongoose.model("Thread", threadSchema);

module.exports = Thread;
