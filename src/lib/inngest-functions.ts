import { inngest } from './inngest';

// Discord embed colors
const EMBED_COLOR = 0x9146FF; // Purple theme color

// Function to send a single Discord webhook
export const sendDiscordWebhook = inngest.createFunction(
  {
    id: 'send-discord-webhook',
    name: 'Send Discord Webhook',
    retries: 3,
  },
  { event: 'webhook/send.discord' },
  async ({ event }) => {
    const {
      webhookUrl,
      eventName,
      listingId,
      listingTitle,
      hostName,
      eventDate,
      price,
      ticketType,
      seatGrade,
      listingUrl,
    } = event.data;

    // Build Discord embed
    const embed = {
      title: `${eventName}`,
      description: listingTitle,
      color: EMBED_COLOR,
      fields: [
        {
          name: 'Host',
          value: hostName,
          inline: true,
        },
        {
          name: 'Event Date',
          value: eventDate,
          inline: true,
        },
        {
          name: 'Price',
          value: `${price.toLocaleString()}`,
          inline: true,
        },
        {
          name: 'Ticket Type',
          value: ticketType,
          inline: true,
        },
        {
          name: 'Seat Grade',
          value: seatGrade,
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'TicketTicket Notification',
      },
    };

    const payload = {
      embeds: [embed],
      components: [
        {
          type: 1, // Action Row
          components: [
            {
              type: 2, // Button
              style: 5, // Link button
              label: 'View Listing',
              url: listingUrl,
            },
          ],
        },
      ],
    };

    // Send to Discord
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Discord webhook failed: ${response.status} - ${errorText}`);
    }

    return {
      success: true,
      listingId,
      webhookUrl: webhookUrl.substring(0, 50) + '...', // Truncate for logging
    };
  }
);

// Function to send batch Discord webhooks
export const sendBatchDiscordWebhooks = inngest.createFunction(
  {
    id: 'send-batch-discord-webhooks',
    name: 'Send Batch Discord Webhooks',
    retries: 2,
  },
  { event: 'webhook/batch.discord' },
  async ({ event, step }) => {
    const { webhooks, ...listingData } = event.data;

    // Send each webhook with a small delay to avoid rate limiting
    const results = await step.run('send-all-webhooks', async () => {
      const sendResults: Array<{ eventId: string; success: boolean; error?: string }> = [];

      for (const webhook of webhooks) {
        try {
          const embed = {
            title: `${listingData.eventName}`,
            description: listingData.listingTitle,
            color: EMBED_COLOR,
            fields: [
              {
                name: 'Host',
                value: listingData.hostName,
                inline: true,
              },
              {
                name: 'Event Date',
                value: listingData.eventDate,
                inline: true,
              },
              {
                name: 'Price',
                value: `${listingData.price.toLocaleString()}`,
                inline: true,
              },
              {
                name: 'Ticket Type',
                value: listingData.ticketType,
                inline: true,
              },
              {
                name: 'Seat Grade',
                value: listingData.seatGrade,
                inline: true,
              },
            ],
            timestamp: new Date().toISOString(),
            footer: {
              text: 'TicketTicket Notification',
            },
          };

          const payload = {
            embeds: [embed],
            components: [
              {
                type: 1,
                components: [
                  {
                    type: 2,
                    style: 5,
                    label: 'View Listing',
                    url: listingData.listingUrl,
                  },
                ],
              },
            ],
          };

          const response = await fetch(webhook.webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            sendResults.push({ eventId: webhook.eventId, success: true });
          } else {
            const errorText = await response.text();
            sendResults.push({
              eventId: webhook.eventId,
              success: false,
              error: `${response.status}: ${errorText}`,
            });
          }

          // Small delay between requests to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          sendResults.push({
            eventId: webhook.eventId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return sendResults;
    });

    return {
      totalSent: webhooks.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }
);

// Export all functions for the serve handler
export const functions = [sendDiscordWebhook, sendBatchDiscordWebhooks];
