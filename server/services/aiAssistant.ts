import OpenAI from "openai";
import { storage } from "../storage";
import type { InsertAIConversation, InsertAIMessage } from "@shared/schema";

/*
AI Models Support:
1. OpenAI GPT-5: Latest model released August 7, 2025
2. xAI Grok 2: Alternative AI model from xAI with real-time search capabilities
*/

type AIProvider = 'openai' | 'grok';

class AIAssistantService {
  private openai: OpenAI | null = null;
  private grok: OpenAI | null = null;
  private defaultProvider: AIProvider = 'openai';

  constructor() {
    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ 
        apiKey: process.env.OPENAI_API_KEY 
      });
    }

    // Initialize Grok (xAI) - compatible with OpenAI SDK
    if (process.env.XAI_API_KEY) {
      this.grok = new OpenAI({
        apiKey: process.env.XAI_API_KEY,
        baseURL: 'https://api.x.ai/v1'
      });
      
      // Set Grok as default if OpenAI is not available
      if (!this.openai) {
        this.defaultProvider = 'grok';
      }
    }
  }

  private getClient(provider?: AIProvider): OpenAI {
    const selectedProvider = provider || this.defaultProvider;
    
    if (selectedProvider === 'grok' && this.grok) {
      return this.grok;
    }
    
    if (selectedProvider === 'openai' && this.openai) {
      return this.openai;
    }

    // Fallback: try to use any available client
    if (this.openai) return this.openai;
    if (this.grok) return this.grok;

    throw new Error("No AI provider configured. Please set OPENAI_API_KEY or XAI_API_KEY environment variable.");
  }

  private getModel(provider?: AIProvider): string {
    const selectedProvider = provider || this.defaultProvider;
    
    if (selectedProvider === 'grok') {
      return 'grok-2-012'; // Latest Grok model
    }
    
    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    return 'gpt-5';
  }

  private getProviderInfo(provider?: AIProvider): { name: string, model: string } {
    const selectedProvider = provider || this.defaultProvider;
    
    if (selectedProvider === 'grok') {
      return { name: 'Grok (xAI)', model: 'grok-2-012' };
    }
    
    return { name: 'OpenAI', model: 'gpt-5' };
  }

  async createConversation(userId: string, title?: string, provider?: AIProvider): Promise<any> {
    const providerInfo = this.getProviderInfo(provider);
    
    const conversationData: InsertAIConversation = {
      userId,
      title: title || 'Новый разговор',
      status: 'active',
      context: `Ты полезный AI-ассистент (${providerInfo.name}) для платформы управления социальными сетями. Помогай пользователям с вопросами о контенте, аналитике, планировании постов и общими вопросами. Отвечай на русском языке.`,
      metadata: {
        model: providerInfo.model,
        provider: provider || this.defaultProvider,
        tokens_used: 0,
        cost: 0
      }
    };

    return await storage.createAIConversation(conversationData);
  }

  async getUserConversations(userId: string): Promise<any[]> {
    return await storage.getUserAIConversations(userId);
  }

  async getConversationMessages(conversationId: number): Promise<any[]> {
    return await storage.getAIConversationMessages(conversationId);
  }

  async sendMessage(conversationId: number, userMessage: string, provider?: AIProvider): Promise<any> {
    const conversation = await storage.getAIConversation(conversationId);
    
    // Use provider from conversation metadata if not specified
    const selectedProvider = provider || (conversation.metadata as any)?.provider || this.defaultProvider;
    const client = this.getClient(selectedProvider);
    const model = this.getModel(selectedProvider);

    // Сохраняем сообщение пользователя
    const userMsg: InsertAIMessage = {
      conversationId,
      role: 'user',
      content: userMessage,
      tokensUsed: 0,
      cost: '0'
    };

    await storage.createAIMessage(userMsg);

    // Получаем историю разговора для контекста
    const messages = await this.getConversationMessages(conversationId);
    
    // Подготавливаем сообщения для OpenAI
    const openaiMessages = [
      {
        role: 'system' as const,
        content: conversation.context || 'Ты полезный AI-ассистент для платформы управления социальными сетями.'
      },
      // Берем последние 10 сообщений для контекста
      ...messages.slice(-10).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ];

    try {
      const response = await client.chat.completions.create({
        model: model,
        messages: openaiMessages,
        max_completion_tokens: 1000,
      });

      const assistantMessage = response.choices[0].message.content;
      const tokensUsed = response.usage?.total_tokens || 0;
      
      // Расчет стоимости в зависимости от провайдера
      let costPerToken = 0.00002; // Default: GPT-5 (~$0.02 per 1000 tokens)
      if (selectedProvider === 'grok') {
        costPerToken = 0.000002; // Grok 2: $2 per million tokens
      }
      const cost = (tokensUsed * costPerToken).toString();

      // Сохраняем ответ ассистента
      const assistantMsg: InsertAIMessage = {
        conversationId,
        role: 'assistant',
        content: assistantMessage || 'Извините, произошла ошибка при генерации ответа.',
        tokensUsed,
        cost,
        metadata: {
          model: model,
          provider: selectedProvider,
          response_time: Date.now()
        }
      };

      const savedMessage = await storage.createAIMessage(assistantMsg);

      // Обновляем общую статистику разговора
      await storage.updateAIConversationMetrics(conversationId, tokensUsed, cost);

      return {
        message: savedMessage,
        tokensUsed,
        cost
      };

    } catch (error) {
      console.error('Ошибка при общении с OpenAI:', error);
      
      // Сохраняем сообщение об ошибке
      const errorMsg: InsertAIMessage = {
        conversationId,
        role: 'assistant',
        content: 'Извините, произошла ошибка при обработке вашего сообщения. Попробуйте еще раз.',
        tokensUsed: 0,
        cost: '0',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };

      const savedMessage = await storage.createAIMessage(errorMsg);
      
      return {
        message: savedMessage,
        tokensUsed: 0,
        cost: 0,
        error: true
      };
    }
  }

  async deleteConversation(conversationId: number, userId: string): Promise<boolean> {
    return await storage.deleteAIConversation(conversationId, userId);
  }

  async updateConversationTitle(conversationId: number, userId: string, title: string): Promise<any> {
    return await storage.updateAIConversation(conversationId, userId, { title });
  }

  // Генерация автоматического заголовка на основе первых сообщений
  async generateConversationTitle(conversationId: number, provider?: AIProvider): Promise<string> {
    try {
      const conversation = await storage.getAIConversation(conversationId);
      const selectedProvider = provider || (conversation.metadata as any)?.provider || this.defaultProvider;
      
      const client = this.getClient(selectedProvider);
      const model = this.getModel(selectedProvider);
      const messages = await this.getConversationMessages(conversationId);
      
      if (messages.length < 2) {
        return 'Новый разговор';
      }

      const firstMessages = messages.slice(0, 4).map(m => `${m.role}: ${m.content}`).join('\n');
      
      const response = await client.chat.completions.create({
        model: model,
        messages: [{
          role: 'user',
          content: `Создай краткий заголовок (максимум 50 символов) для этого разговора на основе содержания:\n\n${firstMessages}`
        }],
        max_completion_tokens: 50,
      });

      return response.choices[0].message.content?.trim() || 'Новый разговор';
    } catch (error) {
      console.error('Ошибка при генерации заголовка:', error);
      return 'Новый разговор';
    }
  }

  // Получить список доступных провайдеров
  getAvailableProviders(): { provider: AIProvider, name: string, model: string, available: boolean }[] {
    return [
      {
        provider: 'openai',
        name: 'OpenAI GPT-5',
        model: 'gpt-5',
        available: !!this.openai
      },
      {
        provider: 'grok',
        name: 'xAI Grok 2',
        model: 'grok-2-012',
        available: !!this.grok
      }
    ];
  }
}

export const aiAssistantService = new AIAssistantService();