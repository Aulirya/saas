export interface ClerkUserWebhookDto {
  id: string;
  email_addresses: Array<ClerkWebhookEmailDto>;
  first_name?: string;
  last_name?: string;
}

interface ClerkWebhookEmailDto {
  email_address: string;
  id: string;
}
