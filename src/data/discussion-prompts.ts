import { Virtue } from "./virtues";

// Static, rule-based discussion prompts for educators
// Each virtue has prompts for different score ranges
// These are supportive, open-ended questions to facilitate reflection

export interface DiscussionPrompt {
  question: string;
  context: string; // When to use this prompt
}

// Discussion prompts organized by virtue
// Educators use these to guide reflection conversations with students
export const VIRTUE_DISCUSSION_PROMPTS: Record<Virtue, DiscussionPrompt[]> = {
  Empathy: [
    {
      question: "What do you think the new student might have been feeling during this moment?",
      context: "Helps students consider others' perspectives",
    },
    {
      question: "How did you decide when to reach out to someone who seemed alone?",
      context: "Explores decision-making around connection",
    },
    {
      question: "What signs helped you notice how someone else was feeling?",
      context: "Builds awareness of emotional cues",
    },
  ],
  Respect: [
    {
      question: "How can small actions show someone they matter?",
      context: "Explores everyday ways to show respect",
    },
    {
      question: "What does it mean to treat someone with dignity, even if you don't know them well?",
      context: "Discusses respect for all people",
    },
    {
      question: "How might saving a seat or making space for someone make them feel included?",
      context: "Connects actions to feelings of belonging",
    },
  ],
  Responsibility: [
    {
      question: "How do your choices affect the people around you?",
      context: "Builds awareness of impact on others",
    },
    {
      question: "When you see someone who needs help, what makes you feel like it's your job to do something?",
      context: "Explores sense of personal responsibility",
    },
    {
      question: "What happens when everyone assumes someone else will help?",
      context: "Discusses bystander effect gently",
    },
  ],
  Courage: [
    {
      question: "What made it easier or harder to take that step?",
      context: "Explores barriers and enablers of brave action",
    },
    {
      question: "How did it feel to do something that might have been uncomfortable?",
      context: "Validates the difficulty of courageous choices",
    },
    {
      question: "What would you say to encourage a friend who wanted to do the right thing but felt nervous?",
      context: "Builds language for supporting others",
    },
  ],
  "Self-Control": [
    {
      question: "What helped you think before acting in this situation?",
      context: "Identifies self-regulation strategies",
    },
    {
      question: "How did you balance what you wanted to do with what might be helpful for someone else?",
      context: "Explores managing competing desires",
    },
    {
      question: "When is it good to pause and think, even when your friends are doing something else?",
      context: "Discusses peer pressure and thoughtful action",
    },
  ],
};

// Get discussion prompts for a virtue based on the student's score
// Returns all prompts for the virtue (educators can choose which to use)
export function getDiscussionPromptsForVirtue(virtue: Virtue): DiscussionPrompt[] {
  return VIRTUE_DISCUSSION_PROMPTS[virtue];
}

// Get a single recommended prompt based on score
// Positive scores: focus on reinforcing the behavior
// Negative/zero scores: focus on exploring opportunities
export function getRecommendedPrompt(virtue: Virtue, score: number): DiscussionPrompt {
  const prompts = VIRTUE_DISCUSSION_PROMPTS[virtue];
  if (score >= 2) {
    // High score: ask about their positive experience
    return prompts[1] || prompts[0];
  } else if (score >= 0) {
    // Neutral: explore awareness
    return prompts[0];
  } else {
    // Negative: explore opportunities gently
    return prompts[2] || prompts[0];
  }
}
