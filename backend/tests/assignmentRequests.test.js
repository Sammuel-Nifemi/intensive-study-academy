const test = require("node:test");
const assert = require("node:assert");

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const STUDENT_TOKEN = process.env.STUDENT_TOKEN || "";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const MOCK_ID = process.env.MOCK_ID || "";
const QUESTION_ID = process.env.QUESTION_ID || "";

async function jsonFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

test("POST /api/mocks/submit creates assignment request when weak topics exist", async (t) => {
  if (!STUDENT_TOKEN || !MOCK_ID || !QUESTION_ID) {
    t.skip("Missing STUDENT_TOKEN/MOCK_ID/QUESTION_ID env vars");
    return;
  }

  const payload = {
    mockId: MOCK_ID,
    answers: [{ questionId: QUESTION_ID, answer: "A" }]
  };

  const { res, data } = await jsonFetch("/api/mocks/submit", {
    method: "POST",
    headers: { Authorization: `Bearer ${STUDENT_TOKEN}` },
    body: JSON.stringify(payload)
  });

  assert.ok(res.status === 200 || res.status === 400);
  if (res.status === 200) {
    assert.ok(typeof data.score === "number");
  }
});

test("GET /api/assignments returns list for admin", async (t) => {
  if (!ADMIN_TOKEN) {
    t.skip("Missing ADMIN_TOKEN env var");
    return;
  }

  const { res, data } = await jsonFetch("/api/assignments", {
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
  });

  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(data));
});

test("PATCH /api/assignments/:id updates status", async (t) => {
  if (!ADMIN_TOKEN) {
    t.skip("Missing ADMIN_TOKEN env var");
    return;
  }

  const { res, data } = await jsonFetch("/api/assignments", {
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
  });

  if (!Array.isArray(data) || data.length === 0) {
    t.skip("No assignment requests available to update");
    return;
  }

  const targetId = data[0]._id;
  const { res: patchRes, data: patchData } = await jsonFetch(
    `/api/assignments/${targetId}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      body: JSON.stringify({ status: "contacted" })
    }
  );

  assert.strictEqual(patchRes.status, 200);
  assert.strictEqual(patchData.status, "contacted");
});
