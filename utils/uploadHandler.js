let multer = require('multer')
let path = require('path')

//storage - luu o dau, luu ten gi
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        let ext = path.extname(file.originalname)
        let fileName = Date.now() + "-" + Math.round(Math.random() * 1000_000_000) + ext;
        cb(null, fileName)
    }
})
let filterImage = function (req, file, cb) {
    if (file.mimetype.includes("image")) {
        cb(null, true)
    } else {
        cb(new Error("file sai dinh dang"), false)
    }
}
let filterExcel = function (req, file, cb) {
    if (file.mimetype.includes("spreadsheetml")) {
        cb(null, true)
    } else {
        cb(new Error("file sai dinh dang"), false)
    }
}
module.exports = {
    uploadImage: multer({
        storage: storage,
        limits: 5 * 1024 * 1024,
        fileFilter: filterImage
    }),
    uploadExcel: multer({
        storage: storage,
        limits: 5 * 1024 * 1024,
        fileFilter: filterExcel
    })
}

