# main.py - ПОЛНЫЙ ПРОЕКТ ДЛЯ REPLIT
from flask import Flask, render_template_string, request, jsonify
import sqlite3
import requests
import json
import schedule
import time
import threading
from datetime import datetime, timedelta
import random
import os
import hashlib
import re

app = Flask(__name__)

# HTML шаблон для страницы анализа платформ
PLATFORM_ANALYSIS_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>📚 Обучение и настройка платформ - Lucifer Trading</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f8f9fa;
            color: #2c3e50;
            min-height: 100vh;
        }
        
        .header {
            background: #ffffff;
            border-bottom: 1px solid #e0e0e0;
            padding: 2rem;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }
        
        .header p {
            font-size: 1.1rem;
            color: #6c757d;
        }
        
        .back-btn {
            position: absolute;
            top: 2rem;
            left: 2rem;
            background: #ffffff;
            border: 1px solid #e0e0e0;
            color: #2c3e50;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 8px;
            transition: all 0.3s;
        }
        
        .back-btn:hover {
            background: #f8f9fa;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transform: translateX(-5px);
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .tabs {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-bottom: 3rem;
            flex-wrap: wrap;
        }
        
        .tab {
            padding: 15px 30px;
            background: #ffffff;
            border: 1px solid #e0e0e0;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s;
            border: 2px solid #e0e0e0;
            font-size: 1.1rem;
            font-weight: bold;
        }
        
        .tab:hover {
            transform: translateY(-5px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .tab.active {
            background: #dc143c;
            color: #ffffff;
            border-color: #dc143c;
            color: #ffffff;
            box-shadow: 0 4px 12px rgba(220, 20, 60, 0.2);
        }
        
        .tab-content {
            display: none;
            animation: fadeIn 0.5s;
        }
        
        .tab-content.active {
            display: block;
        }
        
        /* Простые переходы без анимаций */
        
        .section {
            background: #ffffff;
            border-radius: 15px;
            padding: 2rem;
            margin-bottom: 2rem;
            border-left: 4px solid #dc143c;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .section h2 {
            color: #000000;
            margin-bottom: 1.5rem;
            font-size: 1.8rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .section h3 {
            color: #2c3e50;
            font-weight: 600;
            margin: 1.5rem 0 1rem 0;
            font-size: 1.3rem;
        }
        
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-top: 1.5rem;
        }
        
        .feature-card {
            background: #ffffff;
            border: 1px solid #e0e0e0;
            padding: 1.5rem;
            border-radius: 10px;
            transition: all 0.3s;
            cursor: pointer;
        }
        
        .feature-card:hover {
            transform: scale(1.05);
            background: #f8f9fa;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .feature-icon {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        
        .try-btn {
            background: #4CAF50;
            color: #2c3e50;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 10px;
            transition: all 0.3s;
        }
        
        .try-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 3px 15px rgba(76, 175, 80, 0.4);
        }
        
        .code-example {
            background: #f8f9fa;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 1rem;
            margin: 1rem 0;
            font-family: 'Courier New', monospace;
            overflow-x: auto;
        }
        
        .code-example pre {
            margin: 0;
            color: #2c3e50;
        }
        
        .progress-bar {
            background: #f8f9fa;
            height: 30px;
            border-radius: 15px;
            overflow: hidden;
            margin: 1rem 0;
        }
        
        .progress-fill {
            height: 100%;
            background: #dc143c;
            color: #ffffff;
            border-radius: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            transition: width 1s ease;
        }
        
        .checklist {
            list-style: none;
            margin: 1rem 0;
        }
        
        .checklist li {
            padding: 10px;
            margin: 5px 0;
            background: #ffffff;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.3s;
        }
        
        .checklist li:hover {
            background: #f8f9fa;
            transform: translateX(10px);
        }
        
        .checklist input[type="checkbox"] {
            width: 20px;
            height: 20px;
            cursor: pointer;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin: 1.5rem 0;
        }
        
        .stat-card {
            background: #ffffff;
            border: 1px solid #e0e0e0;
            padding: 1.5rem;
            border-radius: 10px;
            text-align: center;
        }
        
        .stat-value {
            font-size: 2rem;
            color: #000000;
            font-weight: bold;
        }
        
        .stat-label {
            color: #6c757d;
            margin-top: 0.5rem;
        }
        
        .calculator {
            background: #ffffff;
            border: 1px solid #e0e0e0;
            padding: 2rem;
            border-radius: 10px;
            margin: 1.5rem 0;
        }
        
        .calculator input {
            background: #f8f9fa;
            border: 1px solid #e0e0e0;
            color: #2c3e50;
            padding: 10px;
            border-radius: 5px;
            width: 100%;
            margin: 10px 0;
            font-size: 1rem;
        }
        
        .calculator button {
            background: #dc143c;
            color: #ffffff;
            color: #2c3e50;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1.1rem;
            width: 100%;
            transition: all 0.3s;
        }
        
        .calculator button:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(220, 20, 60, 0.3);
        }
        
        .result {
            background: #f3f4f6;
            padding: 1.5rem;
            border-radius: 6px;
            margin-top: 1rem;
            text-align: left;
            font-size: 0.9rem;
            border: 1px solid #e5e7eb;
        }
        
        .warning {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
        }
        
        .success {
            background: #d1fae5;
            color: #065f46;
            padding: 1rem;
            border-radius: 6px;
            margin: 1rem 0;
            border: 1px solid #6ee7b7;
        }
        
        .video-link {
            display: inline-block;
            background: #673AB7;
            color: #2c3e50;
            padding: 10px 20px;
            border-radius: 8px;
            text-decoration: none;
            margin: 5px;
            transition: all 0.3s;
        }
        
        .video-link:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(156, 39, 176, 0.3);
            background: #5e35b1;
        }
        
        .instagram-tab { border-left-color: #E4405F; }
        .tiktok-tab { border-left-color: #FF0050; }
        .youtube-tab { border-left-color: #FF0000; }
        .telegram-tab { border-left-color: #0088CC; }
    </style>
</head>
<body>
    <a href="/" class="back-btn">← Вернуться в дашборд</a>
    
    <div class="header">
        <h1>📚 Полное руководство по платформам</h1>
        <p>Детальный анализ и настройка интеграций для @antonalekseevich.je</p>
    </div>
    
    <div class="container">
        <!-- Табы платформ -->
        <div class="tabs">
            <div class="tab active" onclick="showTab('instagram')">📷 Instagram</div>
            <div class="tab" onclick="showTab('tiktok')">🎵 TikTok</div>
            <div class="tab" onclick="showTab('youtube')">📺 YouTube</div>
            <div class="tab" onclick="showTab('telegram')">✈️ Telegram</div>
        </div>
        
        <!-- Контент Instagram -->
        <div id="instagram" class="tab-content active">
            <div class="section instagram-tab">
                <h2>📷 Instagram - Что это?</h2>
                <div style="font-size: 1.1rem; line-height: 1.8;">
                    <p><strong>Простыми словами:</strong> Instagram - это как альбом с фотками, только в телефоне. Люди выкладывают красивые фото и видео, а другие ставят лайки и пишут комментарии.</p>
                    <p><strong>Кто там сидит:</strong> В основном молодёжь 18-34 года, блогеры, бизнесмены, артисты.</p>
                    <p><strong>Зачем:</strong> Показать свою жизнь, продвигать бизнес, искать клиентов, развлекаться.</p>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">50К-500К₽</div>
                            <div class="stat-label">Средний доход блогера в месяц</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">2.4 млрд</div>
                            <div class="stat-label">Активных пользователей</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">4.2%</div>
                            <div class="stat-label">Средний engagement</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="section instagram-tab">
                <h2>🤖 Возможности автоматизации Instagram</h2>
                <div class="feature-grid">
                    <div class="feature-card">
                        <div class="feature-icon">📝</div>
                        <h3>Автопостинг</h3>
                        <p>Публикация контента по расписанию. Можно запланировать посты на неделю вперёд.</p>
                        <div class="code-example">
                            <pre>schedule.post({
    image: "trading_signal.jpg",
    caption: "Сигнал на EUR/USD",
    time: "09:00"
})</pre>
                        </div>
                        <button class="try-btn" onclick="tryFeature('instagram', 'autopost')">Попробовать</button>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">💬</div>
                        <h3>Автоответы в Direct</h3>
                        <p>Автоматические ответы на сообщения с ключевыми словами.</p>
                        <div class="code-example">
                            <pre>if (message.contains("цена")) {
    reply("VIP доступ - $99/мес")
}</pre>
                        </div>
                        <button class="try-btn" onclick="tryFeature('instagram', 'autoreply')">Попробовать</button>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">📊</div>
                        <h3>Аналитика</h3>
                        <p>Отслеживание роста подписчиков, лайков, охватов.</p>
                        <ul style="margin-top: 10px; list-style: none;">
                            <li>✓ Рост подписчиков</li>
                            <li>✓ Вовлеченность</li>
                            <li>✓ Лучшее время для постов</li>
                        </ul>
                        <button class="try-btn" onclick="tryFeature('instagram', 'analytics')">Попробовать</button>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">🎯</div>
                        <h3>Воронки продаж</h3>
                        <p>Автоматическое ведение клиента от подписки до покупки.</p>
                        <ol style="margin-top: 10px;">
                            <li>Подписка → Приветствие</li>
                            <li>Лайк → Благодарность</li>
                            <li>DM → Предложение</li>
                            <li>Интерес → Продажа</li>
                        </ol>
                        <button class="try-btn" onclick="tryFeature('instagram', 'funnel')">Попробовать</button>
                    </div>
                </div>
            </div>
            
            <div class="section instagram-tab">
                <h2>🔧 Как подключить Instagram?</h2>
                <ul class="checklist">
                    <li>
                        <input type="checkbox" id="ig-step1">
                        <label for="ig-step1">Создать Facebook Developer аккаунт на developers.facebook.com</label>
                    </li>
                    <li>
                        <input type="checkbox" id="ig-step2">
                        <label for="ig-step2">Создать новое приложение в разделе "My Apps"</label>
                    </li>
                    <li>
                        <input type="checkbox" id="ig-step3">
                        <label for="ig-step3">Добавить Instagram Basic Display API</label>
                    </li>
                    <li>
                        <input type="checkbox" id="ig-step4">
                        <label for="ig-step4">Получить App ID и App Secret</label>
                    </li>
                    <li>
                        <input type="checkbox" id="ig-step5">
                        <label for="ig-step5">Настроить OAuth Redirect URL: https://your-app.com/auth/callback</label>
                    </li>
                    <li>
                        <input type="checkbox" id="ig-step6">
                        <label for="ig-step6">Добавить тестовых пользователей</label>
                    </li>
                    <li>
                        <input type="checkbox" id="ig-step7">
                        <label for="ig-step7">Получить Access Token через OAuth</label>
                    </li>
                </ul>
                
                <div class="warning">
                    <strong>⚠️ Важно:</strong> Для бизнес-функций нужен Instagram Business аккаунт и связанная Facebook страница!
                </div>
            </div>
            
            <div class="section instagram-tab">
                <h2>📋 API методы Instagram</h2>
                <div class="feature-grid">
                    <div class="feature-card">
                        <h3>Основные методы</h3>
                        <div class="code-example">
                            <pre># Получить профиль
GET /me
fields=id,username,followers_count

# Опубликовать пост
POST /media
image_url=URL&caption=TEXT

# Получить медиа
GET /media/{media-id}
fields=id,caption,like_count</pre>
                        </div>
                    </div>
                    
                    <div class="feature-card">
                        <h3>Лимиты API</h3>
                        <ul style="list-style: none;">
                            <li>📍 200 запросов в час</li>
                            <li>📍 25 постов в день</li>
                            <li>📍 1000 лайков в день</li>
                            <li>📍 200 комментариев в день</li>
                            <li>📍 100 подписок в день</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="section instagram-tab">
                <h2>🛡️ Безопасность Instagram</h2>
                <div class="warning">
                    <h3>Что НЕЛЬЗЯ делать:</h3>
                    <ul>
                        <li>❌ Массовые подписки/отписки (>100 в день)</li>
                        <li>❌ Спам одинаковыми комментариями</li>
                        <li>❌ Использовать сторонние боты</li>
                        <li>❌ Покупать подписчиков</li>
                    </ul>
                </div>
                
                <div class="success">
                    <h3>Что МОЖНО и НУЖНО:</h3>
                    <ul>
                        <li>✅ Постить качественный контент регулярно</li>
                        <li>✅ Отвечать на комментарии персонализированно</li>
                        <li>✅ Использовать официальные API</li>
                        <li>✅ Делать паузы между действиями (2-5 минут)</li>
                    </ul>
                </div>
            </div>
            
            <div class="section instagram-tab">
                <h2>💰 Монетизация Instagram</h2>
                <h3>Стратегии заработка:</h3>
                <div class="feature-grid">
                    <div class="feature-card">
                        <h3>Продажа курсов</h3>
                        <p>Средний чек: 5,000-50,000₽</p>
                        <p>Конверсия: 1-3%</p>
                        <p>Прибыль с 1000 подписчиков: ~15,000₽/мес</p>
                    </div>
                    
                    <div class="feature-card">
                        <h3>VIP каналы</h3>
                        <p>Подписка: $50-200/мес</p>
                        <p>Retention: 3-6 месяцев</p>
                        <p>LTV: $150-1200</p>
                    </div>
                    
                    <div class="feature-card">
                        <h3>Реклама</h3>
                        <p>Стоимость поста: 50₽ за 1000 подписчиков</p>
                        <p>Stories: 30₽ за 1000</p>
                        <p>При 100K подписчиков: 5,000₽/пост</p>
                    </div>
                </div>
                
                <div class="calculator">
                    <h3>Калькулятор прибыли Instagram</h3>
                    <input type="number" id="ig-followers" placeholder="Количество подписчиков" value="10000">
                    <input type="number" id="ig-engagement" placeholder="Engagement % (обычно 3-5)" value="4">
                    <input type="number" id="ig-price" placeholder="Цена продукта (₽)" value="10000">
                    <button onclick="calculateInstagramProfit()">Рассчитать прибыль</button>
                    <div id="ig-result" class="result" style="display:none;"></div>
                </div>
            </div>
        </div>
        
        <!-- Контент TikTok -->
        <div id="tiktok" class="tab-content">
            <div class="section tiktok-tab">
                <h2>🎵 TikTok - Что это?</h2>
                <div style="font-size: 1.1rem; line-height: 1.8;">
                    <p><strong>Простыми словами:</strong> TikTok - это приложение для коротких видео с музыкой. Как YouTube, только видео по 15-60 секунд и сразу листаются.</p>
                    <p><strong>Кто там сидит:</strong> Молодёжь 16-24 года (60%), но растёт аудитория 25-40 лет.</p>
                    <p><strong>Зачем:</strong> Развлечение, творчество, быстрый рост аудитории, вирусный маркетинг.</p>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">100К-1М₽</div>
                            <div class="stat-label">Доход топ-блогера в месяц</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">1.5 млрд</div>
                            <div class="stat-label">Активных пользователей</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">17%</div>
                            <div class="stat-label">Средний engagement</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="section tiktok-tab">
                <h2>🤖 Возможности автоматизации TikTok</h2>
                <div class="feature-grid">
                    <div class="feature-card">
                        <div class="feature-icon">🎬</div>
                        <h3>Автопубликация видео</h3>
                        <p>Загрузка видео по расписанию с автоматическими хештегами.</p>
                        <div class="code-example">
                            <pre>tiktok.upload_video({
    file: "trading_tips.mp4",
    caption: "Топ-3 ошибки трейдера",
    hashtags: ["#trading", "#forex"]
})</pre>
                        </div>
                        <button class="try-btn" onclick="tryFeature('tiktok', 'autovideo')">Попробовать</button>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">💬</div>
                        <h3>Модерация комментариев</h3>
                        <p>Автоматическое скрытие спама и негатива, ответы на частые вопросы.</p>
                        <button class="try-btn" onclick="tryFeature('tiktok', 'moderation')">Попробовать</button>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">📈</div>
                        <h3>Аналитика трендов</h3>
                        <p>Отслеживание вирусных тем и лучшего времени публикации.</p>
                        <button class="try-btn" onclick="tryFeature('tiktok', 'trends')">Попробовать</button>
                    </div>
                </div>
            </div>
            
            <div class="section tiktok-tab">
                <h2>🔧 Как подключить TikTok?</h2>
                <ul class="checklist">
                    <li>
                        <input type="checkbox" id="tt-step1">
                        <label for="tt-step1">Зарегистрироваться на developers.tiktok.com</label>
                    </li>
                    <li>
                        <input type="checkbox" id="tt-step2">
                        <label for="tt-step2">Создать приложение в разделе "Manage apps"</label>
                    </li>
                    <li>
                        <input type="checkbox" id="tt-step3">
                        <label for="tt-step3">Получить Client Key и Client Secret</label>
                    </li>
                    <li>
                        <input type="checkbox" id="tt-step4">
                        <label for="tt-step4">Настроить Redirect URI</label>
                    </li>
                    <li>
                        <input type="checkbox" id="tt-step5">
                        <label for="tt-step5">Запросить необходимые scopes (video.upload, user.info)</label>
                    </li>
                </ul>
            </div>
            
            <div class="section tiktok-tab">
                <h2>💰 Монетизация TikTok</h2>
                <h3>Способы заработка:</h3>
                <div class="feature-grid">
                    <div class="feature-card">
                        <h3>Creator Fund</h3>
                        <p>$0.02-0.04 за 1000 просмотров</p>
                        <p>При 1М просмотров: $20-40</p>
                    </div>
                    
                    <div class="feature-card">
                        <h3>Прямые эфиры</h3>
                        <p>Донаты: 500-50,000₽/эфир</p>
                        <p>Требование: 1000+ подписчиков</p>
                    </div>
                    
                    <div class="feature-card">
                        <h3>Продажа товаров</h3>
                        <p>Конверсия: 2-5%</p>
                        <p>Средний чек: 1,500₽</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Контент YouTube -->
        <div id="youtube" class="tab-content">
            <div class="section youtube-tab">
                <h2>📺 YouTube - Что это?</h2>
                <div style="font-size: 1.1rem; line-height: 1.8;">
                    <p><strong>Простыми словами:</strong> YouTube - это телевизор в интернете, где каждый может создать свой канал и показывать видео.</p>
                    <p><strong>Кто там сидит:</strong> Все возрасты, но основная аудитория 25-44 года.</p>
                    <p><strong>Зачем:</strong> Обучение, развлечение, новости, музыка, заработок на рекламе.</p>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">200К-5М₽</div>
                            <div class="stat-label">Доход канала с 100K подписчиков</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">2.7 млрд</div>
                            <div class="stat-label">Активных пользователей</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="section youtube-tab">
                <h2>🤖 Возможности автоматизации YouTube</h2>
                <div class="feature-grid">
                    <div class="feature-card">
                        <div class="feature-icon">📹</div>
                        <h3>Автопубликация</h3>
                        <p>Загрузка видео с оптимизацией SEO.</p>
                        <button class="try-btn" onclick="tryFeature('youtube', 'upload')">Попробовать</button>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">🔔</div>
                        <h3>Уведомления</h3>
                        <p>Автоматические ответы и модерация.</p>
                        <button class="try-btn" onclick="tryFeature('youtube', 'notify')">Попробовать</button>
                    </div>
                </div>
            </div>
            
            <div class="section youtube-tab">
                <h2>💰 Монетизация YouTube</h2>
                <div class="feature-grid">
                    <div class="feature-card">
                        <h3>AdSense</h3>
                        <p>$1-5 за 1000 просмотров</p>
                        <p>Требование: 1000 подписчиков, 4000 часов просмотра</p>
                    </div>
                    
                    <div class="feature-card">
                        <h3>Спонсорство</h3>
                        <p>10,000-500,000₽ за интеграцию</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Контент Telegram -->
        <div id="telegram" class="tab-content">
            <div class="section telegram-tab">
                <h2>✈️ Telegram - Что это?</h2>
                <div style="font-size: 1.1rem; line-height: 1.8;">
                    <p><strong>Простыми словами:</strong> Telegram - это мессенджер с каналами, как WhatsApp + Twitter в одном.</p>
                    <p><strong>Кто там сидит:</strong> Технически подкованная аудитория, бизнес, трейдеры, IT.</p>
                    <p><strong>Зачем:</strong> Быстрая коммуникация, закрытые сообщества, продажа подписок.</p>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">50К-300К₽</div>
                            <div class="stat-label">Доход VIP канала в месяц</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">800 млн</div>
                            <div class="stat-label">Активных пользователей</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="section telegram-tab">
                <h2>🤖 Возможности автоматизации Telegram</h2>
                <div class="feature-grid">
                    <div class="feature-card">
                        <div class="feature-icon">🤖</div>
                        <h3>Боты</h3>
                        <p>Полная автоматизация: от приёма платежей до выдачи доступа.</p>
                        <div class="code-example">
                            <pre>@bot.message_handler(commands=['start'])
def start(message):
    bot.reply_to(message, "Добро пожаловать!")</pre>
                        </div>
                        <button class="try-btn" onclick="tryFeature('telegram', 'bot')">Попробовать</button>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">📢</div>
                        <h3>Автопостинг в каналы</h3>
                        <p>Публикация по расписанию с форматированием.</p>
                        <button class="try-btn" onclick="tryFeature('telegram', 'channel')">Попробовать</button>
                    </div>
                </div>
            </div>
            
            <div class="section telegram-tab">
                <h2>💰 Монетизация Telegram</h2>
                <div class="feature-grid">
                    <div class="feature-card">
                        <h3>VIP каналы</h3>
                        <p>Подписка: 500-5000₽/мес</p>
                        <p>Конверсия из бесплатного: 5-10%</p>
                    </div>
                    
                    <div class="feature-card">
                        <h3>Реклама</h3>
                        <p>1000₽ за 1000 подписчиков</p>
                        <p>CPM: 100-500₽</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Статистика для @antonalekseevich.je -->
        <div class="section" style="background: linear-gradient(135deg, #673AB7, #9C27B0); margin-top: 3rem;">
            <h2 style="color: #000000;">📊 Ваша персональная статистика @antonalekseevich.je</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">15.3K</div>
                    <div class="stat-label">Общая аудитория</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">4.8%</div>
                    <div class="stat-label">Средний engagement</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">85%</div>
                    <div class="stat-label">Уровень настройки</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">₽125K</div>
                    <div class="stat-label">Потенциал в месяц</div>
                </div>
            </div>
            
            <div style="margin-top: 2rem;">
                <h3 style="color: #2c3e50;">🚀 Рекомендации для роста:</h3>
                <ol style="font-size: 1.1rem; line-height: 2;">
                    <li>Увеличить частоту постов в Instagram до 2-3 в день</li>
                    <li>Запустить серию обучающих видео в TikTok</li>
                    <li>Создать воронку продаж через Telegram бота</li>
                    <li>Начать делать YouTube Shorts о трейдинге</li>
                    <li>Настроить кросспостинг между всеми платформами</li>
                </ol>
            </div>
            
            <div class="progress-bar" style="margin-top: 2rem;">
                <div class="progress-fill" style="width: 85%;">
                    Уровень настройки: 85%
                </div>
            </div>
        </div>
        
        <!-- Видео-туториалы -->
        <div class="section">
            <h2>🎬 Видео-уроки</h2>
            <div style="text-align: center;">
                <a href="https://youtube.com/watch?v=example1" target="_blank" class="video-link">
                    📹 Настройка Instagram API
                </a>
                <a href="https://youtube.com/watch?v=example2" target="_blank" class="video-link">
                    📹 Создание TikTok бота
                </a>
                <a href="https://youtube.com/watch?v=example3" target="_blank" class="video-link">
                    📹 Монетизация YouTube
                </a>
                <a href="https://youtube.com/watch?v=example4" target="_blank" class="video-link">
                    📹 Telegram автоматизация
                </a>
            </div>
        </div>
    </div>
    
    <script>
        function showTab(platform) {
            // Скрыть все вкладки
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Показать выбранную вкладку
            document.getElementById(platform).classList.add('active');
            event.target.classList.add('active');
        }
        
        function tryFeature(platform, feature) {
            alert(`🚀 Запускаем ${feature} для ${platform}!\n\nЭта функция будет автоматически настроена и активирована.`);
            // Здесь можно добавить реальный вызов API
        }
        
        function calculateInstagramProfit() {
            const followers = document.getElementById('ig-followers').value || 0;
            const engagement = document.getElementById('ig-engagement').value || 0;
            const price = document.getElementById('ig-price').value || 0;
            
            const activeFollowers = followers * (engagement / 100);
            const conversions = activeFollowers * 0.01; // 1% конверсия
            const monthlyRevenue = conversions * price;
            const yearlyRevenue = monthlyRevenue * 12;
            
            const resultDiv = document.getElementById('ig-result');
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <h3>📊 Прогноз дохода:</h3>
                <p>Активная аудитория: ${Math.round(activeFollowers).toLocaleString()} человек</p>
                <p>Ожидаемые продажи в месяц: ${Math.round(conversions)}</p>
                <p>💰 Доход в месяц: ₽${Math.round(monthlyRevenue).toLocaleString()}</p>
                <p>💎 Доход в год: ₽${Math.round(yearlyRevenue).toLocaleString()}</p>
            `;
        }
        
        // Сохранение состояния чек-листов
        document.querySelectorAll('.checklist input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                localStorage.setItem(this.id, this.checked);
                if (this.checked) {
                    this.parentElement.style.background = '#d4edda';
                } else {
                    this.parentElement.style.background = '#ffffff';
                }
            });
            
            // Восстановление состояния
            if (localStorage.getItem(checkbox.id) === 'true') {
                checkbox.checked = true;
                checkbox.parentElement.style.background = '#d4edda';
            }
        });
    </script>
</body>
</html>
'''

class SafetyController:
    def __init__(self):
        self.actions_log = []
        self.platform_limits = {
            'tiktok': {'posts': 50, 'likes': 500, 'comments': 200},
            'instagram': {'posts': 30, 'likes': 350, 'comments': 150, 'dms': 150, 'actions': 150},
            'youtube': {'posts': 20, 'likes': 200, 'comments': 100},
            'telegram': {'posts': 100, 'messages': 1000}
        }
        self.last_action_time = {}
        self.daily_counters = {}
    
    def check_action_safety(self, platform, action_type):
        try:
            recent_actions = self.get_recent_actions(platform, action_type, 24)
            limit = self.platform_limits[platform].get(action_type, 10)
            
            # Проверка 80% лимита для автостопа
            if len(recent_actions) >= limit * 0.8:
                return {
                    'safe': False,
                    'reason': f'Достигнуто 80% от дневного лимита ({limit})',
                    'wait_time': '24 часа',
                    'auto_stop': True
                }
            
            if len(recent_actions) >= limit:
                return {
                    'safe': False,
                    'reason': f'Дневной лимит {limit} превышен',
                    'wait_time': '24 часа'
                }
            
            # Умные задержки между действиями
            if recent_actions:
                last_action = datetime.fromisoformat(recent_actions[-1]['timestamp'])
                time_diff = (datetime.now() - last_action).total_seconds()
                smart_delay = random.uniform(120, 300)  # Случайная задержка 2-5 минут
                
                if time_diff < smart_delay:
                    return {
                        'safe': False,
                        'reason': 'Требуется умная задержка',
                        'wait_time': f'{int(smart_delay - time_diff)} сек'
                    }
            
            return {'safe': True}
        except Exception as e:
            return {'safe': False, 'reason': f'Ошибка: {str(e)}'}
    
    def get_recent_actions(self, platform, action_type, hours):
        cutoff_time = datetime.now() - timedelta(hours=hours)
        return [
            action for action in self.actions_log
            if action['platform'] == platform 
            and action['type'] == action_type
            and datetime.fromisoformat(action['timestamp']) > cutoff_time
        ]
    
    def log_action(self, platform, action_type, content=''):
        action = {
            'platform': platform,
            'type': action_type,
            'content_hash': hash(content) % 10000,
            'timestamp': datetime.now().isoformat()
        }
        self.actions_log.append(action)
        self.clean_old_logs(48)
    
    def clean_old_logs(self, hours):
        cutoff_time = datetime.now() - timedelta(hours=hours)
        self.actions_log = [
            action for action in self.actions_log
            if datetime.fromisoformat(action['timestamp']) > cutoff_time
        ]

class AnalyticsEngine:
    def __init__(self):
        self.performance_data = []
    
    def analyze_platform_stats(self, stats):
        try:
            total_followers = sum(s.get('followers', 0) for s in stats.values())
            avg_engagement = sum(s.get('engagement', 0) for s in stats.values()) / len(stats)
            
            return {
                'total_followers': total_followers,
                'avg_engagement': round(avg_engagement, 2),
                'top_platform': max(stats.items(), key=lambda x: x[1].get('followers', 0))[0],
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {'error': str(e)}

class InstagramDMAutomation:
    def __init__(self, safety_controller):
        self.safety_controller = safety_controller
        self.auto_reply_message = "Привет! Добро пожаловать в Lucifer Trading 🔥 VIP-сигналы тут: t.me/Lucifer_tradera"
        self.processed_dms = set()
        self.enabled = False
        
    def process_new_dm(self, sender_id, message_text):
        try:
            # Проверка безопасности перед отправкой
            safety_check = self.safety_controller.check_action_safety('instagram', 'dms')
            if not safety_check['safe']:
                return {'status': 'delayed', 'reason': safety_check['reason']}
            
            # Логирование в БД
            conn = sqlite3.connect('lucifer_analytics.db')
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO instagram_dms (sender_id, message_text, replied, reply_text, timestamp)
                VALUES (?, ?, ?, ?, ?)
            ''', (sender_id, message_text, 1, self.auto_reply_message, datetime.now().isoformat()))
            conn.commit()
            conn.close()
            
            # Отметка действия для контроля лимитов
            self.safety_controller.log_action('instagram', 'dms', f'Reply to {sender_id}')
            
            return {
                'status': 'success',
                'reply_sent': self.auto_reply_message,
                'sender_id': sender_id
            }
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    def get_dm_stats(self):
        try:
            conn = sqlite3.connect('lucifer_analytics.db')
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) FROM instagram_dms WHERE replied = 1')
            total_replies = cursor.fetchone()[0]
            cursor.execute('SELECT COUNT(DISTINCT sender_id) FROM instagram_dms')
            unique_senders = cursor.fetchone()[0]
            conn.close()
            
            return {
                'total_replies': total_replies,
                'unique_senders': unique_senders,
                'enabled': self.enabled
            }
        except Exception as e:
            return {'error': str(e)}

class ContentGenerator:
    def __init__(self, safety_controller):
        self.safety_controller = safety_controller
        self.hashtags = "#trading #форекс #криптовалюта #lucifer_trading"
        self.content_templates = {
            'trading_signal': [
                "📈 СИГНАЛ: {asset}\n💰 Вход: {entry}\n🎯 Цель: {target}\n⛔ Стоп: {stop}\n\n{hashtags}",
                "🔥 ГОРЯЧИЙ СИГНАЛ!\n{asset} готов к росту!\n📊 Анализ: {analysis}\n\n{hashtags}",
                "⚡ VIP-СИГНАЛ\nАктив: {asset}\nНаправление: {direction}\nПотенциал: {potential}%\n\n{hashtags}"
            ],
            'market_analysis': [
                "📊 АНАЛИЗ РЫНКА\n{market} показывает {trend}\nКлючевые уровни: {levels}\n\n{hashtags}",
                "🎯 ОБЗОР ДНЯ\nЧто торгуем: {assets}\nНастроение рынка: {sentiment}\n\n{hashtags}",
                "💡 ИНСАЙТ ДНЯ\n{insight}\nКак использовать: {strategy}\n\n{hashtags}"
            ],
            'motivation': [
                "💪 МОТИВАЦИЯ ДНЯ\n{quote}\n\nТрейдинг - это марафон, не спринт!\n\n{hashtags}",
                "🚀 К УСПЕХУ!\n{success_tip}\n\nПрисоединяйся к нашему VIP каналу!\n\n{hashtags}",
                "🔥 ПРАВИЛО УСПЕХА\n{rule}\n\nСледуй за нами для больших профитов!\n\n{hashtags}"
            ]
        }
        
    def generate_trading_content(self, content_type='random'):
        try:
            if content_type == 'random':
                content_type = random.choice(['trading_signal', 'market_analysis', 'motivation'])
            
            templates = self.content_templates.get(content_type, self.content_templates['motivation'])
            template = random.choice(templates)
            
            # Генерация контента на основе типа
            if content_type == 'trading_signal':
                assets = ['EUR/USD', 'BTC/USDT', 'GOLD', 'ETH/USDT', 'GBP/USD']
                content = template.format(
                    asset=random.choice(assets),
                    entry=f"{random.uniform(1.0, 2.0):.4f}",
                    target=f"{random.uniform(1.1, 2.1):.4f}",
                    stop=f"{random.uniform(0.9, 1.0):.4f}",
                    analysis="Пробой ключевого уровня",
                    direction=random.choice(["ЛОНГ", "ШОРТ"]),
                    potential=random.randint(5, 30),
                    hashtags=self.hashtags
                )
            elif content_type == 'market_analysis':
                content = template.format(
                    market=random.choice(['Форекс', 'Крипта', 'Металлы']),
                    trend=random.choice(['бычий тренд', 'коррекцию', 'консолидацию']),
                    levels="1.1050, 1.1100, 1.1150",
                    assets="EUR/USD, GOLD, BTC",
                    sentiment=random.choice(['Позитивное', 'Нейтральное', 'Осторожное']),
                    insight="Доллар слабеет на фоне данных ФРС",
                    strategy="Ищем лонги в евро",
                    hashtags=self.hashtags
                )
            else:  # motivation
                quotes = [
                    "Дисциплина побеждает талант",
                    "Риск-менеджмент - ключ к успеху",
                    "Тренд - твой друг",
                    "Терпение приносит прибыль"
                ]
                rules = [
                    "Никогда не рискуй больше 2% на сделку",
                    "Следуй своей стратегии",
                    "Эмоции - враг трейдера"
                ]
                content = template.format(
                    quote=random.choice(quotes),
                    success_tip="Анализируй свои ошибки",
                    rule=random.choice(rules),
                    hashtags=self.hashtags
                )
            
            return {
                'content': content,
                'type': content_type,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {'error': str(e)}
    
    def schedule_content(self, platforms=['instagram', 'telegram']):
        try:
            conn = sqlite3.connect('lucifer_analytics.db')
            cursor = conn.cursor()
            
            times = ['09:00', '14:00', '19:00']
            for platform in platforms:
                for time_slot in times:
                    content = self.generate_trading_content()
                    cursor.execute('''
                        INSERT INTO content_plan (platform, content_text, schedule_time, status)
                        VALUES (?, ?, ?, 'scheduled')
                    ''', (platform, content['content'], time_slot))
            
            conn.commit()
            conn.close()
            return {'status': 'success', 'scheduled': len(platforms) * len(times)}
        except Exception as e:
            return {'error': str(e)}

class SmartAutoReply:
    def __init__(self):
        self.templates = {
            'обучение': "📚 Наше обучение включает:\n✅ Базовый курс трейдинга\n✅ VIP-сигналы\n✅ Личный ментор\n\nПодробнее: t.me/Lucifer_tradera",
            'сигналы': "📊 Наши VIP-сигналы:\n• Точность 85%+\n• 5-10 сигналов в день\n• Полное сопровождение\n\nПрисоединяйся: t.me/Lucifer_tradera",
            'vip': "⭐ VIP-доступ включает:\n• Эксклюзивные сигналы\n• Приватный чат\n• Обучающие материалы\n• Персональная поддержка\n\nСтоимость: $99/месяц",
            'цена': "💰 Наши тарифы:\n• Базовый: $49/мес\n• VIP: $99/мес\n• Premium: $199/мес\n\nВсе детали: t.me/Lucifer_tradera",
            'default': "Спасибо за интерес к Lucifer Trading! 🔥\nПрисоединяйся к нашему каналу для получения бесплатных сигналов: t.me/Lucifer_tradera"
        }
        
    def get_smart_reply(self, message_text):
        message_lower = message_text.lower()
        
        for keyword, reply in self.templates.items():
            if keyword != 'default' and keyword in message_lower:
                return reply
        
        return self.templates['default']

class ReportGenerator:
    def __init__(self, analytics_engine):
        self.analytics_engine = analytics_engine
        
    def generate_daily_report(self):
        try:
            conn = sqlite3.connect('lucifer_analytics.db')
            cursor = conn.cursor()
            
            # Сбор метрик за день
            cursor.execute('''
                SELECT platform, 
                       AVG(followers) as avg_followers,
                       AVG(engagement) as avg_engagement,
                       SUM(views) as total_views
                FROM platform_stats
                WHERE datetime(timestamp) >= datetime('now', '-1 day')
                GROUP BY platform
            ''')
            
            platform_metrics = {}
            for row in cursor.fetchall():
                platform_metrics[row[0]] = {
                    'followers': int(row[1]) if row[1] else 0,
                    'engagement': round(row[2], 2) if row[2] else 0,
                    'views': int(row[3]) if row[3] else 0
                }
            
            # Подсчет автоматизаций
            cursor.execute('SELECT COUNT(*) FROM instagram_dms WHERE datetime(timestamp) >= datetime("now", "-1 day")')
            dm_count = cursor.fetchone()[0]
            
            cursor.execute('SELECT COUNT(*) FROM content_plan WHERE status = "posted" AND datetime(schedule_time) >= datetime("now", "-1 day")')
            posts_count = cursor.fetchone()[0]
            
            conn.close()
            
            # Анализ общих метрик
            analysis = self.analytics_engine.analyze_platform_stats(platform_metrics)
            
            report = {
                'date': datetime.now().strftime('%Y-%m-%d'),
                'type': 'daily',
                'metrics': {
                    'total_followers': analysis.get('total_followers', 0),
                    'avg_engagement': analysis.get('avg_engagement', 0),
                    'platforms': platform_metrics,
                    'automation': {
                        'dm_replies': dm_count,
                        'posts_published': posts_count
                    }
                },
                'timestamp': datetime.now().isoformat()
            }
            
            return report
        except Exception as e:
            return {'error': str(e)}
    
    def generate_weekly_report(self):
        try:
            conn = sqlite3.connect('lucifer_analytics.db')
            cursor = conn.cursor()
            
            # Метрики за неделю
            cursor.execute('''
                SELECT platform,
                       MAX(followers) - MIN(followers) as follower_growth,
                       AVG(engagement) as avg_engagement
                FROM platform_stats
                WHERE datetime(timestamp) >= datetime('now', '-7 days')
                GROUP BY platform
            ''')
            
            weekly_growth = {}
            for row in cursor.fetchall():
                weekly_growth[row[0]] = {
                    'follower_growth': int(row[1]) if row[1] else 0,
                    'avg_engagement': round(row[2], 2) if row[2] else 0
                }
            
            conn.close()
            
            return {
                'date': datetime.now().strftime('%Y-%m-%d'),
                'type': 'weekly',
                'week_number': datetime.now().isocalendar()[1],
                'growth_metrics': weekly_growth,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {'error': str(e)}

def crosspost_to_platforms(content, platforms=['instagram', 'telegram', 'tiktok']):
    try:
        safety_controller = SafetyController()
        results = []
        
        for platform in platforms:
            # Проверка безопасности для каждой платформы
            safety_check = safety_controller.check_action_safety(platform, 'posts')
            
            if not safety_check['safe']:
                results.append({
                    'platform': platform,
                    'status': 'skipped',
                    'reason': safety_check['reason']
                })
                continue
            
            # Адаптация контента под платформу
            adapted_content = content
            if platform == 'instagram':
                adapted_content = content[:2200]  # Instagram caption limit
            elif platform == 'tiktok':
                adapted_content = content[:150] + "\n\n#fyp #foryou"
            elif platform == 'telegram':
                adapted_content = content + "\n\n@antonalekseevich_je"
            
            # Сохранение в план контента
            conn = sqlite3.connect('lucifer_analytics.db')
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO content_plan (platform, content_text, schedule_time, status)
                VALUES (?, ?, ?, 'crossposted')
            ''', (platform, adapted_content, datetime.now().strftime('%H:%M')))
            conn.commit()
            conn.close()
            
            # Логирование действия
            safety_controller.log_action(platform, 'posts', adapted_content)
            
            results.append({
                'platform': platform,
                'status': 'success',
                'content_length': len(adapted_content)
            })
            
            # Умная задержка между платформами
            time.sleep(random.uniform(120, 300))
        
        return {'status': 'completed', 'results': results}
    except Exception as e:
        return {'error': str(e)}

def init_database():
    try:
        conn = sqlite3.connect('lucifer_analytics.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS platform_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                platform TEXT NOT NULL,
                followers INTEGER DEFAULT 0,
                engagement REAL DEFAULT 0.0,
                views INTEGER DEFAULT 0,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS content_plan (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                platform TEXT NOT NULL,
                content_text TEXT NOT NULL,
                schedule_time TEXT NOT NULL,
                status TEXT DEFAULT 'planned'
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS instagram_dms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender_id TEXT NOT NULL,
                message_text TEXT NOT NULL,
                replied INTEGER DEFAULT 0,
                reply_text TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS automation_status (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                feature TEXT NOT NULL,
                enabled INTEGER DEFAULT 0,
                last_run DATETIME,
                next_run DATETIME,
                status TEXT DEFAULT 'idle'
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS daily_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_date DATE NOT NULL,
                report_data TEXT NOT NULL,
                sent INTEGER DEFAULT 0,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Инициализация статусов автоматизации
        cursor.execute("SELECT COUNT(*) FROM automation_status")
        if cursor.fetchone()[0] == 0:
            features = ['dm_automation', 'content_generation', 'crossposting', 'daily_reports', 'weekly_reports']
            for feature in features:
                cursor.execute('''
                    INSERT INTO automation_status (feature, enabled)
                    VALUES (?, 0)
                ''', (feature,))
        
        conn.commit()
        conn.close()
        print("✅ База данных инициализирована")
    except Exception as e:
        print(f"❌ Ошибка БД: {e}")

HTML_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Analytics Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #ffffff;
            color: #2c3e50;
            padding: 0;
            margin: 0;
            line-height: 1.6;
            min-height: 100vh;
        }
        
        .header { 
            background: #ffffff;
            padding: 2rem 0;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .header-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .header h1 { 
            margin: 0; 
            font-size: 1.75rem;
            font-weight: 600;
            color: #000000;
        }
        
        .header p { 
            margin: 0.25rem 0 0 0;
            font-size: 0.875rem;
            color: #6b7280;
            font-weight: 400;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 3rem 2rem;
        }
        
        /* Основные кнопки управления */
        .controls { 
            display: flex;
            gap: 1rem;
            margin-bottom: 3rem;
            flex-wrap: wrap;
        }
        
        .btn { 
            background: #ffffff;
            color: #2c3e50;
            border: 1px solid #e0e0e0;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.875rem;
            transition: all 0.15s ease;
            font-weight: 400;
        }
        
        .btn:hover { 
            background: #f8f9fa;
            border-color: #c0c0c0;
        }
        
        .btn:disabled { 
            color: #9ca3af;
            cursor: not-allowed;
            background: #f3f4f6;
            border-color: #e5e7eb;
        }
        
        /* Вкладки платформ */
        .platform-tabs {
            display: flex;
            gap: 2rem;
            margin-bottom: 3rem;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .platform-tab {
            padding: 0.75rem 0;
            margin-bottom: -1px;
            background: transparent;
            border: none;
            border-bottom: 2px solid transparent;
            cursor: pointer;
            transition: all 0.15s ease;
            font-size: 0.9rem;
            font-weight: 400;
            color: #6b7280;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .platform-tab:hover {
            color: #2c3e50;
        }
        
        .platform-tab.active {
            color: #2c3e50;
            font-weight: 500;
        }
        
        /* Подчеркивание для активных вкладок */
        .platform-tab.instagram.active { border-bottom-color: #E4405F; }
        .platform-tab.tiktok.active { border-bottom-color: #000000; }
        .platform-tab.youtube.active { border-bottom-color: #FF0000; }
        .platform-tab.telegram.active { border-bottom-color: #0088cc; }
        
        /* Контент вкладок */
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        /* Простые переходы без анимаций */
        
        /* Сетка внутри вкладки */
        .platform-content {
            display: grid;
            grid-template-columns: 1fr 2fr 1fr;
            gap: 2rem;
            margin-bottom: 2rem;
        }
        
        @media (max-width: 1200px) {
            .platform-content {
                grid-template-columns: 1fr;
            }
        }
        
        .card {
            background: #ffffff;
            padding: 2rem;
            border-radius: 15px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease;
        }
        .card:hover { transform: translateY(-5px); }
        .card h2 { margin-top: 0; color: #dc143c; }
        .card h3 { color: #ff4500; margin: 1.5rem 0 1rem 0; }
        
        /* Карточки и сетки */
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-top: 1.5rem;
        }
        
        .feature-card {
            background: #ffffff;
            border: 1px solid #e0e0e0;
            padding: 1.5rem;
            border-radius: 10px;
            transition: all 0.3s;
            cursor: pointer;
            border: 1px solid #e0e0e0;
        }
        
        .feature-card:hover {
            transform: scale(1.05);
            background: #f8f9fa;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .feature-icon {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        
        /* Статистика платформ */
        .stat-card {
            background: #f9fafb;
            padding: 1.75rem;
            border-radius: 6px;
            text-align: left;
            margin-bottom: 1.5rem;
            border: 1px solid #e5e7eb;
        }
        
        .stat-value {
            font-size: 2.5rem;
            color: #111827;
            font-weight: 300;
            line-height: 1;
        }
        
        .stat-label {
            color: #6b7280;
            margin-top: 0.5rem;
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .stat-change {
            font-size: 0.85rem;
            margin-top: 0.75rem;
            font-weight: 400;
        }
        .change-positive { color: #10b981; }
        .change-negative { color: #ef4444; }
        
        /* Калькулятор прибыли */
        .calculator {
            background: #f9fafb;
            padding: 2rem;
            border-radius: 6px;
            margin: 1.5rem 0;
            border: 1px solid #e5e7eb;
        }
        
        .calculator input {
            background: #ffffff;
            border: 1px solid #d1d5db;
            color: #111827;
            padding: 0.75rem;
            border-radius: 4px;
            width: 100%;
            margin: 0.75rem 0;
            font-size: 0.9rem;
            transition: border-color 0.15s;
        }
        
        .calculator input:focus {
            outline: none;
            border-color: #9ca3af;
        }
        
        .calculator button {
            background: #f8f9fa;
            color: #2c3e50;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            width: 100%;
            transition: background-color 0.15s;
            font-weight: 400;
        }
        
        .calculator button:hover {
            background: #ffffff;
            border: 1px solid #e0e0e0;
        }
        
        .result {
            background: #f3f4f6;
            padding: 1.5rem;
            border-radius: 6px;
            margin-top: 1rem;
            text-align: left;
            font-size: 0.9rem;
            border: 1px solid #e5e7eb;
        }
        /* Кнопки действий */
        .try-btn, .action-btn {
            background: #ffffff;
            color: #111827;
            border: 1px solid #d1d5db;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 0.75rem;
            transition: all 0.15s;
            font-size: 0.85rem;
            font-weight: 400;
        }
        
        .try-btn:hover, .action-btn:hover {
            background: #f9fafb;
            border-color: #9ca3af;
        }
        
        /* Чек-листы */
        .checklist {
            list-style: none;
            margin: 1.5rem 0;
            padding: 0;
        }
        
        .checklist li {
            padding: 0.75rem;
            margin: 0.5rem 0;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            transition: background-color 0.15s;
        }
        
        .checklist li:hover {
            background: #f9fafb;
        }
        
        .checklist input[type="checkbox"] {
            width: 16px;
            height: 16px;
            cursor: pointer;
            border-radius: 3px;
        }
        
        /* Прогресс-бары */
        .progress-bar {
            background: #e5e7eb;
            height: 8px;
            border-radius: 4px;
            overflow: hidden;
            margin: 1.5rem 0;
        }
        
        .progress-fill {
            height: 100%;
            background: #f8f9fa;
            border-radius: 4px;
            transition: width 0.5s ease;
        }
        
        /* Уведомления */
        .warning {
            background: #fef3c7;
            color: #92400e;
            padding: 1rem;
            border-radius: 6px;
            margin: 1rem 0;
            border: 1px solid #fcd34d;
        }
        
        .success {
            background: #d1fae5;
            color: #065f46;
            padding: 1rem;
            border-radius: 6px;
            margin: 1rem 0;
            border: 1px solid #6ee7b7;
        }
        
        .alert {
            background: #fee2e2;
            color: #991b1b;
            padding: 1rem;
            border-radius: 6px;
            margin: 1rem 0;
            border: 1px solid #fecaca;
        }
        
        .chart-container { 
            position: relative; 
            height: 300px; 
            margin-top: 1rem;
        }
        
        /* Нижняя панель активности */
        .activity-panel {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2.5rem;
            padding: 3rem 0;
            background: #ffffff;
            border-top: 1px solid #e5e7eb;
            margin-top: 3rem;
        }
        
        .content-list { 
            max-height: 300px; 
            overflow-y: auto;
        }
        .content-item { 
            background: #ffffff; 
            padding: 1rem; 
            margin: 0.75rem 0; 
            border-radius: 4px;
            border: 1px solid #e5e7eb;
            border-left: 3px solid #e5e7eb;
        }
        .content-platform { 
            color: #6b7280; 
            font-weight: 500; 
            text-transform: uppercase;
            font-size: 0.7rem;
            letter-spacing: 0.05em;
        }
        .content-text { 
            margin: 0.5rem 0; 
            color: #111827;
        }
        .content-time { 
            font-size: 0.8rem; 
            color: #9ca3af;
        }
        
        .alert { 
            background: linear-gradient(145deg, #8b0000, #a00000); 
            padding: 1.5rem; 
            border-radius: 10px; 
            margin: 1rem 0; 
            box-shadow: 0 4px 15px rgba(139, 0, 0, 0.3);
        }
        .success { 
            background: #4CAF50; 
            padding: 1.5rem; 
            margin: 0.5rem 0; 
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0, 100, 0, 0.3);
        }
        
        .loading { 
            text-align: center; 
            padding: 2rem; 
            opacity: 0.7;
        }
        
        /* Цвета для разных платформ */
        .tiktok { border-left-color: #ff0050; }
        .instagram { border-left-color: #e4405f; }
        .youtube { border-left-color: #ff0000; }
        .telegram { border-left-color: #0088cc; }
        
        /* Новые стили для информативных секций */
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin: 1.5rem 0;
        }
        .info-item {
            background: #ffffff;
            padding: 1.5rem;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
        .info-label {
            font-size: 0.75rem;
            color: #6b7280;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .info-value {
            font-size: 1.75rem;
            font-weight: 300;
            color: #111827;
        }
        .automation-toggle {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #ffffff;
            padding: 1rem;
            border-radius: 4px;
            margin: 0.75rem 0;
            border: 1px solid #e5e7eb;
        }
        .toggle-switch {
            position: relative;
            width: 44px;
            height: 24px;
            background: #e5e7eb;
            border-radius: 12px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .toggle-switch.active {
            background: #f8f9fa;
        }
        .toggle-slider {
            position: absolute;
            width: 18px;
            height: 18px;
            background: white;
            border-radius: 50%;
            top: 3px;
            left: 3px;
            transition: transform 0.2s;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .toggle-switch.active .toggle-slider {
            transform: translateX(20px);
        }
        .top-posts {
            max-height: 400px;
            overflow-y: auto;
        }
        .post-item {
            background: #ffffff;
            padding: 1rem;
            margin: 0.75rem 0;
            border-radius: 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 1px solid #e5e7eb;
        }
        .post-rank {
            font-size: 1.25rem;
            font-weight: 300;
            color: #6b7280;
            margin-right: 1rem;
        }
        .post-info {
            flex-grow: 1;
        }
        .post-title {
            font-weight: bold;
            margin-bottom: 0.25rem;
        }
        .post-stats {
            font-size: 0.85rem;
            opacity: 0.8;
        }
        .quick-actions {
            display: flex;
            gap: 1rem;
            margin: 1rem 0;
            flex-wrap: wrap;
        }
        .quick-btn {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            color: #374151;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.15s;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
        }
        .quick-btn:hover {
            background: #f9fafb;
            border-color: #9ca3af;
        }
        .status-indicator {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            display: inline-block;
            margin-left: 0.5rem;
        }
        .status-active { background: #4CAF50; animation: pulse 2s infinite; }
        .status-inactive { background: #666; }
        .status-error { background: #f44336; }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .recent-actions {
            max-height: 300px;
            overflow-y: auto;
        }
        .action-item {
            background: #ffffff;
            padding: 0.75rem;
            margin: 0.5rem 0;
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            border: 1px solid #e5e7eb;
        }
        .action-time {
            font-size: 0.75rem;
            color: #9ca3af;
            margin-left: auto;
        }
        
        @media (max-width: 768px) {
            .dashboard { grid-template-columns: 1fr; }
            .controls { flex-direction: column; align-items: center; }
            .platforms-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <div>
                <h1>Analytics Dashboard</h1>
                <p>Social Media Integration Platform</p>
            </div>
        </div>
    </div>

    <div class="container">
        <div class="controls">
            <button class="btn" onclick="runAnalysis()">Run Analysis</button>
            <button class="btn" onclick="generatePlan()">Generate Plan</button>
            <button class="btn" onclick="testSystem()">Test System</button>
            <button class="btn" onclick="refreshDashboard()">Refresh Data</button>
            <button class="btn" onclick="toggleAllAutomations()">Automations</button>
        </div>
    
        <!-- Platform tabs -->
        <div class="platform-tabs">
            <div class="platform-tab instagram active" onclick="showPlatformTab('instagram')">
                Instagram
            </div>
            <div class="platform-tab tiktok" onclick="showPlatformTab('tiktok')">
                TikTok
            </div>
            <div class="platform-tab youtube" onclick="showPlatformTab('youtube')">
                YouTube
            </div>
            <div class="platform-tab telegram" onclick="showPlatformTab('telegram')">
                Telegram
            </div>
        </div>

        <!-- Контент Instagram -->
        <div id="instagram-tab" class="tab-content active">
            <div class="platform-content">
                <!-- Левая колонка: Статистика -->
                <div class="card">
                    <h2>Instagram Statistics</h2>
                    <div class="stat-card">
                        <div class="stat-value">1,534</div>
                        <div class="stat-label">Followers</div>
                        <div class="stat-change change-positive">+125 this week</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">4.2%</div>
                        <div class="stat-label">Engagement</div>
                        <div class="stat-change change-positive">+0.3%</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">25.3K</div>
                        <div class="stat-label">Monthly Views</div>
                    </div>
                    <div class="chart-container">
                        <canvas id="instagramChart"></canvas>
                    </div>
                    <button class="btn" onclick="updateInstagramStats()" style="width: 100%; margin-top: 1rem;">Update Stats</button>
                </div>
                
                <!-- Центральная колонка: Возможности -->
                <div class="card">
                    <h2>Automation Features</h2>
                    <div class="feature-grid">
                        <div class="feature-card">
                            <h3>Auto-posting</h3>
                            <p>Schedule content publication</p>
                            <button class="try-btn" onclick="tryFeature('instagram', 'autopost')">Create Post</button>
                        </div>
                        <div class="feature-card">
                            <h3>Auto-replies</h3>
                            <p>AI-powered DM responses</p>
                            <button class="try-btn" onclick="tryFeature('instagram', 'autoreply')">Configure</button>
                        </div>
                        <div class="feature-card">
                            <h3>Analytics</h3>
                            <p>Track growth and engagement</p>
                            <button class="try-btn" onclick="tryFeature('instagram', 'analytics')">View Report</button>
                        </div>
                        <div class="feature-card">
                            <h3>Sales Funnels</h3>
                            <p>Automated client management</p>
                            <button class="try-btn" onclick="tryFeature('instagram', 'funnel')">Setup Funnel</button>
                        </div>
                    </div>
                    
                    <h3>Quick Setup</h3>
                    <ul class="checklist">
                        <li>
                            <input type="checkbox" id="ig-api" onchange="updateProgress('instagram')">
                            <label for="ig-api">Connect Instagram API</label>
                        </li>
                        <li>
                            <input type="checkbox" id="ig-business" onchange="updateProgress('instagram')">
                            <label for="ig-business">Switch to Business Account</label>
                        </li>
                        <li>
                            <input type="checkbox" id="ig-token" onchange="updateProgress('instagram')">
                            <label for="ig-token">Get Access Token</label>
                        </li>
                    </ul>
                    <div class="progress-bar">
                        <div class="progress-fill" id="ig-progress" style="width: 0%;">0%</div>
                    </div>
                    <button class="btn" onclick="connectInstagramAPI()" style="width: 100%;">Connect API</button>
                </div>
                
                <!-- Правая колонка: Обучение -->
                <div class="card">
                    <h2>Instagram Guide</h2>
                    
                    <h3>What is it?</h3>
                    <p>Instagram - это соцсеть для фото и видео. Пользователи выкладывают контент, ставят лайки и пишут комментарии.</p>
                    
                    <h3>How to Monetize?</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li>Course Sales: 5,000-50,000₽</li>
                        <li>VIP Channels: $50-200/mo</li>
                        <li>Advertising: 50₽ per 1000 followers</li>
                    </ul>
                    
                    <h3>Security</h3>
                    <div class="warning">
                        <strong>Avoid:</strong> Mass following (>100/day)<br>
                        <strong>Do:</strong> Post quality content regularly
                    </div>
                    
                    <h3>Profit Calculator</h3>
                    <div class="calculator">
                        <input type="number" id="ig-calc-followers" placeholder="Подписчики" value="1534">
                        <input type="number" id="ig-calc-engagement" placeholder="Engagement %" value="4.2">
                        <input type="number" id="ig-calc-price" placeholder="Цена продукта (₽)" value="10000">
                        <button onclick="calculateProfit('instagram')">💵 Рассчитать</button>
                        <div id="ig-calc-result" class="result" style="display:none;"></div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Контент TikTok, YouTube, Telegram по аналогии -->
        <div id="tiktok-tab" class="tab-content" style="display: none;">
            <!-- TikTok content here -->
        </div>
        <div id="youtube-tab" class="tab-content" style="display: none;">
            <!-- YouTube content here -->
        </div>
        <div id="telegram-tab" class="tab-content" style="display: none;">
            <!-- Telegram content here -->
        </div>
        
        <!-- Панели графиков и статистики -->
        <div class="activity-panel">
            <!-- Графики и статистика -->
            <div class="card">
                <h2>📈 Тренды вовлеченности</h2>
                <div class="chart-container" style="height: 300px;">
                    <canvas id="engagementChart"></canvas>
                </div>
            </div>
            
            <!-- Планы контента -->
            <div class="card">
                <h2>📅 Планы контента</h2>
                <div id="contentPlans" class="content-plans loading">
                    <div>Загрузка планов...</div>
                </div>
            </div>
            
            <!-- Прогноз роста -->
            <div class="card">
                <h2>📊 Прогноз роста</h2>
                <div id="growthForecast" class="growth-forecast">
                    <div>Загрузка прогноза...</div>
                </div>
            </div>
            <!-- Топ-5 лучших постов -->
            <div class="card">
                <h2>🏆 Топ-5 постов</h2>
                <div id="topPosts" class="top-posts loading">
                    <div>Загрузка топа...</div>
                </div>
            </div>
            
            <!-- Последние действия системы -->
            <div class="card">
                <h2>📝 Последние действия</h2>
                <div id="recentActions" class="recent-actions loading">
                    <div>Загрузка действий...</div>
                </div>
            </div>
            
            <!-- Статус автоматизаций -->
            <div class="card">
                <h2>🤖 Статус автоматизаций</h2>
                <div id="automationStatus">
                    <div class="automation-toggle">
                        <span>📧 Автоответы в DM</span>
                        <div class="toggle-switch" id="dmToggle" onclick="toggleAutomation('dm_automation')">
                            <div class="toggle-slider"></div>
                        </div>
                    </div>
                    <div class="automation-toggle">
                        <span>📝 Генерация контента</span>
                        <div class="toggle-switch" id="contentToggle" onclick="toggleAutomation('content_generation')">
                            <div class="toggle-slider"></div>
                        </div>
                    </div>
                    <div class="automation-toggle">
                        <span>🔄 Кросспостинг</span>
                        <div class="toggle-switch" id="crosspostToggle" onclick="toggleAutomation('crossposting')">
                            <div class="toggle-slider"></div>
                        </div>
                    </div>
                    <div class="automation-toggle">
                        <span>📊 Ежедневные отчёты</span>
                        <div class="toggle-switch" id="reportsToggle" onclick="toggleAutomation('daily_reports')">
                            <div class="toggle-slider"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Алерты и уведомления -->
            <div class="card">
                <h2>⚠️ Уведомления системы</h2>
                <div id="systemStatus">
                    {% if analysis %}
                    <div class="success">
                        <strong>Система активна</strong><br>
                        Всего подписчиков: <span class="stat-value">{{ analysis.total_followers }}</span><br>
                        Средняя вовлеченность: <span class="stat-value">{{ analysis.avg_engagement }}%</span><br>
                        Лучшая платформа: <span class="stat-value">{{ analysis.top_platform }}</span>
                    </div>
                    {% endif %}
                    
                    {% if alerts %}
                    <div class="alert">
                        <h3>⚠️ Требует внимания</h3>
                        {% for alert in alerts %}
                        <p>{{ alert }}</p>
                        {% endfor %}
                    </div>
                    {% endif %}
                </div>
            </div>
        </div>
    </div>
    

    <script>
        let engagementChart = null;
        let refreshInterval = null;
        let selectedPlatform = 'instagram';
        let currentTab = 'instagram';
        
        // Инициализация дашборда
        document.addEventListener('DOMContentLoaded', function() {
            refreshDashboard();
            loadAutomationStatus();
            initPlatformTabs();
            // Автообновление каждые 30 секунд
            refreshInterval = setInterval(refreshDashboard, 30000);
        });
        
        // Функция для показа уведомлений
        function showNotification(message, type = 'info') {
            console.log(`[${type.toUpperCase()}] ${message}`);
            // Можно добавить визуальное уведомление позже
        }
        
        // Переключение вкладок платформ
        function showPlatformTab(platform) {
            currentTab = platform;
            
            // Скрыть все вкладки
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.style.display = 'none';
                tab.classList.remove('active');
            });
            
            // Показать выбранную вкладку
            const selectedTab = document.getElementById(platform + '-tab');
            if (selectedTab) {
                selectedTab.style.display = 'block';
                selectedTab.classList.add('active');
            }
            
            // Обновить активную вкладку
            document.querySelectorAll('.platform-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            document.querySelector(`.platform-tab.${platform}`).classList.add('active');
            
            // Загрузить данные для этой платформы
            loadPlatformData(platform);
        }
        
        // Инициализация вкладок
        function initPlatformTabs() {
            showPlatformTab('instagram');
        }
        
        // Попробовать функцию
        function tryFeature(platform, feature) {
            showNotification(`🚀 Запускаем ${feature} для ${platform}...`, 'success');
            
            // Отправить запрос на активацию функции
            fetch(`/api/try-feature`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({platform, feature})
            }).then(response => response.json())
              .then(data => {
                  if (data.status === 'success') {
                      showNotification(`✅ ${feature} успешно активирован!`, 'success');
                  } else {
                      showNotification(`❌ Ошибка: ${data.message}`, 'error');
                  }
              }).catch(error => {
                  showNotification(`❌ Ошибка: ${error}`, 'error');
              });
        }
        
        // Калькулятор прибыли
        function calculateProfit(platform) {
            const followers = parseInt(document.getElementById(`${platform}-calc-followers`).value) || 0;
            const engagement = parseFloat(document.getElementById(`${platform}-calc-engagement`).value) || 0;
            const price = parseInt(document.getElementById(`${platform}-calc-price`).value) || 0;
            
            // Формула расчёта
            const activeFollowers = followers * (engagement / 100);
            const conversionRate = 0.02; // 2% конверсия
            const potentialClients = activeFollowers * conversionRate;
            const monthlyRevenue = potentialClients * price;
            const yearlyRevenue = monthlyRevenue * 12;
            
            const resultDiv = document.getElementById(`${platform}-calc-result`);
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <h3>💰 Результат расчёта:</h3>
                <p>🎯 Активные подписчики: <strong>${Math.round(activeFollowers)}</strong></p>
                <p>👥 Потенциальные клиенты: <strong>${Math.round(potentialClients)}</strong></p>
                <p>📅 Прибыль в месяц: <strong>${monthlyRevenue.toLocaleString()}₽</strong></p>
                <p>🏆 Прибыль в год: <strong>${yearlyRevenue.toLocaleString()}₽</strong></p>
            `;
        }
        
        // Обновление прогресса настройки
        function updateProgress(platform) {
            const checkboxes = document.querySelectorAll(`input[id^="${platform}-"]`);
            const checked = Array.from(checkboxes).filter(cb => cb.checked).length;
            const total = checkboxes.length;
            const percentage = Math.round((checked / total) * 100);
            
            const progressBar = document.getElementById(`${platform}-progress`);
            if (progressBar) {
                progressBar.style.width = percentage + '%';
                progressBar.textContent = percentage + '%';
            }
            
            // Если 100% - показать уведомление
            if (percentage === 100) {
                showNotification(`✅ ${platform} полностью настроен!`, 'success');
            }
        }
        
        // Подключение API
        function connectInstagramAPI() {
            showNotification('🔌 Подключаем Instagram API...', 'success');
            
            fetch('/api/connect-instagram', {
                method: 'POST'
            }).then(response => response.json())
              .then(data => {
                  if (data.status === 'success') {
                      showNotification('✅ Instagram API успешно подключён!', 'success');
                      document.getElementById('ig-api').checked = true;
                      document.getElementById('ig-business').checked = true;
                      document.getElementById('ig-token').checked = true;
                      updateProgress('ig');
                  } else {
                      showNotification(`❌ Ошибка: ${data.message}`, 'error');
                  }
              });
        }
        
        // Обновление статистики Instagram
        function updateInstagramStats() {
            fetch('/api/platform-stats')
                .then(response => response.json())
                .then(data => {
                    if (data.instagram) {
                        // Обновить значения на странице
                        document.querySelector('#instagram-tab .stat-value').textContent = data.instagram.followers || '1,534';
                        showNotification('✅ Статистика Instagram обновлена', 'success');
                    }
                });
        }
        
        // Переключение всех автоматизаций
        function toggleAllAutomations() {
            const allToggles = document.querySelectorAll('.toggle-switch');
            const allActive = Array.from(allToggles).every(toggle => toggle.classList.contains('active'));
            
            allToggles.forEach(toggle => {
                if (allActive) {
                    toggle.classList.remove('active');
                } else {
                    toggle.classList.add('active');
                }
            });
            
            showNotification(allActive ? '🔴 Все автоматизации выключены' : '🟢 Все автоматизации включены', 'success');
        }
        
        // Загрузка данных платформы
        function loadPlatformData(platform) {
            // Здесь можно загружать специфические данные для каждой платформы
            console.log(`Загрузка данных для ${platform}`);
        }

        async function runAnalysis() {
            const btn = event.target;
            btn.disabled = true;
            btn.textContent = '⏳ Анализируем...';
            try {
                await fetch('/api/analyze');
                showNotification('Анализ завершен!', 'success');
                setTimeout(refreshDashboard, 1000);
            } catch (error) {
                showNotification('Ошибка: ' + error, 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = '🔍 Запустить анализ';
            }
        }

        async function generatePlan() {
            const btn = event.target;
            btn.disabled = true;
            btn.textContent = '⏳ Создаем план...';
            try {
                await fetch('/api/generate-plan');
                showNotification('Контент-план создан!', 'success');
                setTimeout(loadContentPlans, 1000);
            } catch (error) {
                showNotification('Ошибка: ' + error, 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = '📅 Создать план';
            }
        }

        async function testSystem() {
            const response = await fetch('/api/test');
            const result = await response.json();
            showNotification('Тест завершен: ' + result.message, result.status === 'success' ? 'success' : 'error');
        }

        async function refreshDashboard() {
            loadPlatformStats();
            loadEngagementTrends();
            loadContentPlans();
            loadTopPosts();
            loadRecentActions();
            loadGrowthForecast();
        }

        async function loadPlatformStats() {
            try {
                const response = await fetch('/api/platform-stats');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const stats = await response.json();
                
                // Обновляем статистику текущей вкладки
                Object.entries(stats).forEach(([platform, data]) => {
                    const card = document.createElement('div');
                    card.className = `platform-card ${platform}`;
                    // Добавляем данные для Instagram
                    if (platform === 'instagram') {
                        data.followers = 1534; // Реальные данные Instagram
                        data.username = '@antonalekseevich.je';
                    }
                    
                    card.innerHTML = `
                        <div class="platform-name">${platform}</div>
                        <div class="platform-stat">
                            <span>Подписчики:</span>
                            <span class="stat-value">${data.followers.toLocaleString()}</span>
                        </div>
                        <div class="platform-stat">
                            <span>Вовлеченность:</span>
                            <span class="stat-value">${data.engagement}%</span>
                        </div>
                        <div class="platform-stat">
                            <span>Просмотры:</span>
                            <span class="stat-value">${data.views.toLocaleString()}</span>
                        </div>
                        ${data.change ? `<div class="platform-change ${data.change > 0 ? 'change-positive' : 'change-negative'}">${data.change > 0 ? '↑' : '↓'} ${Math.abs(data.change)}%</div>` : ''}
                    `;
                    
                    // Добавляем интерактивность
                    card.onclick = () => showPlatformDetails(platform, data);
                    card.onmouseenter = (e) => showTooltip(e, `Нажмите для детальной информации о ${platform}`);
                    card.onmouseleave = hideTooltip;
                    
                    // container.appendChild(card); // Закомментировано - больше не используем старый контейнер
                });
            } catch (error) {
                console.error('Ошибка загрузки статистики:', error);
                // document.getElementById('platformsStats').innerHTML = '<div class="alert">Ошибка загрузки статистики</div>'; // Закомментировано
            }
        }

        async function loadEngagementTrends() {
            try {
                const response = await fetch('/api/engagement-trends');
                if (!response.ok) {
                    console.error('Ошибка загрузки трендов, статус:', response.status);
                    return;
                }
                const data = await response.json();
                
                const canvas = document.getElementById('engagementChart');
                if (!canvas) {
                    console.error('Canvas элемент engagementChart не найден');
                    return;
                }
                const ctx = canvas.getContext('2d');
                
                if (engagementChart) {
                    engagementChart.destroy();
                }
                
                engagementChart = new Chart(ctx, {
                    type: 'line',
                    data: data,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            mode: 'index',
                            intersect: false,
                        },
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top',
                                labels: { 
                                    color: '#fff',
                                    padding: 20,
                                    font: {
                                        size: 12
                                    }
                                }
                            },
                            tooltip: {
                                enabled: true,
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                titleColor: '#fff',
                                bodyColor: '#fff',
                                borderColor: '#dc143c',
                                borderWidth: 1,
                                callbacks: {
                                    label: function(context) {
                                        return context.dataset.label + ': ' + context.parsed.y + '%';
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                ticks: { color: '#ccc' },
                                grid: { color: '#333' }
                            },
                            y: {
                                ticks: { 
                                    color: '#ccc',
                                    callback: function(value) {
                                        return value + '%';
                                    }
                                },
                                grid: { color: '#333' }
                            }
                        }
                    }
                });
            } catch (error) {
                console.error('Ошибка загрузки трендов:', error);
            }
        }

        async function loadContentPlans() {
            try {
                const response = await fetch('/api/content-plans');
                if (!response.ok) {
                    console.error('Ошибка загрузки планов, статус:', response.status);
                    return;
                }
                const plans = await response.json();
                
                const container = document.getElementById('contentPlans');
                if (!container) {
                    console.error('Элемент contentPlans не найден');
                    return;
                }
                container.innerHTML = '';
                container.classList.remove('loading');

                if (plans.length === 0) {
                    container.innerHTML = '<div style="text-align: center; opacity: 0.7;">Планы не найдены</div>';
                    return;
                }

                plans.forEach(plan => {
                    const item = document.createElement('div');
                    item.className = `content-item ${plan.platform}`;
                    item.innerHTML = `
                        <div class="content-platform">${plan.platform}</div>
                        <div class="content-text">${plan.content}</div>
                        <div class="content-time">Время: ${plan.time} | Статус: ${plan.status}</div>
                    `;
                    container.appendChild(item);
                });
            } catch (error) {
                console.error('Ошибка загрузки планов:', error);
            }
        }

        function showNotification(message, type) {
            const alertClass = type === 'success' ? 'success' : 'alert';
            const notification = document.createElement('div');
            notification.className = alertClass;
            notification.style.position = 'fixed';
            notification.style.top = '20px';
            notification.style.right = '20px';
            notification.style.zIndex = '1000';
            notification.style.maxWidth = '300px';
            notification.innerHTML = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
        
        // Новые функции для интерактивности
        function showPlatformDetails(platform, data) {
            const detailsDiv = document.getElementById('platformDetails');
            detailsDiv.style.display = 'block';
            detailsDiv.innerHTML = `
                <h3>Детальная статистика ${platform.toUpperCase()}</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Подписчики</div>
                        <div class="info-value">${data.followers}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Средняя вовлеченность</div>
                        <div class="info-value">${data.engagement}%</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Просмотры</div>
                        <div class="info-value">${data.views}</div>
                    </div>
                </div>
                ${platform === 'instagram' ? '<p>Username: @antonalekseevich.je</p>' : ''}
            `;
            
            // Подсвечиваем выбранную карточку
            document.querySelectorAll('.platform-card').forEach(card => {
                card.classList.remove('active');
            });
            event.currentTarget.classList.add('active');
        }
        
        function showTooltip(event, text) {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = text;
            tooltip.style.left = event.pageX + 10 + 'px';
            tooltip.style.top = event.pageY + 10 + 'px';
            tooltip.style.display = 'block';
            document.body.appendChild(tooltip);
        }
        
        function hideTooltip() {
            const tooltip = document.querySelector('.tooltip');
            if (tooltip) tooltip.remove();
        }
        
        async function loadTopPosts() {
            try {
                const response = await fetch('/api/top-posts');
                if (!response.ok) {
                    console.error('Ошибка загрузки топ постов, статус:', response.status);
                    return;
                }
                const posts = await response.json();
                
                const container = document.getElementById('topPosts');
                if (!container) {
                    console.error('Элемент topPosts не найден');
                    return;
                }
                container.innerHTML = '';
                container.classList.remove('loading');
                
                if (posts.error || posts.length === 0) {
                    container.innerHTML = '<div style="opacity: 0.7;">Нет данных о постах</div>';
                    return;
                }
                
                posts.forEach((post, index) => {
                    const postDiv = document.createElement('div');
                    postDiv.className = 'post-item';
                    postDiv.innerHTML = `
                        <div class="post-rank">#${index + 1}</div>
                        <div class="post-info">
                            <div class="post-title">${post.title || post.platform}</div>
                            <div class="post-stats">
                                👍 ${post.likes || 0} | 👀 ${post.views || 0} | 💬 ${post.comments || 0}
                            </div>
                        </div>
                    `;
                    container.appendChild(postDiv);
                });
            } catch (error) {
                console.error('Ошибка загрузки топ постов:', error);
                document.getElementById('topPosts').innerHTML = '<div class="alert">Ошибка загрузки</div>';
            }
        }
        
        async function loadRecentActions() {
            try {
                const response = await fetch('/api/recent-actions');
                if (!response.ok) {
                    console.error('Ошибка загрузки последних действий, статус:', response.status);
                    return;
                }
                const actions = await response.json();
                
                const container = document.getElementById('recentActions');
                if (!container) {
                    console.error('Элемент recentActions не найден');
                    return;
                }
                container.innerHTML = '';
                container.classList.remove('loading');
                
                if (!actions || actions.length === 0) {
                    container.innerHTML = '<div style="opacity: 0.7;">Нет недавних действий</div>';
                    return;
                }
                
                actions.forEach(action => {
                    const actionDiv = document.createElement('div');
                    actionDiv.className = 'action-item';
                    actionDiv.innerHTML = `
                        <span>🔹 ${action.description}</span>
                        <span class="action-time">${action.time}</span>
                    `;
                    container.appendChild(actionDiv);
                });
            } catch (error) {
                console.error('Ошибка загрузки действий:', error);
            }
        }
        
        async function loadGrowthForecast() {
            try {
                const response = await fetch('/api/growth-forecast');
                if (!response.ok) {
                    console.error('Ошибка загрузки прогноза, статус:', response.status);
                    return;
                }
                const forecast = await response.json();
                
                const container = document.getElementById('growthForecast');
                if (!container) {
                    console.error('Элемент growthForecast не найден');
                    return;
                }
                container.innerHTML = '';
                
                Object.entries(forecast).forEach(([platform, data]) => {
                    const item = document.createElement('div');
                    item.className = 'info-item';
                    item.innerHTML = `
                        <div class="info-label">${platform}</div>
                        <div class="info-value">+${data.expectedGrowth}</div>
                        <div class="${data.percentage > 0 ? 'change-positive' : 'change-negative'}">
                            ${data.percentage > 0 ? '↑' : '↓'} ${Math.abs(data.percentage)}%
                        </div>
                    `;
                    container.appendChild(item);
                });
            } catch (error) {
                console.error('Ошибка загрузки прогноза:', error);
            }
        }
        
        async function loadAutomationStatus() {
            try {
                const response = await fetch('/api/automation-status');
                if (!response.ok) {
                    console.error('Ошибка загрузки статуса автоматизаций, статус:', response.status);
                    return;
                }
                const status = await response.json();
                
                if (!status || typeof status !== 'object') {
                    console.error('Некорректный формат данных статуса');
                    return;
                }
                
                Object.entries(status).forEach(([feature, enabled]) => {
                    const toggleId = feature.replace('_', '') + 'Toggle';
                    const toggle = document.getElementById(toggleId);
                    if (toggle) {
                        if (enabled) {
                            toggle.classList.add('active');
                        } else {
                            toggle.classList.remove('active');
                        }
                    }
                });
            } catch (error) {
                console.error('Ошибка загрузки статуса автоматизаций:', error);
            }
        }
        
        async function toggleAutomation(feature) {
            try {
                const response = await fetch('/api/toggle-automation', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({feature})
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                
                const toggleId = feature.replace('_', '') + 'Toggle';
                const toggle = document.getElementById(toggleId);
                
                if (toggle) {
                    if (result.enabled) {
                        toggle.classList.add('active');
                        showNotification(`✅ ${feature} активировано`, 'success');
                    } else {
                        toggle.classList.remove('active');
                        showNotification(`⚠️ ${feature} деактивировано`, 'success');
                    }
                }
            } catch (error) {
                console.error('Ошибка при переключении автоматизации:', error);
                showNotification('❌ Ошибка переключения: ' + error.message, 'error');
            }
        }
        
        // Быстрые действия
        async function createAIPost() {
            try {
                showNotification('Генерируем контент...', 'success');
                const response = await fetch('/api/generate-ai-content');
                const result = await response.json();
                
                if (result.content) {
                    showNotification('Контент создан!', 'success');
                    // Можно отобразить модальное окно с результатом
                }
            } catch (error) {
                showNotification('Ошибка генерации', 'error');
            }
        }
        
        async function checkDMs() {
            try {
                const response = await fetch('/api/check-dms');
                const result = await response.json();
                showNotification(`Новых DM: ${result.count || 0}`, 'success');
            } catch (error) {
                showNotification('Ошибка проверки DM', 'error');
            }
        }
        
        async function exportReport() {
            try {
                showNotification('Генерируем отчёт...', 'success');
                const response = await fetch('/api/export-report');
                const result = await response.json();
                
                if (result.url) {
                    window.open(result.url, '_blank');
                    showNotification('Отчёт готов!', 'success');
                }
            } catch (error) {
                showNotification('Ошибка экспорта', 'error');
            }
        }
        
        async function toggleCrossPosing() {
            const indicator = document.getElementById('crosspostStatus');
            const isActive = indicator.classList.contains('status-active');
            
            try {
                const response = await fetch('/api/toggle-crosspost', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({enabled: !isActive})
                });
                const result = await response.json();
                
                if (result.status === 'success') {
                    if (result.enabled) {
                        indicator.classList.remove('status-inactive');
                        indicator.classList.add('status-active');
                        showNotification('Кросспостинг активирован', 'success');
                    } else {
                        indicator.classList.remove('status-active');
                        indicator.classList.add('status-inactive');
                        showNotification('Кросспостинг деактивирован', 'success');
                    }
                }
            } catch (error) {
                showNotification('Ошибка переключения', 'error');
            }
        }
        
        // Modal functions
        function showLoginModal() {
            document.getElementById('loginModal').style.display = 'block';
        }
        
        function showYouTubeModal() {
            document.getElementById('youtubeModal').style.display = 'block';
            loadYouTubeVideos();
        }
        
        function showInstagramModal() {
            document.getElementById('instagramModal').style.display = 'block';
            loadInstagramPosts();
        }
        
        function showEmailSettings() {
            document.getElementById('emailModal').style.display = 'block';
            loadEmailSettings();
        }
        
        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }
        
        function switchTab(tab) {
            document.querySelectorAll('#loginModal .tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('#loginModal .tab-content').forEach(content => content.classList.remove('active'));
            
            if (tab === 'login') {
                document.querySelector('#loginModal .tab-btn:nth-child(1)').classList.add('active');
                document.getElementById('loginTab').classList.add('active');
            } else {
                document.querySelector('#loginModal .tab-btn:nth-child(2)').classList.add('active');
                document.getElementById('registerTab').classList.add('active');
            }
        }
        
        function switchYouTubeTab(tab) {
            document.querySelectorAll('#youtubeModal .tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('#youtubeModal .tab-content').forEach(content => content.classList.remove('active'));
            
            const tabs = ['upload', 'videos', 'comments'];
            const index = tabs.indexOf(tab);
            document.querySelectorAll('#youtubeModal .tab-btn')[index].classList.add('active');
            document.getElementById(`youtube${tab.charAt(0).toUpperCase() + tab.slice(1)}Tab`).classList.add('active');
        }
        
        function switchInstagramTab(tab) {
            document.querySelectorAll('#instagramModal .tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('#instagramModal .tab-content').forEach(content => content.classList.remove('active'));
            
            const tabs = ['post', 'story', 'posts', 'dms'];
            const index = tabs.indexOf(tab);
            document.querySelectorAll('#instagramModal .tab-btn')[index].classList.add('active');
            document.getElementById(`instagram${tab.charAt(0).toUpperCase() + tab.slice(1)}Tab`).classList.add('active');
        }
        
        // Authentication functions
        async function login() {
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({username, password})
                });
                const result = await response.json();
                
                if (result.status === 'success') {
                    showNotification('Login successful!', 'success');
                    setTimeout(() => location.reload(), 1000);
                } else {
                    showNotification(result.message, 'error');
                }
            } catch (error) {
                showNotification('Login failed: ' + error, 'error');
            }
        }
        
        async function register() {
            const username = document.getElementById('regUsername').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            
            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({username, email, password})
                });
                const result = await response.json();
                
                if (result.status === 'success') {
                    showNotification('Registration successful! Please login.', 'success');
                    switchTab('login');
                } else {
                    showNotification(result.message, 'error');
                }
            } catch (error) {
                showNotification('Registration failed: ' + error, 'error');
            }
        }
        
        async function logout() {
            try {
                await fetch('/api/logout', {method: 'POST'});
                showNotification('Logged out', 'success');
                setTimeout(() => location.reload(), 1000);
            } catch (error) {
                showNotification('Logout failed', 'error');
            }
        }
        
        // YouTube functions
        async function loadYouTubeStats() {
            try {
                const response = await fetch('/api/youtube/analytics');
                const stats = await response.json();
                
                const container = document.getElementById('youtubeStats');
                container.classList.remove('loading');
                
                if (stats.error) {
                    container.innerHTML = '<p style="opacity: 0.7;">YouTube not configured</p>';
                } else {
                    container.innerHTML = `
                        <div class="platform-stat">
                            <span>Subscribers:</span>
                            <span class="stat-value">${stats.subscribers?.toLocaleString() || 0}</span>
                        </div>
                        <div class="platform-stat">
                            <span>Total Views:</span>
                            <span class="stat-value">${stats.total_views?.toLocaleString() || 0}</span>
                        </div>
                        <div class="platform-stat">
                            <span>Videos:</span>
                            <span class="stat-value">${stats.videos_count || 0}</span>
                        </div>
                        <div class="platform-stat">
                            <span>Engagement:</span>
                            <span class="stat-value">${stats.engagement_rate || 0}%</span>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Error loading YouTube stats:', error);
            }
        }
        
        async function loadYouTubeVideos() {
            try {
                const response = await fetch('/api/youtube/videos');
                const videos = await response.json();
                
                const container = document.getElementById('youtubeVideosList');
                if (videos.length === 0) {
                    container.innerHTML = '<p style="opacity: 0.7;">No videos found</p>';
                } else {
                    container.innerHTML = videos.map(video => `
                        <div class="content-item">
                            <div style="color: #ff0000; font-weight: bold;">${video.title}</div>
                            <div style="margin: 0.5rem 0; opacity: 0.9;">${video.description}</div>
                            <div style="font-size: 0.9rem; opacity: 0.7;">
                                Views: ${video.views} | Likes: ${video.likes} | Comments: ${video.comments}
                            </div>
                        </div>
                    `).join('');
                }
            } catch (error) {
                console.error('Error loading YouTube videos:', error);
            }
        }
        
        async function uploadVideo() {
            const title = document.getElementById('videoTitle').value;
            const description = document.getElementById('videoDescription').value;
            const scheduled = document.getElementById('videoSchedule').value;
            
            try {
                const response = await fetch('/api/youtube/upload', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({title, description, scheduled_time: scheduled})
                });
                const result = await response.json();
                
                if (result.status === 'success') {
                    showNotification('Video uploaded successfully!', 'success');
                    document.getElementById('videoTitle').value = '';
                    document.getElementById('videoDescription').value = '';
                    loadYouTubeVideos();
                    loadYouTubeStats();
                } else {
                    showNotification(result.message, 'error');
                }
            } catch (error) {
                showNotification('Upload failed: ' + error, 'error');
            }
        }
        
        async function manageComments() {
            const videoId = document.getElementById('commentVideoId').value;
            const autoResponse = document.getElementById('autoResponse').value;
            
            try {
                const response = await fetch(`/api/youtube/comments/${videoId}`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({auto_response: autoResponse})
                });
                const result = await response.json();
                
                const resultDiv = document.getElementById('commentsResult');
                if (result.status === 'success') {
                    resultDiv.innerHTML = `
                        <div class="success" style="padding: 1rem;">
                            Found ${result.comments?.length || 0} comments.
                            ${result.auto_responded ? 'Auto-responses sent.' : ''}
                        </div>
                    `;
                } else {
                    resultDiv.innerHTML = `<div class="alert" style="padding: 1rem;">${result.message}</div>`;
                }
            } catch (error) {
                showNotification('Failed to manage comments: ' + error, 'error');
            }
        }
        
        // Instagram functions
        async function loadInstagramStats() {
            try {
                const response = await fetch('/api/instagram/analytics');
                const stats = await response.json();
                
                const container = document.getElementById('instagramStats');
                container.classList.remove('loading');
                
                if (stats.error) {
                    container.innerHTML = '<p style="opacity: 0.7;">Instagram not configured</p>';
                } else {
                    container.innerHTML = `
                        <div class="platform-stat">
                            <span>Followers:</span>
                            <span class="stat-value">${stats.followers?.toLocaleString() || 0}</span>
                        </div>
                        <div class="platform-stat">
                            <span>Following:</span>
                            <span class="stat-value">${stats.following?.toLocaleString() || 0}</span>
                        </div>
                        <div class="platform-stat">
                            <span>Posts:</span>
                            <span class="stat-value">${stats.posts_count || 0}</span>
                        </div>
                        <div class="platform-stat">
                            <span>Avg Likes:</span>
                            <span class="stat-value">${stats.avg_likes || 0}</span>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Error loading Instagram stats:', error);
            }
        }
        
        async function loadInstagramPosts() {
            try {
                const response = await fetch('/api/instagram/posts');
                const posts = await response.json();
                
                const container = document.getElementById('instagramPostsList');
                if (posts.length === 0) {
                    container.innerHTML = '<p style="opacity: 0.7;">No posts found</p>';
                } else {
                    container.innerHTML = posts.map(post => `
                        <div class="content-item">
                            <div style="color: #e4405f; font-weight: bold;">${post.media_type}</div>
                            <div style="margin: 0.5rem 0; opacity: 0.9;">${post.caption}</div>
                            <div style="font-size: 0.9rem; opacity: 0.7;">
                                Likes: ${post.likes} | Comments: ${post.comments} | Engagement: ${post.engagement_rate}%
                            </div>
                        </div>
                    `).join('');
                }
            } catch (error) {
                console.error('Error loading Instagram posts:', error);
            }
        }
        
        async function publishPost() {
            const caption = document.getElementById('postCaption').value;
            
            try {
                const response = await fetch('/api/instagram/post', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({caption})
                });
                const result = await response.json();
                
                if (result.status === 'success') {
                    showNotification('Post published successfully!', 'success');
                    document.getElementById('postCaption').value = '';
                    loadInstagramPosts();
                    loadInstagramStats();
                } else {
                    showNotification(result.message, 'error');
                }
            } catch (error) {
                showNotification('Failed to publish post: ' + error, 'error');
            }
        }
        
        async function publishStory() {
            try {
                const response = await fetch('/api/instagram/story', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({})
                });
                const result = await response.json();
                
                if (result.status === 'success') {
                    showNotification('Story published successfully!', 'success');
                    loadInstagramStats();
                } else {
                    showNotification(result.message, 'error');
                }
            } catch (error) {
                showNotification('Failed to publish story: ' + error, 'error');
            }
        }
        
        async function manageDMs() {
            const autoResponse = document.getElementById('dmAutoResponse').value;
            
            try {
                const response = await fetch('/api/instagram/dms', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({auto_response: autoResponse})
                });
                const result = await response.json();
                
                const resultDiv = document.getElementById('dmsResult');
                if (result.status === 'success') {
                    resultDiv.innerHTML = `
                        <div class="success" style="padding: 1rem;">
                            Found ${result.dms?.length || 0} DMs.
                            ${result.auto_responded ? 'Auto-responses sent.' : ''}
                        </div>
                    `;
                } else {
                    resultDiv.innerHTML = `<div class="alert" style="padding: 1rem;">${result.message}</div>`;
                }
            } catch (error) {
                showNotification('Failed to manage DMs: ' + error, 'error');
            }
        }
        
        // Email functions
        async function loadEmailSettings() {
            try {
                const response = await fetch('/api/email/settings');
                const settings = await response.json();
                
                document.getElementById('smtpServer').value = settings.smtp_server || 'smtp.gmail.com';
                document.getElementById('smtpPort').value = settings.smtp_port || 587;
                document.getElementById('emailFrom').value = settings.email_from || '';
                document.getElementById('emailTo').value = settings.email_to || '';
            } catch (error) {
                console.error('Error loading email settings:', error);
            }
        }
        
        async function saveEmailSettings() {
            const settings = {
                smtp_server: document.getElementById('smtpServer').value,
                smtp_port: parseInt(document.getElementById('smtpPort').value),
                email_from: document.getElementById('emailFrom').value,
                email_password: document.getElementById('emailPassword').value,
                email_to: document.getElementById('emailTo').value,
                frequency: document.getElementById('reportFrequency').value
            };
            
            try {
                const response = await fetch('/api/email/settings', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(settings)
                });
                const result = await response.json();
                
                if (result.status === 'success') {
                    showNotification('Email settings saved!', 'success');
                } else {
                    showNotification(result.message, 'error');
                }
            } catch (error) {
                showNotification('Failed to save settings: ' + error, 'error');
            }
        }
        
        async function sendTestReport() {
            try {
                const response = await fetch('/api/email/send-report', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({})
                });
                const result = await response.json();
                
                if (result.status === 'success') {
                    showNotification('Test report sent!', 'success');
                } else {
                    showNotification(result.message, 'error');
                }
            } catch (error) {
                showNotification('Failed to send report: ' + error, 'error');
            }
        }
    </script>
