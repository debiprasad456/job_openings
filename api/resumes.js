// GET /api/resumes — Forward to ./resumes/index.js with cache busting
// POST /api/resumes
// DELETE /api/resumes

export default async function handler(req, res) {
  const { default: actualHandler } = await import(`./resumes/index.js?t=${Date.now()}`);
  return actualHandler(req, res);
}
