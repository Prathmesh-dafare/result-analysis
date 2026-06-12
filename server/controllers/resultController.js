const Result = require("../models/Result");
const User = require("../models/User");
const XLSX = require("xlsx");

// @GET /api/results/my
exports.getMyResults = async (req, res, next) => {
  try {
    const results = await Result.find({ student: req.user.id }).sort({
      semester: 1,
    });
    const analytics = computeAnalytics(results);
    res.json({ success: true, results, analytics });
  } catch (err) {
    next(err);
  }
};

// @GET /api/results/student/:id  (teacher/admin)
exports.getStudentResults = async (req, res, next) => {
  try {
    const results = await Result.find({ student: req.params.id }).sort({
      semester: 1,
    });
    const analytics = computeAnalytics(results);
    res.json({ success: true, results, analytics });
  } catch (err) {
    next(err);
  }
};

// @POST /api/results/manual
exports.addManual = async (req, res, next) => {
  try {
    const {
      semester,
      year,
      subjects,
      totalStudents,
      classRank,
      departmentRank,
    } = req.body;
    const studentId =
      req.user.role === "student" ? req.user.id : req.body.studentId;

    const existing = await Result.findOne({ student: studentId, semester });
    if (existing)
      return res.status(400).json({
        success: false,
        message: "Result for this semester already exists",
      });

    // Calculate CGPA across all semesters
    const prev = await Result.find({ student: studentId }).sort({
      semester: 1,
    });
    const result = await Result.create({
      student: studentId,
      semester,
      year,
      subjects,
      totalStudents,
      classRank,
      departmentRank,
      uploadedBy: req.user.id,
    });

    const allResults = [...prev, result].sort(
      (a, b) => a.semester - b.semester,
    );
    const cgpa = calcCGPA(allResults);
    result.cgpa = cgpa;
    if (totalStudents && classRank)
      result.percentile = +((1 - classRank / totalStudents) * 100).toFixed(1);
    await result.save();

    // Push notification to student
    await User.findByIdAndUpdate(studentId, {
      $push: {
        notifications: {
          message: `Semester ${semester} results uploaded!`,
          type: "success",
        },
      },
    });

    res.status(201).json({ success: true, result });
  } catch (err) {
    next(err);
  }
};

