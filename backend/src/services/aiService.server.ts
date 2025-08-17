import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function analyzeCVFromText(cvText: string) {
  const systemPrompt = `Return strict JSON:
{"skills":[],"experience":[],"education":[],"achievements":[],"person":{"name":"","email":"","phone":"","location":"","summary":""}}`;
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: cvText }],
    temperature: 0.3,
    max_tokens: 2000,
    response_format: { type: 'json_object' }
  });
  return JSON.parse(resp.choices?.[0]?.message?.content ?? '{}');
}

export async function analyzeJobFromText(jobText: string) {
  const systemPrompt = `Return strict JSON (response_format enforce):
{"company_name":"","job_title":"","required_profile":[],"responsibilities":[]}`;
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: jobText }
    ],
    temperature: 0,
    max_tokens: 1200,
    response_format: { type: 'json_object' }
  });

  // Défensif + normalisation
  const parsed = JSON.parse(resp.choices?.[0]?.message?.content ?? '{}');
  return {
    company_name: parsed.company_name ?? '',
    job_title: parsed.job_title ?? '',
    required_profile: Array.isArray(parsed.required_profile) ? parsed.required_profile : [],
    responsibilities: Array.isArray(parsed.responsibilities) ? parsed.responsibilities : []
  };
}