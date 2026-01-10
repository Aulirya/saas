export interface ClerkUserWebhookDto {
    id: string;
    public_metadata: {
        country: "FR" | "BE";
    };
    email_addresses: Array<ClerkWebhookEmailDto>;
    first_name: string | null;
    last_name: string | null;
}

interface ClerkWebhookEmailDto {
    email_address: string;
    id: string;
}
