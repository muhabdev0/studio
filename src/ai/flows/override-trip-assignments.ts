'use server';

/**
 * @fileOverview An AI agent for recommending whether to override trip assignments.
 *
 * - overrideTripAssignmentRecommendation - A function that handles the trip assignment override recommendation process.
 * - OverrideTripAssignmentInput - The input type for the overrideTripAssignmentRecommendation function.
 * - OverrideTripAssignmentOutput - The return type for the overrideTripAssignmentRecommendation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OverrideTripAssignmentInputSchema = z.object({
  currentBusAssignment: z.string().describe('The currently assigned bus for the trip.'),
  currentDriverAssignment: z.string().describe('The currently assigned driver for the trip.'),
  suggestedBusAssignment: z.string().describe('The AI-suggested bus for the trip.'),
  suggestedDriverAssignment: z.string().describe('The AI-suggested driver for the trip.'),
  tripDetails: z.string().describe('Details about the trip, including route, time, and passenger count.'),
});
export type OverrideTripAssignmentInput = z.infer<typeof OverrideTripAssignmentInputSchema>;

const OverrideTripAssignmentOutputSchema = z.object({
  reasoning: z.string().describe('The AI reasoning behind the suggested bus and driver assignments.'),
  confidenceLevel: z.number().describe('A numerical confidence level (0-1) for the AI recommendation.'),
  shouldOverride: z.boolean().describe('Whether the admin should override the current assignment.'),
});
export type OverrideTripAssignmentOutput = z.infer<typeof OverrideTripAssignmentOutputSchema>;

export async function overrideTripAssignmentRecommendation(
  input: OverrideTripAssignmentInput
): Promise<OverrideTripAssignmentOutput> {
  return overrideTripAssignmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'overrideTripAssignmentPrompt',
  input: {schema: OverrideTripAssignmentInputSchema},
  output: {schema: OverrideTripAssignmentOutputSchema},
  prompt: `You are an AI assistant helping an admin decide whether to override a trip assignment.

  Here's the current situation:
  Current Bus Assignment: {{{currentBusAssignment}}}
  Current Driver Assignment: {{{currentDriverAssignment}}}
  Suggested Bus Assignment: {{{suggestedBusAssignment}}}
  Suggested Driver Assignment: {{{suggestedDriverAssignment}}}
  Trip Details: {{{tripDetails}}}

  Provide the reasoning behind the suggested bus and driver assignments.
  Also provide a confidence level (0-1) for the AI recommendation.
  Finally, determine whether the admin should override the current assignment based on the reasoning and confidence level.

  Reasoning: 
  Confidence Level (0-1): 
  Should Override (true/false): `,
});

const overrideTripAssignmentFlow = ai.defineFlow(
  {
    name: 'overrideTripAssignmentFlow',
    inputSchema: OverrideTripAssignmentInputSchema,
    outputSchema: OverrideTripAssignmentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
