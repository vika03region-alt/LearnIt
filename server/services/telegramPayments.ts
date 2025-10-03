
import TelegramBot from 'node-telegram-bot-api';

interface PaymentConfig {
  title: string;
  description: string;
  currency: string;
  prices: Array<{ label: string; amount: number }>;
  providerToken: string;
  photoUrl?: string;
}

class TelegramPaymentService {
  constructor(private bot: TelegramBot) {}

  async sendInvoice(chatId: number, config: PaymentConfig) {
    return await this.bot.sendInvoice(
      chatId,
      config.title,
      config.description,
      `payload_${Date.now()}`,
      config.providerToken,
      config.currency,
      config.prices,
      {
        photo_url: config.photoUrl,
        need_name: true,
        need_email: true,
        need_phone_number: true,
      }
    );
  }

  async handlePreCheckoutQuery(query: any) {
    // Проверка перед оплатой
    await this.bot.answerPreCheckoutQuery(query.id, true);
  }

  async handleSuccessfulPayment(message: any) {
    const payment = message.successful_payment;
    return {
      amount: payment.total_amount / 100,
      currency: payment.currency,
      invoicePayload: payment.invoice_payload,
      telegramPaymentChargeId: payment.telegram_payment_charge_id,
    };
  }
}

export const telegramPaymentService = new TelegramPaymentService(null as any);
