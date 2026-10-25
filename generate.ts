import OpenAI from "openai";
import type { InsertCampaign } from "../../shared/schema.js";

export function buildPrompt(input: InsertCampaign): string {
  return `Create a comprehensive, PERSONALIZED marketing campaign for this specific product. Make recommendations UNIQUE based on ALL provided context.

CRITICAL: Use these inputs to tailor EVERY recommendation:
- Product: ${input.productName} - ${input.description}
- Target Audience: ${input.audience}
- Tone/Style: ${input.tone}
${input.competitors && input.competitors.length > 0 ? `- User-provided Competitors: ${input.competitors.join(", ")}` : ""}
${input.campaignStartDate ? `- Campaign Period: ${input.campaignStartDate} to ${input.campaignEndDate || "TBD"}` : ""}
${input.kpis && input.kpis.length > 0 ? `- KPIs: ${input.kpis.join(", ")}` : ""}
${input.budget ? `- Budget: ${input.budget}` : ""}

PERSONALIZATION RULES:
1. Generate UNIQUE slogans that reflect the ACTUAL tone (${input.tone}) and audience (${input.audience})
2. Create platform-specific posts tailored to ${input.audience}, NOT generic content
3. Recommend vendors and budgets SPECIFICALLY for this product category
4. INCLUDE specific marquee units/ad formats (carousel ads, collection ads, horizontal video ads, native ads, etc)
5. PROVIDE detailed rationale explaining WHY each vendor is chosen for THIS product and audience
6. AUTO-SUGGEST 3 likely competitors if fewer than 3 were provided.
7. For Competitor Analysis: Provide data sources (e.g. "SimilarWeb", "Pathmatics") and recent creative examples (Display, Video, Audio) with descriptive links or references.
8. For Creative Mocks: Provide a "prompt" field for an image generation tool that would create a high-quality visual for this mock.

Return ONLY valid JSON:

{
  "slogans": ["unique slogan 1", "unique slogan 2", "unique slogan 3"],
  "sellingPoints": ["point 1", "point 2", "point 3"],
  "socialMediaPosts": [
    {"platform": "Twitter", "content": "post tailored to audience"}
  ],
  "emailDraft": {
    "subject": "compelling subject",
    "body": "email body"
  },
  "mediaVendorRecommendations": [
    {
      "platform": "Google Search Ads",
      "vendor": "Google",
      "category": "Search",
      "marqueeUnits": ["Search Text Ads", "Performance Max"],
      "recommendedBudgetPercentage": 22,
      "rationale": "Rationale here...",
      "monthlyBudget": 5500,
      "estimatedMonthlyImpressions": 180000
    }
  ],
  "competitorAnalysis": [
    {
      "competitor": "Competitor Name",
      "estimatedMonthlySpend": "$X,XXX",
      "strongChannels": ["Channel 1"],
      "positioningGap": "Gap description",
      "dataSources": ["SimilarWeb", "Internal Estimates"],
      "creativeExamples": [
        {"type": "Video", "description": "YouTube pre-roll showing product lifestyle", "link": "https://www.youtube.com/watch?v=example"},
        {"type": "Display", "description": "Banner ad on tech blogs", "link": "https://example.com/ads/banner1"}
      ]
    }
  ],
  "budgetRecommendation": {
    "recommendedTotal": "$25000",
    "breakdown": {
      "socialMedia": "40%",
      "searchAds": "22%"
    }
  },
  "creativeMocks": [
    {
      "type": "Instagram Post",
      "platform": "Instagram",
      "headline": "Headline",
      "visualDescription": "Visual description for human",
      "imagePrompt": "A professional product photography of [Product] for [Audience] in [Tone] style, high quality, 8k",
      "callToAction": "Shop Now"
    }
  ],
  "estimatedMetrics": {
    "expectedReachMonthly": "Reach info",
    "expectedConversionRate": "3-6%",
    "expectedROI": "400-600%",
    "estimatedCPA": "$8-25",
    "expectedEngagementRate": "4-10%"
  },
  "bigIdea": {
    "headline": "Headline",
    "concept": "Concept description",
    "executionChannels": ["TikTok"]
  }
}`;
}

export async function generateCampaignContent(
  input: InsertCampaign,
): Promise<Record<string, unknown>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-5.1",
    messages: [{ role: "user", content: buildPrompt(input) }],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("The model returned an empty response");
  }
  return JSON.parse(raw);
}
