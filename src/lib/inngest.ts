import { Inngest } from 'inngest';

// Create the Inngest client
export const inngest = new Inngest({
  id: 'ticketticket',
  name: 'TicketTicket',
});

// Event types for type safety
export type InngestEvents = {
  'webhook/send.discord': {
    data: {
      webhookUrl: string;
      eventName: string;
      listingId: string;
      listingTitle: string;
      hostName: string;
      eventDate: string;
      price: number;
      ticketType: string;
      seatGrade: string;
      listingUrl: string;
    };
  };
  'webhook/batch.discord': {
    data: {
      webhooks: Array<{
        webhookUrl: string;
        eventId: string;
      }>;
      eventName: string;
      listingId: string;
      listingTitle: string;
      hostName: string;
      eventDate: string;
      price: number;
      ticketType: string;
      seatGrade: string;
      listingUrl: string;
    };
  };
};
