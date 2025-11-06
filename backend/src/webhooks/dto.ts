export interface ClerkUserWebhookDto {
  id: string;
  email_addresses: Array<ClerkWebhookEmailDto>;
  first_name: string | null;
  last_name: string | null;
}

interface ClerkWebhookEmailDto {
  email_address: string;
  id: string;
}
