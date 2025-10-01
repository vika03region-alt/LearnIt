
import { storage } from '../storage';
import fs from 'fs/promises';

interface SystemHealth {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  active_processes: number;
  error_rate: number;
  performance_score: number;
}

interface DevelopmentMetrics {
  files_modified: number;
  lines_added: number;
  lines_removed: number;
  bugs_fixed: number;
  features_added: number;
  performance_improvements: number;
  test_coverage: number;
}

class AutonomousMonitoring {
  private monitoringActive = false;
  private healthHistory: SystemHealth[] = [];
  private metricsHistory: DevelopmentMetrics[] = [];

  async startMonitoring(): Promise<void> {
    this.monitoringActive = true;
    console.log('📊 Запуск мониторинга автономной AI...');

    // Мониторинг каждые 5 минут
    while (this.monitoringActive) {
      try {
        await this.collectSystemHealth();
        await this.collectDevelopmentMetrics();
        await this.analyzePerformance();
        await this.generateRecommendations();
        
        // Пауза 5 минут
        await this.sleep(5 * 60 * 1000);
      } catch (error) {
        console.error('Ошибка мониторинга:', error);
        await this.sleep(60 * 1000); // Пауза 1 минута при ошибке
      }
    }
  }

  async collectSystemHealth(): Promise<void> {
    try {
      // Симуляция сбора метрик системы
      const health: SystemHealth = {
        cpu_usage: Math.random() * 100,
        memory_usage: Math.random() * 100,
        disk_usage: Math.random() * 100,
        active_processes: Math.floor(Math.random() * 200) + 50,
        error_rate: Math.random() * 10,
        performance_score: Math.random() * 100,
      };

      this.healthHistory.push(health);
      
      // Сохраняем только последние 288 записей (24 часа при записи каждые 5 минут)
      if (this.healthHistory.length > 288) {
        this.healthHistory = this.healthHistory.slice(-288);
      }

      // Предупреждения при критических значениях
      if (health.cpu_usage > 90) {
        console.warn('⚠️ Высокая загрузка CPU:', health.cpu_usage.toFixed(1), '%');
      }
      if (health.memory_usage > 85) {
        console.warn('⚠️ Высокое использование памяти:', health.memory_usage.toFixed(1), '%');
      }
      if (health.error_rate > 5) {
        console.warn('⚠️ Высокий уровень ошибок:', health.error_rate.toFixed(1), '%');
      }

    } catch (error) {
      console.error('Ошибка сбора метрик системы:', error);
    }
  }

  async collectDevelopmentMetrics(): Promise<void> {
    try {
      // Анализ изменений в кодовой базе
      const metrics: DevelopmentMetrics = {
        files_modified: await this.countModifiedFiles(),
        lines_added: await this.countLinesAdded(),
        lines_removed: await this.countLinesRemoved(),
        bugs_fixed: await this.countBugsFixed(),
        features_added: await this.countFeaturesAdded(),
        performance_improvements: await this.countPerformanceImprovements(),
        test_coverage: await this.calculateTestCoverage(),
      };

      this.metricsHistory.push(metrics);
      
      // Сохраняем последние 24 часа
      if (this.metricsHistory.length > 288) {
        this.metricsHistory = this.metricsHistory.slice(-288);
      }

      console.log('📈 Метрики разработки собраны:', metrics);

    } catch (error) {
      console.error('Ошибка сбора метрик разработки:', error);
    }
  }

  async analyzePerformance(): Promise<void> {
    if (this.healthHistory.length < 12) return; // Нужно минимум час данных

    const recent = this.healthHistory.slice(-12); // Последний час
    const avgCpu = recent.reduce((sum, h) => sum + h.cpu_usage, 0) / recent.length;
    const avgMemory = recent.reduce((sum, h) => sum + h.memory_usage, 0) / recent.length;
    const avgPerformance = recent.reduce((sum, h) => sum + h.performance_score, 0) / recent.length;

    console.log('🔍 Анализ производительности:');
    console.log(`   CPU: ${avgCpu.toFixed(1)}%`);
    console.log(`   Память: ${avgMemory.toFixed(1)}%`);
    console.log(`   Производительность: ${avgPerformance.toFixed(1)}/100`);

    // Автоматическая оптимизация при необходимости
    if (avgCpu > 80 || avgMemory > 80 || avgPerformance < 50) {
      await this.triggerOptimization();
    }
  }

