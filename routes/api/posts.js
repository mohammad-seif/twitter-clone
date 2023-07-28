const express = require("express");
const Post = require("../../schemas/PostSchema");
const User = require("../../schemas/UserSchema");
const catchAsync = require("../../appError/catchAsync");
const Notification = require("../../schemas/NotificationSchema");
const router = express.Router();

router.get(
  "/",
  catchAsync(async (req, res, next) => {
    var searchObj = req.query;

    if (searchObj.isReply !== undefined) {
      var isReply = searchObj.isReply == "true";
      searchObj.replyTo = { $exists: isReply };
      delete searchObj.isReply;
    }

    if (searchObj.search !== undefined) {
      searchObj.content = { $regex: searchObj.search, $options: "i" };
      delete searchObj.search;
    }

    if (searchObj.followingOnly !== undefined) {
      var followingOnly = searchObj.followingOnly == "true";

      if (followingOnly) {
        var objectIds = [];

        if (!req.session.user.following) {
          req.session.user.following = [];
        }

        req.session.user.following.forEach((user) => {
          objectIds.push(user);
        });

        objectIds.push(req.session.user._id);
        searchObj.postedBy = { $in: objectIds };
      }

      delete searchObj.followingOnly;
    }

    let result = await getPosts(searchObj);

    res.status(200).send(result);
  })
);

router.get(
  "/:id",
  catchAsync(async (req, res, next) => {
    var postId = req.params.id;

    var postData = await getPosts({ _id: postId });
    postData = postData[0];

    var results = {
      postData: postData,
    };

    if (postData.replyTo !== undefined) {
      results.replyTo = postData.replyTo;
    }

    results.replies = await getPosts({ replyTo: postId });

    res.status(200).send(results);
  })
);

router.post(
  "/",
  catchAsync(async (req, res, next) => {
    if (!req.body.content) {
      return res.status(400).send();
    }

    let postData = {
      content: req.body.content,
      postedBy: req.session.user,
    };

    if (req.body.replyTo) {
      postData.replyTo = req.body.replyTo;
    }

    let post = await Post.create(postData);
    post = await User.populate(post, { path: "postedBy" });
    post = await Post.populate(post, { path: "replyTo" });
    if (post.replyTo !== undefined) {
      await Notification.insertNotification(
        post.replyTo.postedBy,
        req.session.user._id,
        "reply",
        post._id
      );
    }
    res.status(201).send(post);
  })
);

router.put(
  "/:id/like",
  catchAsync(async (req, res, next) => {
    let postId = req.params.id;
    let userId = req.session.user._id;

    let isLiked =
      req.session.user.likes && req.session.user.likes.includes(postId);

    let option = isLiked ? "$pull" : "$addToSet";

    req.session.user = await User.findByIdAndUpdate(
      userId,
      {
        [option]: {
          likes: postId,
        },
      },
      { new: true }
    );

    let post = await Post.findByIdAndUpdate(
      postId,
      {
        [option]: {
          likes: userId,
        },
      },
      { new: true }
    );

    if (!isLiked) {
      await Notification.insertNotification(
        post.postedBy,
        userId,
        "postLike",
        post._id
      );
    }

    res.status(200).send(post);
  })
);

router.post(
  "/:id/retweet",
  catchAsync(async (req, res, next) => {
    let postId = req.params.id;
    let userId = req.session.user._id;

    let deletedPost = await Post.findOneAndDelete({
      postedBy: userId,
      retweetData: postId,
    });

    let option = deletedPost != null ? "$pull" : "$addToSet";

    let repost = deletedPost;

    if (repost == null) {
      repost = await Post.create({
        postedBy: userId,
        retweetData: postId,
      });
    }

    req.session.user = await User.findByIdAndUpdate(
      userId,
      {
        [option]: {
          retweets: repost._id,
        },
      },
      { new: true }
    );

    let post = await Post.findByIdAndUpdate(
      postId,
      {
        [option]: {
          retweetUsers: userId,
        },
      },
      { new: true }
    );

    if (!deletedPost) {
      await Notification.insertNotification(
        post.postedBy,
        userId,
        "retweet",
        post._id
      );
    }

    res.status(200).send(post);
  })
);

router.delete(
  "/:id",
  catchAsync(async (req, res, next) => {
    console.log("hiii");
    console.log(req.params.id);
    await Post.findByIdAndDelete(req.params.id);

    res.status(202).send();
  })
);

router.put("/:id", async (req, res, next) => {
  if (req.body.pinned !== undefined) {
    await Post.updateMany(
      { postedBy: req.session.user },
      { pinned: false }
    ).catch((error) => {
      console.log(error);
      res.sendStatus(400);
    });
  }

  Post.findByIdAndUpdate(req.params.id, req.body)
    .then(() => res.sendStatus(204))
    .catch((error) => {
      console.log(error);
      res.sendStatus(400);
    });
});

async function getPosts(filter) {
  let posts = await Post.find(filter)
    .populate("postedBy")
    .populate("retweetData")
    .populate("replyTo")
    .sort({ createdAt: -1 });

  posts = await User.populate(posts, { path: "replyTo.postedBy" });

  return await User.populate(posts, { path: "retweetData.postedBy" });
}

module.exports = router;
