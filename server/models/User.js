const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true },
  password:   { type: String, required: true, minlength: 6 },
  role:       { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  rollNumber: { type: String, trim: true },
  department: { type: String, trim: true },
  semester:   { type: Number, default: 1 },
  avatar:     { type: String, default: '' },
  theme:      { type: String, default: 'dark-neon' },
  resetPasswordToken:   String,
  resetPasswordExpire:  Date,
  notifications: [{
    message:   String,
    type:      { type: String, enum: ['info','success','warning','danger'], default: 'info' },
    read:      { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Hash password before save
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password
UserSchema.methods.matchPassword = async function(entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', UserSchema);
