const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Security helper
const sanitizeName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, '');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    const fileName = sanitizeName(path.basename(file.originalname, ext));
    cb(null, fileName + '-' + uniqueSuffix + ext);
  }
});

// Allowed file types
const allowedTypes = [
  'image/jpeg', 
  'image/png', 
  'image/gif', 
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// File filter configuration
const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(
      `File type ${file.mimetype} not allowed. ` +
      `Supported types: ${allowedTypes.join(', ')}`
    ), false);
  }
};

// Configuration constants
const config = {
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  }
};

// Specific upload configurations
const uploadProfilePic = multer({
  ...config,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for profile pics
    files: 1 // Only 1 file for profile
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profile pictures.'), false);
    }
  }
}).single('profile_picture');

const uploadDocuments = multer({
  ...config
}).array('documents', 5); // Field name and max count

module.exports = {
  upload: multer(config),
  uploadProfilePic,
  uploadDocuments
};