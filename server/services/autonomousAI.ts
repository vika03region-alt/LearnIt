
import OpenAI from "openai";
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { storage } from '../storage';

const execAsync = promisify(exec);

interface CodeAnalysis {
  file_path: string;
  current_code: string;
  issues: string[];
  improvements: string[];
  missing_features: string[];
  optimization_score: number;
}

interface ImplementationPlan {
  priority: 'critical' | 'high' | 'medium' | 'low';
  feature_name: string;
  description: string;
  files_to_modify: string[];
  new_files_to_create: string[];
  estimated_complexity: number;
  implementation_steps: string[];
}

class AutonomousAI {
  private openai: OpenAI;
  private isActive = false;
  private developmentCycle = 0;
  private improvementHistory: any[] = [];

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
  }

  // === АВТОНОМНАЯ РАЗРАБОТКА ===
  
  async startAutonomousDevelopment(): Promise<void> {
    console.log('🤖 Запуск автономной AI разработки...');
    this.isActive = true;
    
    while (this.isActive) {
      try {
        console.log(`🔄 Цикл разработки #${++this.developmentCycle}`);
        
        // 1. Анализ текущего состояния системы
        const systemAnalysis = await this.analyzeCurrentSystem();
        
        // 2. Определение приоритетов развития
        const priorities = await this.determineDevelopmentPriorities(systemAnalysis);
        
        // 3. Создание плана реализации
        const implementationPlan = await this.createImplementationPlan(priorities);
        
        // 4. Автоматическая реализация
        await this.executeImplementationPlan(implementationPlan);
        
        // 5. Тестирование и валидация
        await this.validateImplementation();
        
        // 6. Обучение на результатах
        await this.learnFromImplementation();
        
        // Пауза между циклами (1 час)
        await this.sleep(60 * 60 * 1000);
        
      } catch (error) {
        console.error('Ошибка в цикле автономной разработки:', error);
        await this.sleep(30 * 60 * 1000); // Пауза 30 минут при ошибке
      }
    }
  }

  // === АНАЛИЗ СИСТЕМЫ ===
  
  async analyzeCurrentSystem(): Promise<CodeAnalysis[]> {
    const analyses: CodeAnalysis[] = [];
    
    // Анализируем ключевые файлы системы
    const criticalFiles = [
      'server/routes.ts',
      'server/services/aiContent.ts',
      'server/services/aiAssistant.ts',
      'server/services/aiLearningEngine.ts',
      'client/src/App.tsx',
      'client/src/components/Sidebar.tsx',
      'shared/schema.ts'
    ];

    for (const filePath of criticalFiles) {
      try {
        const code = await fs.readFile(filePath, 'utf-8');
        const analysis = await this.analyzeCodeFile(filePath, code);
        analyses.push(analysis);
      } catch (error) {
        console.error(`Ошибка анализа файла ${filePath}:`, error);
      }
    }

    return analyses;
  }

  private async analyzeCodeFile(filePath: string, code: string): Promise<CodeAnalysis> {
    const prompt = `
      Проанализируй этот код файла ${filePath}:
      
      ${code.slice(0, 5000)} ${code.length > 5000 ? '...[truncated]' : ''}
      
      Определи:
      1. issues: критические проблемы и баги
      2. improvements: возможности для улучшения
      3. missing_features: отсутствующие важные функции
      4. optimization_score: оценка оптимизации от 0 до 100
      
      Верни JSON с указанными полями.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: 'Ты опытный разработчик, анализирующий код для автономного улучшения системы.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        file_path: filePath,
        current_code: code,
        issues: analysis.issues || [],
        improvements: analysis.improvements || [],
        missing_features: analysis.missing_features || [],
        optimization_score: analysis.optimization_score || 50,
      };
    } catch (error) {
      console.error('Ошибка AI анализа кода:', error);
      return {
        file_path: filePath,
        current_code: code,
        issues: [],
        improvements: [],
        missing_features: [],
        optimization_score: 50,
      };
    }
  }

  // === ПЛАНИРОВАНИЕ РАЗВИТИЯ ===
  
  async determineDevelopmentPriorities(analyses: CodeAnalysis[]): Promise<string[]> {
    // Собираем все проблемы и улучшения
    const allIssues = analyses.flatMap(a => a.issues.map(issue => `${a.file_path}: ${issue}`));
    const allImprovements = analyses.flatMap(a => a.improvements.map(imp => `${a.file_path}: ${imp}`));
    const allMissingFeatures = analyses.flatMap(a => a.missing_features.map(feat => `${a.file_path}: ${feat}`));

    const prompt = `
      На основе анализа системы определи топ-10 приоритетов для автономной разработки:
      
      КРИТИЧЕСКИЕ ПРОБЛЕМЫ:
      ${allIssues.slice(0, 20).join('\n')}
      
      УЛУЧШЕНИЯ:
      ${allImprovements.slice(0, 20).join('\n')}
      
      ОТСУТСТВУЮЩИЕ ФУНКЦИИ:
      ${allMissingFeatures.slice(0, 20).join('\n')}
      
      Создай приоритизированный список из 10 элементов для реализации.
      Верни JSON массив строк с описанием приоритетов.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: 'Ты архитектор ПО, определяющий приоритеты автономного развития системы.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result.priorities || [];
    } catch (error) {
      console.error('Ошибка определения приоритетов:', error);
      return [];
    }
  }

  async createImplementationPlan(priorities: string[]): Promise<ImplementationPlan[]> {
    const plans: ImplementationPlan[] = [];

    for (const priority of priorities.slice(0, 5)) { // Топ-5 приоритетов
      const plan = await this.createDetailedPlan(priority);
      if (plan) plans.push(plan);
    }

    return plans.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private async createDetailedPlan(priorityDescription: string): Promise<ImplementationPlan | null> {
    const prompt = `
      Создай детальный план реализации для: "${priorityDescription}"
      
      Учитывай существующую архитектуру системы продвижения в социальных сетях.
      
      Верни JSON с полями:
      - priority: critical/high/medium/low
      - feature_name: краткое название функции
      - description: подробное описание
      - files_to_modify: массив путей файлов для изменения
      - new_files_to_create: массив новых файлов
      - estimated_complexity: сложность от 1 до 10
      - implementation_steps: массив шагов реализации
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: 'Ты ведущий архитектор ПО, создающий планы автономной реализации.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Ошибка создания плана:', error);
      return null;
    }
  }

  // === АВТОМАТИЧЕСКАЯ РЕАЛИЗАЦИЯ ===
  
  async executeImplementationPlan(plans: ImplementationPlan[]): Promise<void> {
    for (const plan of plans) {
      console.log(`🚀 Реализация: ${plan.feature_name}`);
      
      try {
        // 1. Создание новых файлов
        for (const newFile of plan.new_files_to_create) {
          await this.createNewFile(newFile, plan);
        }
        
        // 2. Модификация существующих файлов
        for (const fileToModify of plan.files_to_modify) {
          await this.modifyExistingFile(fileToModify, plan);
        }
        
        // 3. Установка зависимостей если нужно
        await this.handleDependencies(plan);
        
        console.log(`✅ Реализация ${plan.feature_name} завершена`);
        
        // Логируем в историю
        this.improvementHistory.push({
          cycle: this.developmentCycle,
          feature: plan.feature_name,
          timestamp: new Date(),
          status: 'completed'
        });
        
      } catch (error) {
        console.error(`❌ Ошибка реализации ${plan.feature_name}:`, error);
        this.improvementHistory.push({
          cycle: this.developmentCycle,
          feature: plan.feature_name,
          timestamp: new Date(),
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  private async createNewFile(filePath: string, plan: ImplementationPlan): Promise<void> {
    const prompt = `
      Создай полный код для нового файла ${filePath} в рамках реализации "${plan.feature_name}".
      
      Описание: ${plan.description}
      
      Учитывай:
      - TypeScript/React архитектуру
      - Существующие паттерны кода
      - Интеграцию с текущей системой
      
      Верни только чистый код без дополнительных объяснений.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: 'Ты эксперт разработчик, создающий высококачественный код.' },
          { role: 'user', content: prompt }
        ],
      });

      const code = response.choices[0].message.content || '';
      
      // Создаем директории если не существуют
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      // Записываем файл
      await fs.writeFile(filePath, code, 'utf-8');
      console.log(`📁 Создан файл: ${filePath}`);
      
    } catch (error) {
      console.error(`Ошибка создания файла ${filePath}:`, error);
    }
  }

  private async modifyExistingFile(filePath: string, plan: ImplementationPlan): Promise<void> {
    try {
      const currentCode = await fs.readFile(filePath, 'utf-8');
      
      const prompt = `
        Модифицируй код файла ${filePath} для реализации "${plan.feature_name}".
        
        Текущий код:
        ${currentCode.slice(0, 8000)}${currentCode.length > 8000 ? '\n...[код обрезан]' : ''}
        
        Описание изменений: ${plan.description}
        
        Требования:
        - Сохрани существующую функциональность
        - Добавь новые возможности интегрированно
        - Используй существующие паттерны
        - TypeScript совместимость
        
        Верни полный обновленный код файла.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: 'Ты опытный разработчик, модифицирующий код с сохранением качества.' },
          { role: 'user', content: prompt }
        ],
      });

      const modifiedCode = response.choices[0].message.content || '';
      
      // Создаем бэкап
      await fs.writeFile(`${filePath}.backup.${Date.now()}`, currentCode, 'utf-8');
      
      // Записываем обновленный код
      await fs.writeFile(filePath, modifiedCode, 'utf-8');
      console.log(`🔧 Модифицирован файл: ${filePath}`);
      
    } catch (error) {
      console.error(`Ошибка модификации файла ${filePath}:`, error);
    }
  }

  private async handleDependencies(plan: ImplementationPlan): Promise<void> {
    // Анализируем нужны ли новые зависимости
    const prompt = `
      Проанализируй план реализации и определи нужны ли новые npm пакеты:
      
      Функция: ${plan.feature_name}
      Описание: ${plan.description}
      
      Верни JSON с массивом "dependencies" если нужны новые пакеты, иначе пустой массив.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: 'Ты эксперт по npm зависимостям.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      const dependencies = result.dependencies || [];

      if (dependencies.length > 0) {
        console.log(`📦 Установка зависимостей: ${dependencies.join(', ')}`);
        await execAsync(`npm install ${dependencies.join(' ')}`);
      }
    } catch (error) {
      console.error('Ошибка обработки зависимостей:', error);
    }
  }

  // === ТЕСТИРОВАНИЕ И ВАЛИДАЦИЯ ===
  
  async validateImplementation(): Promise<boolean> {
    try {
      console.log('🧪 Валидация реализации...');
      
      // 1. Проверка TypeScript компиляции
      const tscResult = await execAsync('npx tsc --noEmit');
      console.log('✅ TypeScript компиляция прошла успешно');
      
      // 2. Проверка запуска сервера
      // (Здесь можно добавить более детальные тесты)
      
      return true;
    } catch (error) {
      console.error('❌ Ошибка валидации:', error);
      return false;
    }
  }

  // === ОБУЧЕНИЕ НА РЕЗУЛЬТАТАХ ===
  
  async learnFromImplementation(): Promise<void> {
    const recentHistory = this.improvementHistory.slice(-10);
    
    const prompt = `
      Проанализируй результаты последних реализаций:
      ${JSON.stringify(recentHistory, null, 2)}
      
      Определи:
      1. Что работает хорошо
      2. Какие паттерны следует избегать
      3. Как улучшить процесс в следующих циклах
      
      Создай рекомендации для оптимизации автономной разработки.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: 'Ты AI аналитик, изучающий эффективность автономной разработки.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      const insights = JSON.parse(response.choices[0].message.content || '{}');
      console.log('🧠 Обучение завершено:', insights);
      
      // Сохраняем инсайты для следующих циклов
      await this.saveInsights(insights);
      
    } catch (error) {
      console.error('Ошибка обучения на результатах:', error);
    }
  }

  private async saveInsights(insights: any): Promise<void> {
    try {
      const insightsPath = 'autonomous_ai_insights.json';
      await fs.writeFile(insightsPath, JSON.stringify(insights, null, 2), 'utf-8');
    } catch (error) {
      console.error('Ошибка сохранения инсайтов:', error);
    }
  }

  // === УПРАВЛЕНИЕ ЖИЗНЕННЫМ ЦИКЛОМ ===
  
  stopAutonomousDevelopment(): void {
    console.log('🛑 Остановка автономной разработки...');
    this.isActive = false;
  }

  getStatus(): any {
    return {
      isActive: this.isActive,
      currentCycle: this.developmentCycle,
      improvementsCount: this.improvementHistory.length,
      recentHistory: this.improvementHistory.slice(-5),
    };
  }

  // === СПЕЦИАЛИЗИРОВАННЫЕ УЛУЧШЕНИЯ ===
  
  async enhanceAICapabilities(): Promise<void> {
    console.log('🧠 Улучшение AI возможностей...');
    
    // Анализ и улучшение AI сервисов
    const aiServices = [
      'server/services/aiContent.ts',
      'server/services/aiAssistant.ts',
      'server/services/aiLearningEngine.ts'
    ];

    for (const service of aiServices) {
      await this.enhanceAIService(service);
    }
  }

  private async enhanceAIService(servicePath: string): Promise<void> {
    try {
      const code = await fs.readFile(servicePath, 'utf-8');
      
      const prompt = `
        Улучши AI сервис для более продвинутых возможностей:
        
        ${code.slice(0, 6000)}
        
        Добавь:
        1. Более интеллектуальную обработку
        2. Кэширование результатов
        3. Адаптивные алгоритмы
        4. Лучшую обработку ошибок
        5. Метрики производительности
        
        Верни улучшенный код.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: 'Ты эксперт по AI системам, создающий продвинутые решения.' },
          { role: 'user', content: prompt }
        ],
      });

      const enhancedCode = response.choices[0].message.content || '';
      
      // Бэкап и запись улучшенного кода
      await fs.writeFile(`${servicePath}.backup.${Date.now()}`, code, 'utf-8');
      await fs.writeFile(servicePath, enhancedCode, 'utf-8');
      
      console.log(`🔧 Улучшен AI сервис: ${servicePath}`);
      
    } catch (error) {
      console.error(`Ошибка улучшения AI сервиса ${servicePath}:`, error);
    }
  }

  // === УТИЛИТЫ ===
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const autonomousAI = new AutonomousAI();
export { AutonomousAI };
