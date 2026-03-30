var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var multer = require('multer');
var path = require('path');

var messageModel = require('../schemas/message');
let { checkLogin } = require('../utils/authHandler.js');

// Multer: chỉ dùng cho trường hợp request là multipart/form-data và có field `file`
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    let ext = path.extname(file.originalname);
    let fileName = Date.now() + '-' + Math.round(Math.random() * 1000000000) + ext;
    cb(null, fileName);
  },
});

let upload = multer({
  storage: storage,
  limits: 5 * 1024 * 1024,
});

function optionalUpload(req, res, next) {
  // Nếu không phải multipart thì bỏ qua upload để hỗ trợ gửi text bằng JSON
  if (!req.is('multipart/form-data')) {
    return next();
  }
  return upload.single('file')(req, res, next);
}

function parseObjectIdOrThrow(value) {
  try {
    return new mongoose.Types.ObjectId(value);
  } catch (e) {
    throw new Error('invalid ObjectId');
  }
}

// 1) Lấy toàn bộ message giữa user hiện tại và `userID`
router.get('/:userID', checkLogin, async function (req, res, next) {
  try {
    const userObjectId = parseObjectIdOrThrow(req.params.userID);
    const currentUserObjectId = parseObjectIdOrThrow(req.userId);

    const messages = await messageModel
      .find({
        $or: [
          { from: currentUserObjectId, to: userObjectId },
          { from: userObjectId, to: currentUserObjectId },
        ],
      })
      .sort({ createdAt: 1 });

    res.send(messages);
  } catch (e) {
    res.status(400).send({ message: 'userID không hợp lệ' });
  }
});

// 2) Gửi message tới `userID` (hỗ trợ file hoặc text)
// Theo đề bài: `to` nằm trong body (req.body.to).
router.post('/', checkLogin, optionalUpload, async function (req, res, next) {
  try {
    const toObjectId = parseObjectIdOrThrow(req.body.to);
    const fromObjectId = parseObjectIdOrThrow(req.userId);

    let contentType = null;
    let contentText = null;

    if (req.file) {
      // multipart: field `file`
      contentType = 'file';
      contentText = req.file.path;
    } else {
      // JSON hoặc multipart nhưng không có file: field `text` hoặc `messageContent`
      if (typeof req.body?.text === 'string' && req.body.text.trim()) {
        // Hỗ trợ format gửi đơn giản: { to, text }
        contentType = 'text';
        contentText = req.body.text;
      } else if (req.body?.messageContent) {
        // Theo schema: { messageContent: { type, text } }
        let mc = req.body.messageContent;
        if (typeof mc === 'string') {
          try {
            mc = JSON.parse(mc);
          } catch (e) {
            // ignore parse error
          }
        }

        if (mc && typeof mc.text === 'string' && mc.text.trim()) {
          // Nếu client gửi type thì tôn trọng type theo đề bài.
          if (mc.type === 'file' || mc.type === 'text') {
            contentType = mc.type;
          } else {
            // Default: nếu không có/không hợp lệ type => coi là text
            contentType = 'text';
          }
          contentText = mc.text;
        }
      }
    }

    if (!contentType || !contentText) {
      return res.status(400).send({ message: 'Nội dung tin nhắn không hợp lệ' });
    }

    const newMessage = await new messageModel({
      from: fromObjectId,
      to: toObjectId,
      messageContent: {
        type: contentType,
        text: contentText,
      },
    }).save();

    res.status(201).send(newMessage);
  } catch (e) {
    res.status(400).send({ message: e.message || 'Không thể gửi tin nhắn' });
  }
});

// 3) Lấy message cuối cùng với mỗi user mà user hiện tại có nhắn tới/nhận
router.get('/', checkLogin, async function (req, res, next) {
  try {
    const currentUserObjectId = parseObjectIdOrThrow(req.userId);

    const result = await messageModel.aggregate([
      {
        $match: {
          $or: [{ from: currentUserObjectId }, { to: currentUserObjectId }],
        },
      },
      {
        $addFields: {
          otherUser: {
            $cond: [{ $eq: ['$from', currentUserObjectId] }, '$to', '$from'],
          },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$otherUser',
          message: { $first: '$$ROOT' },
        },
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          message: 1,
        },
      },
      { $sort: { 'message.createdAt': -1 } },
    ]);

    res.send(result);
  } catch (e) {
    res.status(400).send({ message: e.message || 'Không thể lấy danh sách' });
  }
});

module.exports = router;