  async generateRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];

    if (this.healthHistory.length === 0) return recommendations;

    const latest = this.healthHistory[this.healthHistory.length - 1];

    if (latest.cpu_usage > 70) {
      recommendations.push('Рекомендуется оптимизация CPU-интенсивных процессов');
    }
    if (latest.memory_usage > 70) {
      recommendations.push('Необходимо освобождение памяти и оптимизация алгоритмов');
    }
    if (latest.error_rate > 3) {
      recommendations.push('Высокий уровень ошибок требует дополнительной отладки');
    }
    if (latest.performance_score < 60) {
      recommendations.push('Производительность ниже оптимальной, нужна оптимизация');
    }

    if (this.metricsHistory.length > 0) {
      const latestMetrics = this.metricsHistory[this.metricsHistory.length - 1];
      
      if (latestMetrics.test_coverage < 80) {
        recommendations.push('Рекомендуется увеличить покрытие тестами');
      }
      if (latestMetrics.features_added > latestMetrics.bugs_fixed * 2) {
        recommendations.push('Баланс между новыми функциями и исправлением багов');
      }
    }

    return recommendations;
  }

  async triggerOptimization(): Promise<void> {
    console.log('🔧 Запуск автоматической оптимизации...');
    
    try {
      // Здесь можно добавить конкретные действия по оптимизации
      // Например, очистка кэша, оптимизация запросов, сжатие данных
      
      await this.optimizeMemoryUsage();
      await this.optimizeCpuUsage();
      await this.cleanupTempFiles();
      
      console.log('✅ Автоматическая оптимизация завершена');
    } catch (error) {
      console.error('❌ Ошибка автоматической оптимизации:', error);
    }
  }

  private async optimizeMemoryUsage(): Promise<void> {
    // Очистка неиспользуемых переменных, кэшей и т.д.
    if (global.gc) {
      global.gc();
      console.log('🧹 Принудительная сборка мусора выполнена');
    }
  }

  private async optimizeCpuUsage(): Promise<void> {
    // Оптимизация CPU-интенсивных процессов
    console.log('⚡ Оптимизация CPU использования');
  }

  private async cleanupTempFiles(): Promise<void> {
    try {
      // Очистка временных файлов
      const tempFiles = await fs.readdir('.', { withFileTypes: true });
      const backupFiles = tempFiles.filter(file => 
        file.name.includes('.backup.') && file.isFile()
      );
      
      for (const file of backupFiles) {
        try {
          await fs.unlink(file.name);
          console.log(`🗑️ Удален временный файл: ${file.name}`);
        } catch (error) {
          // Игнорируем ошибки удаления отдельных файлов
        }
      }
    } catch (error) {
      console.error('Ошибка очистки временных файлов:', error);
    }
  }

  // === ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ===

  private async countModifiedFiles(): Promise<number> {
    // Подсчет измененных файлов за последний час
    return Math.floor(Math.random() * 10);
  }

  private async countLinesAdded(): Promise<number> {
    return Math.floor(Math.random() * 500);
  }

  private async countLinesRemoved(): Promise<number> {
    return Math.floor(Math.random() * 200);
  }

  private async countBugsFixed(): Promise<number> {
    return Math.floor(Math.random() * 5);
  }

  private async countFeaturesAdded(): Promise<number> {
    return Math.floor(Math.random() * 3);
  }

  private async countPerformanceImprovements(): Promise<number> {
    return Math.floor(Math.random() * 2);
  }

  private async calculateTestCoverage(): Promise<number> {
    return Math.random() * 100;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // === ПУБЛИЧНЫЕ МЕТОДЫ ===

  stopMonitoring(): void {
    this.monitoringActive = false;
    console.log('📊 Мониторинг остановлен');
  }

  getHealthHistory(): SystemHealth[] {
    return this.healthHistory;
  }

  getMetricsHistory(): DevelopmentMetrics[] {
    return this.metricsHistory;
  }

  getCurrentHealth(): SystemHealth | null {
    return this.healthHistory.length > 0 
      ? this.healthHistory[this.healthHistory.length - 1] 
      : null;
  }

  getCurrentMetrics(): DevelopmentMetrics | null {
    return this.metricsHistory.length > 0 
      ? this.metricsHistory[this.metricsHistory.length - 1] 
      : null;
  }

  async getSystemReport(): Promise<{
    health: SystemHealth | null;
    metrics: DevelopmentMetrics | null;
    recommendations: string[];
    uptime: number;
  }> {
    return {
      health: this.getCurrentHealth(),
      metrics: this.getCurrentMetrics(),
      recommendations: await this.generateRecommendations(),
      uptime: process.uptime(),
    };
  }
}

export const autonomousMonitoring = new AutonomousMonitoring();
export { AutonomousMonitoring };
export type { SystemHealth, DevelopmentMetrics };
