const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  code:          { type: String },
  marks:         { type: Number, required: true, min: 0, max: 100 },
  maxMarks:      { type: Number, default: 100 },
  credits:       { type: Number, default: 3 },
  grade:         { type: String },
  gradePoints:   { type: Number },
  attendance:    { type: Number, min: 0, max: 100 },
  category:      { type: String, enum: ['core','elective','lab','project'], default: 'core' }
});

const ResultSchema = new mongoose.Schema({
  student:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  semester:   { type: Number, required: true, min: 1, max: 10 },
  year:       { type: Number, required: true },
  subjects:   [SubjectSchema],
  sgpa:       { type: Number },
  cgpa:       { type: Number },
  totalCredits:    { type: Number },
  earnedCredits:   { type: Number },
  classRank:       { type: Number },
  departmentRank:  { type: Number },
  percentile:      { type: Number },
  totalStudents:   { type: Number },
  remarks:         { type: String },
  uploadedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  aiInsight:       { type: String },
}, { timestamps: true });

// Auto-calculate SGPA before save
ResultSchema.pre('save', function(next) {
  if (this.subjects && this.subjects.length > 0) {
    let totalPoints = 0, totalCredits = 0;
    this.subjects.forEach(sub => {
      const pct = (sub.marks / sub.maxMarks) * 100;
      let gp = 0;
      if (pct >= 90)      gp = 10;
      else if (pct >= 80) gp = 9;
      else if (pct >= 70) gp = 8;
      else if (pct >= 60) gp = 7;
      else if (pct >= 50) gp = 6;
      else if (pct >= 40) gp = 5;
      else                gp = 0;

      sub.gradePoints = gp;
      sub.grade = ['O','A+','A','B+','B','C','F'][[10,9,8,7,6,5,0].indexOf(gp)] || 'F';
      totalPoints  += gp * sub.credits;
      totalCredits += sub.credits;
    });
    this.sgpa         = totalCredits ? +(totalPoints / totalCredits).toFixed(2) : 0;
    this.totalCredits = totalCredits;
  }
  next();
});

module.exports = mongoose.model('Result', ResultSchema);