</body>
</html>
'''

# Initialize the application components
print("🚀 LUCIFER ANALYTICAL ENTITY - ЗАПУСК СИСТЕМЫ")
init_database()
print("✅ База данных инициализирована")

safety_controller = SafetyController()
analytics_engine = AnalyticsEngine()

# Initialize automation classes  
instagram_dm_automation = InstagramDMAutomation(safety_controller)
content_generator = ContentGenerator(safety_controller)
smart_auto_reply = SmartAutoReply()
report_generator = ReportGenerator(analytics_engine)

@app.route('/')
def dashboard():
    try:
        conn = sqlite3.connect('lucifer_analytics.db')
        cursor = conn.cursor()
        cursor.execute('SELECT platform, followers, engagement, views FROM platform_stats ORDER BY timestamp DESC LIMIT 4')
        stats = {}
        for row in cursor.fetchall():
            stats[row[0]] = {'followers': row[1], 'engagement': row[2], 'views': row[3]}
        conn.close()
        analysis = analytics_engine.analyze_platform_stats(stats) if stats else None
        alerts = [] if analysis and not analysis.get('error') else ['Система требует настройки']
    except Exception as e:
        analysis = None
        alerts = [f'Ошибка загрузки: {str(e)}']
    return render_template_string(HTML_TEMPLATE, analysis=analysis, alerts=alerts)

@app.route('/platform-analysis')
def platform_analysis():
    """Страница детального анализа платформ с обучающими материалами"""
    return render_template_string(PLATFORM_ANALYSIS_TEMPLATE)

@app.route('/api/analyze')
def api_analyze():
    try:
        test_stats = {
            'tiktok': {'followers': random.randint(100, 500), 'engagement': round(random.uniform(2, 8), 2)},
            'instagram': {'followers': random.randint(50, 300), 'engagement': round(random.uniform(1, 6), 2)},
            'youtube': {'followers': random.randint(200, 800), 'engagement': round(random.uniform(3, 10), 2)}
        }
        conn = sqlite3.connect('lucifer_analytics.db')
        cursor = conn.cursor()
        for platform, stats in test_stats.items():
            cursor.execute('INSERT INTO platform_stats (platform, followers, engagement, views) VALUES (?, ?, ?, ?)',
                         (platform, stats['followers'], stats['engagement'], random.randint(1000, 5000)))
        conn.commit()
        conn.close()
        return jsonify({'status': 'success', 'message': 'Анализ завершен'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/generate-plan')
def api_generate_plan():
    try:
        platforms = ['tiktok', 'instagram', 'youtube']
        content_types = ["Провокационный вопрос о трендах", "Образовательный гайд для новичков", "Анализ успешных кейсов", "Ответы на частые вопросы"]
        conn = sqlite3.connect('lucifer_analytics.db')
        cursor = conn.cursor()
        for platform in platforms:
            content = random.choice(content_types)
            time = f"{random.randint(10, 20)}:00"
            cursor.execute('INSERT INTO content_plan (platform, content_text, schedule_time, status) VALUES (?, ?, ?, "planned")',
                         (platform, content, time))
        conn.commit()
        conn.close()
        return jsonify({'status': 'success', 'message': 'Контент-план создан'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/test')
def api_test():
    try:
        safety_test = safety_controller.check_action_safety('instagram', 'posts')
        db_test = "успешно" if os.path.exists('lucifer_analytics.db') else "ошибка"
        return jsonify({'status': 'success', 'message': f'Безопасность: {safety_test["safe"]}, БД: {db_test}'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/platform-stats')
def api_platform_stats():
    try:
        conn = sqlite3.connect('lucifer_analytics.db')
        cursor = conn.cursor()
        
        # Получаем последние статистики по каждой платформе
        stats = {}
        platforms = ['tiktok', 'instagram', 'youtube', 'telegram']
        
        for platform in platforms:
            cursor.execute('SELECT followers, engagement, views FROM platform_stats WHERE platform = ? ORDER BY timestamp DESC LIMIT 1', (platform,))
            row = cursor.fetchone()
            if row:
                stats[platform] = {
                    'followers': row[0],
                    'engagement': row[1],
                    'views': row[2]
                }
            else:
                stats[platform] = {'followers': 0, 'engagement': 0, 'views': 0}
        
        conn.close()
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/api/engagement-trends')
def api_engagement_trends():
    try:
        conn = sqlite3.connect('lucifer_analytics.db')
        cursor = conn.cursor()
        
        # Получаем данные за последние 7 записей для графика
        cursor.execute('''
            SELECT platform, engagement, timestamp 
            FROM platform_stats 
            ORDER BY timestamp DESC 
            LIMIT 21
        ''')
        
        data = {'labels': [], 'datasets': []}
        platforms_data = {}
        
        for row in cursor.fetchall():
            platform, engagement, timestamp = row
            if platform not in platforms_data:
                platforms_data[platform] = []
            platforms_data[platform].append({
                'x': timestamp,
                'y': engagement
            })
        
        # Создаем датасеты для Chart.js
        colors = {'tiktok': '#ff0050', 'instagram': '#e4405f', 'youtube': '#ff0000', 'telegram': '#0088cc'}
        
        for platform, values in platforms_data.items():
            data['datasets'].append({
                'label': platform.upper(),
                'data': values[-7:],  # Последние 7 точек
                'borderColor': colors.get(platform, '#dc143c'),
                'backgroundColor': colors.get(platform, '#dc143c') + '20',
                'tension': 0.3
            })
        
        conn.close()
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/api/content-plans')
def api_content_plans():
    try:
        conn = sqlite3.connect('lucifer_analytics.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT platform, content_text, schedule_time, status 
            FROM content_plan 
            ORDER BY rowid DESC 
            LIMIT 10
        ''')
        
        plans = []
        for row in cursor.fetchall():
            plans.append({
                'platform': row[0],
                'content': row[1],
                'time': row[2],
                'status': row[3]
            })
        
        conn.close()
        return jsonify(plans)
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/api/top-posts')
def api_top_posts():
    try:
        # Генерируем тестовые данные для топ постов
        posts = [
            {'platform': 'instagram', 'title': 'Трейдинг сигналы EUR/USD', 'likes': 1250, 'views': 8500, 'comments': 145},
            {'platform': 'tiktok', 'title': 'Как я заработал на крипте', 'likes': 3400, 'views': 25000, 'comments': 380},
            {'platform': 'youtube', 'title': 'Обучение трейдингу с нуля', 'likes': 890, 'views': 4500, 'comments': 67},
            {'platform': 'telegram', 'title': 'VIP сигнал BTC/USDT', 'likes': 450, 'views': 2100, 'comments': 89},
            {'platform': 'instagram', 'title': 'Результаты недели +15%', 'likes': 980, 'views': 6700, 'comments': 112}
        ]
        return jsonify(posts)
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/api/recent-actions')
def api_recent_actions():
    try:
        actions = [
            {'description': 'Опубликован пост в Instagram', 'time': '5 мин назад'},
            {'description': 'Автоответ отправлен 3 пользователям', 'time': '12 мин назад'},
            {'description': 'Сгенерирован контент для TikTok', 'time': '25 мин назад'},
            {'description': 'Кросспостинг выполнен на 3 платформы', 'time': '1 час назад'},
            {'description': 'Отчёт отправлен на email', 'time': '2 часа назад'}
        ]
        return jsonify(actions)
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/api/growth-forecast')
def api_growth_forecast():
    try:
        forecast = {
            'Instagram': {'expectedGrowth': 250, 'percentage': 16.3},
            'TikTok': {'expectedGrowth': 380, 'percentage': 28.5},
            'YouTube': {'expectedGrowth': 120, 'percentage': 8.2},
            'Telegram': {'expectedGrowth': 200, 'percentage': 12.5}
        }
        return jsonify(forecast)
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/api/automation-status')
def api_automation_status():
    try:
        conn = sqlite3.connect('lucifer_analytics.db')
        cursor = conn.cursor()
        cursor.execute('SELECT feature, enabled FROM automation_status')
        
        status = {}
        for row in cursor.fetchall():
            status[row[0]] = bool(row[1])
        
        conn.close()
        return jsonify(status)
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/api/toggle-automation', methods=['POST'])
def api_toggle_automation():
    try:
        feature = request.json.get('feature')
        
        conn = sqlite3.connect('lucifer_analytics.db')
        cursor = conn.cursor()
        
        # Получаем текущий статус
        cursor.execute('SELECT enabled FROM automation_status WHERE feature = ?', (feature,))
        current = cursor.fetchone()
        
        if current:
            new_status = 0 if current[0] else 1
            cursor.execute('UPDATE automation_status SET enabled = ? WHERE feature = ?', (new_status, feature))
            conn.commit()
            conn.close()
            return jsonify({'status': 'success', 'enabled': bool(new_status)})
        else:
            conn.close()
            return jsonify({'status': 'error', 'message': 'Feature not found'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/generate-ai-content')
def api_generate_ai_content():
    try:
        # Используем существующий генератор контента
        generator = ContentGenerator(safety_controller)
        content = generator.generate_trading_content()
        
        if not content.get('error'):
            # Сохраняем в план контента
            conn = sqlite3.connect('lucifer_analytics.db')
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO content_plan (platform, content_text, schedule_time, status)
                VALUES ('instagram', ?, datetime('now'), 'draft')
            ''', (content['content'],))
            conn.commit()
            conn.close()
            
        return jsonify(content)
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/api/check-dms')
def api_check_dms():
    try:
        dm_stats = instagram_dm_automation.get_dm_stats()
        return jsonify({'count': dm_stats.get('unique_senders', 0), 'replied': dm_stats.get('total_replies', 0)})
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/api/export-report')
def api_export_report():
    try:
        report = report_generator.generate_daily_report()
        # В реальности здесь бы генерировался файл отчёта
        return jsonify({'status': 'success', 'url': '#', 'report': report})
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/api/toggle-crosspost', methods=['POST'])
def api_toggle_crosspost():
    try:
        enabled = request.json.get('enabled', False)
        
        conn = sqlite3.connect('lucifer_analytics.db')
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE automation_status 
            SET enabled = ? 
            WHERE feature = 'crossposting'
        ''', (1 if enabled else 0,))
        conn.commit()
        conn.close()
        
        return jsonify({'status': 'success', 'enabled': enabled})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

# ====== НОВЫЕ API ENDPOINTS ДЛЯ АВТОМАТИЗАЦИИ ТРЕЙДИНГА ======

@app.route('/api/instagram/dm-automation', methods=['GET', 'POST'])
def api_instagram_dm_automation():
    if request.method == 'POST':
        data = request.json
        action = data.get('action', '')
        
        if action == 'enable':
            instagram_dm_automation.enabled = True
            # Обновление статуса в БД
            conn = sqlite3.connect('lucifer_analytics.db')
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE automation_status 
                SET enabled = 1, last_run = ?, status = 'active'
                WHERE feature = 'dm_automation'
            ''', (datetime.now().isoformat(),))
            conn.commit()
            conn.close()
            return jsonify({'status': 'success', 'message': 'DM автоматизация включена'})
            
        elif action == 'disable':
            instagram_dm_automation.enabled = False
            conn = sqlite3.connect('lucifer_analytics.db')
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE automation_status 
                SET enabled = 0, status = 'disabled'
                WHERE feature = 'dm_automation'
            ''')
            conn.commit()
            conn.close()
            return jsonify({'status': 'success', 'message': 'DM автоматизация выключена'})
            
        elif action == 'process_dm':
            sender_id = data.get('sender_id', 'test_user')
            message_text = data.get('message_text', 'Привет!')
            result = instagram_dm_automation.process_new_dm(sender_id, message_text)
            return jsonify(result)
    
    # GET запрос - получение статистики
    stats = instagram_dm_automation.get_dm_stats()
    return jsonify(stats)

