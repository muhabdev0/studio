'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting bus and driver assignments for new trips.
 *
 * It includes:
 * - `suggestTripAssignments`: The main function to trigger the flow.
 * - `SuggestTripAssignmentsInput`: The input type for the `suggestTripAssignments` function.
 * - `SuggestTripAssignmentsOutput`: The output type for the `suggestTripAssignments` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTripAssignmentsInputSchema = z.object({
  routeFrom: z.string().describe('The starting location of the trip.'),
  routeTo: z.string().describe('The destination location of the trip.'),
  dateTime: z.string().describe('The date and time of the trip (ISO format).'),
  ticketPrice: z.number().describe('The price of a single ticket for the trip.'),
  availableSeats: z.number().describe('The number of seats available on the trip.'),
  currentBuses: z.array(z.object({
    nameNumber: z.string(),
    plateNumber: z.string(),
    capacity: z.number(),
    maintenanceStatus: z.string(),
    assignedDriver: z.string().optional(),
  })).describe('Details of currently available buses'),
  currentDrivers: z.array(z.object({
    fullName: z.string(),
    role: z.string(),
    contactInfo: z.string(),
  })).describe('Details of currently available drivers'),
});
export type SuggestTripAssignmentsInput = z.infer<typeof SuggestTripAssignmentsInputSchema>;

const SuggestTripAssignmentsOutputSchema = z.object({
  suggestedBus: z.string().describe('The suggested bus (nameNumber) for the trip.'),
  suggestedDriver: z.string().describe('The suggested driver (fullName) for the trip.'),
  reasoning: z.string().describe('The AI reasoning for suggesting the assignment.'),
});
export type SuggestTripAssignmentsOutput = z.infer<typeof SuggestTripAssignmentsOutputSchema>;

export async function suggestTripAssignments(input: SuggestTripAssignmentsInput): Promise<SuggestTripAssignmentsOutput> {
  return suggestTripAssignmentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTripAssignmentsPrompt',
  input: {schema: SuggestTripAssignmentsInputSchema},
  output: {schema: SuggestTripAssignmentsOutputSchema},
  prompt: `You are an AI assistant helping a transportation company admin to assign buses and drivers to new trips.

  Given the following trip details and available resources, suggest the most suitable bus and driver for the trip. Explain your reasoning.

  Trip Details:
  - Route: {{routeFrom}} to {{routeTo}}
  - Date/Time: {{dateTime}}
  - Ticket Price: {{ticketPrice}}
  - Available Seats: {{availableSeats}}

  Available Buses:
  {{#each currentBuses}}
  - Name/Number: {{nameNumber}}, Plate Number: {{plateNumber}}, Capacity: {{capacity}}, Maintenance Status: {{maintenanceStatus}}, Assigned Driver: {{assignedDriver}}
  {{/each}}

  Available Drivers:
  {{#each currentDrivers}}
  - Full Name: {{fullName}}, Role: {{role}}, Contact Info: {{contactInfo}}
  {{/each}}

  Consider factors like bus capacity, maintenance status, driver availability, and any existing assignments.

  Output the suggested bus (nameNumber), suggested driver (fullName), and a brief explanation of your reasoning.

  Ensure that your response is clear, concise, and directly addresses the request for optimal bus and driver assignment.

  Format your response as a JSON object with the following keys:
  - suggestedBus: The suggested bus (nameNumber)
  - suggestedDriver: The suggested driver (fullName)
  - reasoning: Your reasoning for the suggestion
  `,
});

const suggestTripAssignmentsFlow = ai.defineFlow(
  {
    name: 'suggestTripAssignmentsFlow',
    inputSchema: SuggestTripAssignmentsInputSchema,
    outputSchema: SuggestTripAssignmentsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
