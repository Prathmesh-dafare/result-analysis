const { generateResponse } = require("../utils/groq");
const Result = require("../models/Result");
const { computeAnalytics } = require("./resultController");

// ── Helper: build student context string ────────────────────────────────────
async function buildContext(userId) {
  const results = await Result.find({ student: userId }).sort({ semester: 1 });
  const analytics = computeAnalytics(results);
  if (!analytics)
    return { context: "No academic data available yet.", analytics, results };

  const subjectList = analytics.subjectAvgs
    .map((s) => `${s.name}: avg ${s.avg}% (${s.status})`)
    .join(", ");

  const semList = analytics.sgpas
    .map((s) => `Sem ${s.semester}: SGPA ${s.sgpa}`)
    .join(", ");

  const context = `
Student Academic Data:
- CGPA: ${analytics.cgpa}
- Latest SGPA: ${analytics.latestSGPA}
- Academic Health Score: ${analytics.healthScore}/100
- Attendance: ${analytics.avgAttendance ?? "N/A"}%
- Class Rank: ${analytics.rank ?? "N/A"}
- Percentile: ${analytics.percentile ?? "N/A"}%
- Distinction Probability: ${analytics.distinctionProb}
- Backlog Risk: ${analytics.backlogRisk}
- Semester-wise SGPA: ${semList}
- Subject Performance: ${subjectList}
`.trim();

  return { context, analytics, results };
}

// @POST /api/ai/mentor
exports.askMentor = async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question)
      return res
        .status(400)
        .json({ success: false, message: "Question required" });

    const { context } = await buildContext(req.user.id);

    const prompt = `
You are InsightGrade AI — a friendly, expert academic mentor for a student.
Here is the student's real academic data:
${context}

Student's question: "${question}"

Respond in a warm, encouraging, and actionable way. Use bullet points where helpful.
Keep response under 300 words. Address specific data points when relevant.
`;

    const text = await generateResponse(prompt);

    res.json({
      success: true,
      response: text,
    });
  } catch (err) {
    next(err);
  }
};

// @GET /api/ai/roadmap
exports.generateRoadmap = async (req, res, next) => {
  try {
    const { context, analytics } = await buildContext(req.user.id);

    const prompt = `
You are an academic advisor AI. Based on this student's data:
${context}

Generate a structured study roadmap in JSON format:
{
  "weakSubjects": ["..."],
  "daily": ["task1","task2","task3"],
  "weekly": ["goal1","goal2","goal3"],
  "monthly": ["milestone1","milestone2"],
  "tips": ["tip1","tip2","tip3"]
}
Return ONLY valid JSON, no markdown.
`;

    const text = (await generateResponse(prompt))
      .replace(/```json|```/g, "")
      .trim();

    const roadmap = JSON.parse(text);

    res.json({ success: true, roadmap });
  } catch (err) {
    next(err);
  }
};

// @GET /api/ai/story
exports.generateStory = async (req, res, next) => {
  try {
    const { context, analytics } = await buildContext(req.user.id);

    const prompt = `
You are a motivational academic storyteller AI.
Based on this student's journey:
${context}

Write a short, inspiring, personalized "Academic Journey Story" (3-4 sentences).
Make it specific to their actual numbers. Begin with "Your academic journey..."
Return plain text only.
`;

    const story = await generateResponse(prompt);

    res.json({
      success: true,
      story,
    });
  } catch (err) {
    next(err);
  }
};

// @GET /api/ai/resume
exports.generateResume = async (req, res, next) => {
  try {
    const { context, analytics } = await buildContext(req.user.id);

    const prompt = `
You are a professional resume writer AI. Based on this student's academic data:
${context}

Generate 5 impressive resume achievement bullet points in JSON format:
{ "achievements": ["achievement1","achievement2","achievement3","achievement4","achievement5"] }
Make them quantified and impactful. Return ONLY valid JSON.
`;

    const text = (await generateResponse(prompt))
      .replace(/```json|```/g, "")
      .trim();

    const parsed = JSON.parse(text);

    res.json({
      success: true,
      achievements: parsed.achievements,
    });
  } catch (err) {
    next(err);
  }
};

// @GET /api/ai/insight/:resultId
exports.getResultInsight = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.resultId);
    if (!result)
      return res
        .status(404)
        .json({ success: false, message: "Result not found" });

    const subDetails = result.subjects
      .map((s) => `${s.name}: ${s.marks}/${s.maxMarks}`)
      .join(", ");

    const prompt = `
Analyze these semester results and provide 2-3 concise, actionable insights:
Semester: ${result.semester}, SGPA: ${result.sgpa}
Subjects: ${subDetails}
Return as plain text bullet points (•).
`;

    const insight = await generateResponse(prompt);

    await Result.findByIdAndUpdate(req.params.resultId, { aiInsight: insight });
    res.json({ success: true, insight });
  } catch (err) {
    next(err);
  }
};