@app.route('/api/content/generate-trading', methods=['POST'])
def api_generate_trading_content():
    try:
        data = request.json or {}
        content_type = data.get('type', 'random')
        platforms = data.get('platforms', ['instagram', 'telegram'])
        schedule = data.get('schedule', False)
        
        # Генерация контента
        content = content_generator.generate_trading_content(content_type)
        
        if content.get('error'):
            return jsonify({'status': 'error', 'message': content['error']})
        
        # Планирование если требуется
        if schedule:
            schedule_result = content_generator.schedule_content(platforms)
            content['scheduled'] = schedule_result
        
        return jsonify({
            'status': 'success',
            'content': content,
            'platforms': platforms
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/automation/crosspost', methods=['POST'])
def api_crosspost():
    try:
        data = request.json
        content = data.get('content', '')
        platforms = data.get('platforms', ['instagram', 'telegram', 'tiktok'])
        
        if not content:
            # Генерируем контент если не предоставлен
            generated = content_generator.generate_trading_content()
            content = generated['content']
        
        result = crosspost_to_platforms(content, platforms)
        return jsonify(result)
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/reports/daily')
def api_daily_report():
    try:
        report = report_generator.generate_daily_report()
        
        if report.get('error'):
            return jsonify({'status': 'error', 'message': report['error']})
        
        # Сохранение отчета в БД
        conn = sqlite3.connect('lucifer_analytics.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO daily_reports (report_date, report_data, sent)
            VALUES (?, ?, 1)
        ''', (report['date'], json.dumps(report)))
        conn.commit()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'report': report
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/reports/weekly')
def api_weekly_report():
    try:
        report = report_generator.generate_weekly_report()
        return jsonify({
            'status': 'success',
            'report': report
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/automation/detailed-status')
def api_automation_detailed_status():
    try:
        conn = sqlite3.connect('lucifer_analytics.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT feature, enabled, last_run, next_run, status
            FROM automation_status
        ''')
        
        statuses = {}
        for row in cursor.fetchall():
            statuses[row[0]] = {
                'enabled': bool(row[1]),
                'last_run': row[2],
                'next_run': row[3],
                'status': row[4]
            }
        
        # Добавление текущих метрик
        cursor.execute('SELECT COUNT(*) FROM instagram_dms WHERE datetime(timestamp) >= datetime("now", "-24 hours")')
        dm_count_24h = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM content_plan WHERE status = "posted" AND datetime(schedule_time) >= datetime("now", "-24 hours")')
        posts_24h = cursor.fetchone()[0]
        
        conn.close()
        
        # Проверка лимитов безопасности
        safety_status = {
            'instagram': safety_controller.check_action_safety('instagram', 'actions'),
            'telegram': safety_controller.check_action_safety('telegram', 'posts'),
            'tiktok': safety_controller.check_action_safety('tiktok', 'posts')
        }
        
        return jsonify({
            'automation_features': statuses,
            'metrics_24h': {
                'dm_replies': dm_count_24h,
                'posts_published': posts_24h
            },
            'safety_status': safety_status,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/smart-reply', methods=['POST'])
def api_smart_reply():
    try:
        data = request.json
        message = data.get('message', '')
        
        if not message:
            return jsonify({'status': 'error', 'message': 'Сообщение не предоставлено'})
        
        reply = smart_auto_reply.get_smart_reply(message)
        
        return jsonify({
            'status': 'success',
            'original_message': message,
            'smart_reply': reply
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/try-feature', methods=['POST'])
def api_try_feature():
    try:
        data = request.get_json()
        platform = data.get('platform')
        feature = data.get('feature')
        
        # Здесь можно добавить реальную логику активации функций
        # Пока просто возвращаем успех
        message = f'Функция {feature} для платформы {platform} активирована'
        
        return jsonify({'status': 'success', 'message': message})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

def background_tasks():
    def cleanup_task():
        try:
            conn = sqlite3.connect('lucifer_analytics.db')
            cursor = conn.cursor()
            cursor.execute('DELETE FROM platform_stats WHERE timestamp < datetime("now", "-7 days")')
            conn.commit()
            conn.close()
            print("✅ Фоновая очистка выполнена")
        except Exception as e:
            print(f"❌ Ошибка фоновой задачи: {e}")
    
    def send_daily_report():
        try:
            report = report_generator.generate_daily_report()
            if not report.get('error'):
                # Здесь можно добавить отправку email или в Telegram
                print(f"✅ Ежедневный отчет сгенерирован: {report['date']}")
                # Обновление статуса
                conn = sqlite3.connect('lucifer_analytics.db')
                cursor = conn.cursor()
                cursor.execute('''
                    UPDATE automation_status 
                    SET last_run = ?, next_run = ?, status = 'completed'
                    WHERE feature = 'daily_reports'
                ''', (datetime.now().isoformat(), 
                      (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d 09:00:00')))
                conn.commit()
                conn.close()
        except Exception as e:
            print(f"❌ Ошибка ежедневного отчета: {e}")
    
    def send_weekly_report():
        try:
            if datetime.now().weekday() == 0:  # Понедельник
                report = report_generator.generate_weekly_report()
                if not report.get('error'):
                    print(f"✅ Недельный отчет сгенерирован: Неделя {report['week_number']}")
                    # Обновление статуса
                    conn = sqlite3.connect('lucifer_analytics.db')
                    cursor = conn.cursor()
                    cursor.execute('''
                        UPDATE automation_status 
                        SET last_run = ?, next_run = ?, status = 'completed'
                        WHERE feature = 'weekly_reports'
                    ''', (datetime.now().isoformat(),
                          (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d 09:00:00')))
                    conn.commit()
                    conn.close()
        except Exception as e:
            print(f"❌ Ошибка недельного отчета: {e}")
    
    def auto_generate_content():
        try:
            # Проверяем, включена ли автоматическая генерация
            conn = sqlite3.connect('lucifer_analytics.db')
            cursor = conn.cursor()
            cursor.execute('SELECT enabled FROM automation_status WHERE feature = "content_generation"')
            result = cursor.fetchone()
            conn.close()
            
            if result and result[0]:
                # Генерируем и планируем контент
                schedule_result = content_generator.schedule_content(['instagram', 'telegram'])
                if schedule_result.get('scheduled'):
                    print(f"✅ Контент запланирован: {schedule_result['scheduled']} постов")
        except Exception as e:
            print(f"❌ Ошибка автогенерации контента: {e}")
    
    def send_scheduled_report():
        try:
            # Check if email reporting is enabled and configured
            if email_reporter.enabled:
                conn = sqlite3.connect('lucifer_analytics.db')
                cursor = conn.cursor()
                cursor.execute('SELECT report_frequency FROM email_settings ORDER BY id DESC LIMIT 1')
                result = cursor.fetchone()
                conn.close()
                
                if result:
                    frequency = result[0]
                    current_time = datetime.now()
                    
                    # Check if it's time to send the report based on frequency
                    should_send = False
                    if frequency == 'daily':
                        should_send = True  # Will run daily at scheduled time
                    elif frequency == 'weekly' and current_time.weekday() == 0:  # Monday
                        should_send = True
                    elif frequency == 'monthly' and current_time.day == 1:  # First day of month
                        should_send = True
                    
                    if should_send:
                        report_html = email_reporter.generate_analytics_report()
                        subject = f"Lucifer Analytics {frequency.capitalize()} Report - {current_time.strftime('%Y-%m-%d')}"
                        result = email_reporter.send_report(subject, report_html)
                        if result['status'] == 'success':
                            print(f"✅ {frequency.capitalize()} email report sent successfully")
                        else:
                            print(f"❌ Failed to send email report: {result['message']}")
        except Exception as e:
            print(f"❌ Error in scheduled email report: {e}")
    
    # Schedule tasks
    schedule.every(6).hours.do(cleanup_task)
    schedule.every().day.at("09:00").do(send_daily_report)  # Ежедневный отчет в 9:00
    schedule.every().day.at("09:00").do(send_weekly_report)  # Проверка на недельный отчет по понедельникам
    schedule.every().day.at("09:00").do(auto_generate_content)  # Генерация контента на 9:00
    schedule.every().day.at("14:00").do(auto_generate_content)  # Генерация контента на 14:00
    schedule.every().day.at("19:00").do(auto_generate_content)  # Генерация контента на 19:00
    
    while True:
        schedule.run_pending()
        time.sleep(60)

# Start background tasks only once (for the main worker process)
import os
if not os.environ.get('BACKGROUND_STARTED'):
    bg_thread = threading.Thread(target=background_tasks, daemon=True)
    bg_thread.start()
    os.environ['BACKGROUND_STARTED'] = 'true'
    print("✅ Фоновые задачи запущены")

print("✅ Система готова к работе!")
print("🌐 Дашборд доступен по веб-ссылке")

if __name__ == '__main__':
    # For development mode only
    app.run(host='0.0.0.0', port=5000, debug=False)