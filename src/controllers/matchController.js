/**
 * Match Controller — AI-Powered (Python cosine similarity engine)
 * ================================================================
 * Fetches user + skill data from MongoDB, then delegates similarity
 * scoring to the Python AI microservice (deployed on Render).
 *
 * Falls back to a pure-JS cosine similarity engine if the Python
 * service is unreachable (so the app still works in dev without it).
 *
 * GET /api/matches   →  returns top-N collaboration recommendations
 *                        with match_percentage, suggested_skills,
 *                        similarity_raw, collaboration_reason
 */

const { asyncHandler } = require('../utils/helpers');
const { User, Skill } = require('../models');
const http  = require('http');
const https = require('https');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

// ─────────────────────────────────────────────────────────────────
// Proficiency weights (used by JS fallback only)
// ─────────────────────────────────────────────────────────────────
const PROFICIENCY_WEIGHT = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };

// ─────────────────────────────────────────────────────────────────
// JS fallback cosine similarity (no Python needed)
// ─────────────────────────────────────────────────────────────────
const cosineSimilarityJS = (vec1, vec2) => {
  let dot = 0, mag1 = 0, mag2 = 0;
  for (let i = 0; i < vec1.length; i++) {
    dot  += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  if (mag1 === 0 || mag2 === 0) return 0;
  return dot / (mag1 * mag2);
};

const buildVectorJS = (skills, vocabulary) =>
  vocabulary.map(v => {
    const s = skills.find(sk => sk.skill_name.toLowerCase() === v);
    return s ? (PROFICIENCY_WEIGHT[s.proficiency_level] || 1) : 0;
  });

const jsFallbackMatch = (mySkills, allUsers) => {
  const allSkillNames = new Set();
  mySkills.forEach(s => allSkillNames.add(s.skill_name.toLowerCase()));
  allUsers.forEach(u => u.skills.forEach(s => allSkillNames.add(s.skill_name.toLowerCase())));
  const vocabulary = [...allSkillNames];

  const myVector = buildVectorJS(mySkills, vocabulary);

  return allUsers
    .filter(u => u.skills.length > 0)
    .map(u => {
      const uVec = buildVectorJS(u.skills, vocabulary);
      const sim  = cosineSimilarityJS(myVector, uVec);

      const myReqs    = mySkills.filter(s => s.type === 'request').map(s => s.skill_name.toLowerCase());
      const theirOffs = u.skills.filter(s => s.type === 'offer').map(s => s.skill_name.toLowerCase());
      const overlap   = myReqs.filter(r => theirOffs.includes(r));
      const bonus     = overlap.length * 0.05;

      const pct = Math.min(Math.round((sim + bonus) * 100), 99);

      let reason = 'Potential collaboration match';
      if (overlap.length) reason = `Offers ${overlap.slice(0, 2).map(x => x.charAt(0).toUpperCase() + x.slice(1)).join(', ')} you are seeking`;
      else if (sim > 0.5)  reason = 'Strong shared skill overlap';
      else if (sim > 0.2)  reason = 'Complementary skill profile';

      return {
        user: { id: u._id, name: u.name, college: u.college, department: u.department },
        match_percentage:      pct,
        similarity_raw:        sim.toFixed(4),
        suggested_skills:      u.skills.map(s => s.skill_name).slice(0, 4),
        collaboration_reason:  reason,
      };
    })
    .filter(m => m.match_percentage > 0)
    .sort((a, b) => b.match_percentage - a.match_percentage)
    .slice(0, 10);
};

// ─────────────────────────────────────────────────────────────────
// Call Python AI microservice (supports both HTTP and HTTPS)
// ─────────────────────────────────────────────────────────────────
const callPythonAI = (payload) =>
  new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const url  = new URL('/api/ai/matches', AI_SERVICE_URL);

    // Pick http or https module based on the URL protocol
    const transport = url.protocol === 'https:' ? https : http;
    const defaultPort = url.protocol === 'https:' ? 443 : 5001;

    const options = {
      hostname: url.hostname,
      port:     url.port || defaultPort,
      path:     url.pathname,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 15000,
    };

    const req = transport.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('AI service returned invalid JSON')); }
      });
    });

    req.on('timeout', () => { req.destroy(); reject(new Error('AI service timeout')); });
    req.on('error',   reject);
    req.write(body);
    req.end();
  });

// ─────────────────────────────────────────────────────────────────
// GET /api/matches  — main handler
// ─────────────────────────────────────────────────────────────────
const getMatches = asyncHandler(async (req, res) => {
  // 1️⃣  Fetch current user's skills
  const mySkills = await Skill.find({ user_id: req.user._id }).lean();

  if (mySkills.length === 0) {
    return res.status(200).json({ success: true, data: [] });
  }

  // 2️⃣  Fetch all other users + their skills
  const allUsersRaw = await User.find({ _id: { $ne: req.user._id } })
    .select('-password')
    .lean();

  const userIds     = allUsersRaw.map(u => u._id);
  const allSkillsRaw = await Skill.find({ user_id: { $in: userIds } }).lean();

  const allUsers = allUsersRaw.map(u => ({
    ...u,
    skills: allSkillsRaw.filter(s => s.user_id.toString() === u._id.toString()),
  }));

  // 3️⃣  Build payload for Python AI service
  const candidates = allUsers
    .filter(u => u.skills.length > 0)
    .map(u => ({
      user:   { id: u._id, name: u.name, college: u.college, department: u.department },
      skills: u.skills.map(s => ({
        skill_name:        s.skill_name,
        proficiency_level: s.proficiency_level,
        type:              s.type,
      })),
    }));

  const aiPayload = {
    my_skills:  mySkills.map(s => ({
      skill_name:        s.skill_name,
      proficiency_level: s.proficiency_level,
      type:              s.type,
    })),
    candidates,
    top_n: 10,
  };

  // 4️⃣  Try Python AI service; fall back to JS engine on error
  let matches;
  try {
    const aiResult = await callPythonAI(aiPayload);
    if (aiResult.success) {
      matches = aiResult.data;
      console.log(`[MATCH] ✅ AI service returned ${matches.length} matches`);
    } else {
      throw new Error(aiResult.error || 'AI service returned failure');
    }
  } catch (err) {
    console.warn(`[MATCH] ⚠️ Python AI service unavailable (${err.message}) — using JS fallback`);
    matches = jsFallbackMatch(mySkills, allUsers);
  }

  res.status(200).json({ success: true, data: matches });
});

module.exports = { getMatches };