// @POST /api/results/upload  (CSV/Excel)
// @POST /api/results/upload
exports.uploadFile = async (req, res, next) => {
  try {
    console.log("========== UPLOAD API HIT ==========");

    if (!req.file) {
      console.log("NO FILE RECEIVED");
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    console.log("FILE NAME:", req.file.originalname);

    const wb = XLSX.read(req.file.buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws);

    console.log("ROWS FROM EXCEL:");
    console.log(rows);

    const errors = [];
    const created = [];

    for (const row of rows) {
      console.log("CURRENT ROW:", row);

      try {
        const roll = row.rollNumber || row.roll_number;

        console.log("SEARCHING STUDENT:", roll);

        const student = await User.findOne({
          rollNumber: roll,
        });

        console.log("FOUND STUDENT:", student);

        if (!student) {
          errors.push(`Roll ${roll}: student not found`);
          continue;
        }

        const subjects = [];
        const keys = Object.keys(row).filter((k) => k.startsWith("sub_"));

        for (const k of keys) {
          const name = k.replace("sub_", "");

          subjects.push({
            name,
            marks: +row[k],
            credits: +(row[`cred_${name}`] || 3),
          });
        }

        const result = await Result.create({
          student: student._id,
          semester: +row.semester,
          year: +row.year,
          subjects,
          uploadedBy: req.user.id,
        });

        created.push(result._id);
      } catch (e) {
        console.log("ROW ERROR:", e);
        errors.push(e.message);
      }
    }

    console.log("CREATED:", created.length);
    console.log("ERRORS:", errors);

    res.json({
      success: true,
      created: created.length,
      errors,
    });
  } catch (err) {
    console.log("UPLOAD ERROR:", err);
    next(err);
  }
};

// @DELETE /api/results/:id
exports.deleteResult = async (req, res, next) => {
  try {
    await Result.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Result deleted" });
  } catch (err) {
    next(err);
  }
};

// @GET /api/results/search
exports.search = async (req, res, next) => {
  try {
    const { q, semester, subject } = req.query;
    let students = [];
    if (q)
      students = await User.find({
        $or: [{ name: new RegExp(q, "i") }, { rollNumber: new RegExp(q, "i") }],
      }).select("_id");

    const filter = {};
    if (students.length) filter.student = { $in: students.map((s) => s._id) };
    if (semester) filter.semester = +semester;

    let results = await Result.find(filter).populate(
      "student",
      "name rollNumber department",
    );
    if (subject)
      results = results.filter((r) =>
        r.subjects.some((s) =>
          s.name.toLowerCase().includes(subject.toLowerCase()),
        ),
      );
    res.json({ success: true, results });
  } catch (err) {
    next(err);
  }
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function calcCGPA(results) {
  let totalPoints = 0,
    totalCredits = 0;
  results.forEach((r) => {
    r.subjects.forEach((s) => {
      totalPoints += (s.gradePoints || 0) * (s.credits || 3);
      totalCredits += s.credits || 3;
    });
  });
  return totalCredits ? +(totalPoints / totalCredits).toFixed(2) : 0;
}

function computeAnalytics(results) {
  if (!results.length) return null;
  const cgpa = calcCGPA(results);
  const sgpas = results.map((r) => ({
    semester: r.semester,
    sgpa: r.sgpa || 0,
  }));
  const latestSGPA = sgpas[sgpas.length - 1]?.sgpa || 0;

  // Subject map
  const subjectMap = {};
  results.forEach((r) => {
    r.subjects.forEach((s) => {
      if (!subjectMap[s.name]) subjectMap[s.name] = [];
      subjectMap[s.name].push(s.marks);
    });
  });
  const subjectAvgs = Object.entries(subjectMap).map(([name, marks]) => ({
    name,
    avg: +(marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(1),
    status:
      marks[marks.length - 1] >= 75
        ? "strong"
        : marks[marks.length - 1] >= 50
          ? "average"
          : "weak",
  }));

  const avgAttendance = (() => {
    let total = 0,
      count = 0;
    results.forEach((r) =>
      r.subjects.forEach((s) => {
        if (s.attendance != null) {
          total += s.attendance;
          count++;
        }
      }),
    );
    return count ? +(total / count).toFixed(1) : null;
  })();

  // Academic health score (0–100)
  const healthScore = Math.min(
    100,
    Math.round(
      (cgpa / 10) * 50 +
        (latestSGPA / 10) * 30 +
        ((avgAttendance || 75) / 100) * 20,
    ),
  );

  // Prediction: linear regression on SGPA trend
  const predicted = predictNextSGPA(sgpas.map((s) => s.sgpa));
  const distinctionProb = cgpa >= 8.5 ? "High" : cgpa >= 7.5 ? "Medium" : "Low";
  const backlogRisk =
    subjectAvgs.filter((s) => s.avg < 40).length > 0 ? "High" : "Low";

  return {
    cgpa,
    sgpas,
    latestSGPA,
    subjectAvgs,
    avgAttendance,
    healthScore,
    predicted,
    distinctionProb,
    backlogRisk,
    rank: results[results.length - 1]?.classRank,
    percentile: results[results.length - 1]?.percentile,
  };
}

function predictNextSGPA(sgpas) {
  if (!sgpas.length) return null;
  if (sgpas.length === 1) return +sgpas[0].toFixed(2);
  const n = sgpas.length;
  const xs = Array.from({ length: n }, (_, i) => i + 1);
  const xm = xs.reduce((a, b) => a + b, 0) / n;
  const ym = sgpas.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - xm) * (sgpas[i] - ym), 0);
  const den = xs.reduce((s, x) => s + (x - xm) ** 2, 0);
  const m = den ? num / den : 0;
  const b = ym - m * xm;
  return +Math.min(10, Math.max(0, m * (n + 1) + b)).toFixed(2);
}

module.exports.computeAnalytics = computeAnalytics;
