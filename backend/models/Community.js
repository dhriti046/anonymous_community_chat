const mongoose = require("mongoose");

const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      default: "General",
      enum: [
        "General",
        "Campus Life",
        "Events",
        "Sports",
        "Gaming",
        "Clubs",
        "Hostel",
        "Creative",
        "Study",
        "Random",
        "Fest",
        "Mess",
        "Tech",
        "Art",
        "Music",
        "Books",
        "Other",
      ],
    },
    icon: {
      type: String,
      default: "💬",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Community", communitySchema);
