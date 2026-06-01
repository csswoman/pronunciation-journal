/** Short subtitle shown on category detail pages. */
const CATEGORY_BLURBS: Record<string, string> = {
  "artificial-intelligence": "ML, models, and AI product vocabulary",
  "backend-infra": "Servers, data, and architecture vocabulary",
  "data-science": "Statistics, pipelines, and analytics vocabulary",
  "frontend-dev": "React, browsers, and UI engineering vocabulary",
  "ux-design": "Research, flows, and interface vocabulary",
  "design-systems": "Tokens, components, and design ops vocabulary",
  professional: "Meetings, email, and workplace English",
  "technical-writing": "Docs, clarity, and developer communication",
  "personal-interview": "Behavioral answers and interview phrases",
};

export function getCategoryBlurb(categoryId: string): string {
  return CATEGORY_BLURBS[categoryId] ?? "Specialized vocabulary for this area";
}
