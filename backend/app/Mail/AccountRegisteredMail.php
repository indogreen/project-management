<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AccountRegisteredMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $name,
        public string $username,
        public string $emailAddress,
        public string $code,
        public string $loginUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Kode Autentikasi Akun - Indogreen Project Management',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.account_registered',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
