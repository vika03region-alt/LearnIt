import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useToast } from "../hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Send, Plus, Trash2, Edit2, Sparkles, Bot, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AIContentPanel from "@/components/AIContentPanel";
import { ViralGrowthDashboard } from "@/components/ViralGrowthDashboard";
import TelegramPromotionTester from "@/components/TelegramPromotionTester";

interface Conversation {
  id: number;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export default function AIAssistant() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Получение всех разговоров
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ["/api/ai/conversations"],
  });

  // Получение сообщений выбранного разговора
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["/api/ai/conversations", selectedConversationId, "messages"],
    enabled: !!selectedConversationId,
  });

  // Создание нового разговора
  const createConversation = useMutation({
    mutationFn: (title?: string) => apiRequest("/api/ai/conversations", {
      method: "POST",
      body: { title: title || "Новый разговор" },
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/conversations"] });
      setSelectedConversationId(data.id);
      toast({
        title: "Разговор создан",
        description: "Новый разговор с AI-ассистентом успешно создан",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать разговор",
        variant: "destructive",
      });
    },
  });

  // Отправка сообщения
  const sendMessage = useMutation({
    mutationFn: ({ conversationId, message }: { conversationId: number; message: string }) =>
      apiRequest(`/api/ai/conversations/${conversationId}/messages`, {
        method: "POST",
        body: { message },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/ai/conversations", selectedConversationId, "messages"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/conversations"] });
      setMessageText("");
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive",
      });
    },
  });

  // Обновление заголовка разговора
  const updateTitle = useMutation({
    mutationFn: ({ conversationId, title }: { conversationId: number; title: string }) =>
      apiRequest(`/api/ai/conversations/${conversationId}`, {
        method: "PUT",
        body: { title },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/conversations"] });
      setIsEditing(null);
      setEditTitle("");
      toast({
        title: "Заголовок обновлен",
        description: "Заголовок разговора успешно изменен",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить заголовок",
        variant: "destructive",
      });
    },
  });

  // Удаление разговора
  const deleteConversation = useMutation({
    mutationFn: (conversationId: number) =>
      apiRequest(`/api/ai/conversations/${conversationId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/conversations"] });
      if (selectedConversationId === selectedConversationId) {
        setSelectedConversationId(null);
      }
      toast({
        title: "Разговор удален",
        description: "Разговор успешно удален",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить разговор",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversationId) return;

    sendMessage.mutate({
      conversationId: selectedConversationId,
      message: messageText.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleUpdateTitle = (conversationId: number) => {
    if (!editTitle.trim()) return;
    updateTitle.mutate({ conversationId, title: editTitle.trim() });
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Bot className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Ассистент</h1>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Sparkles className="w-4 h-4 mr-1" />
            Умный помощник
          </Badge>
        </div>

        <Tabs defaultValue="generation" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="generation">Генерация</TabsTrigger>
          <TabsTrigger value="viral">Вирусность</TabsTrigger>
          <TabsTrigger value="telegram">Telegram</TabsTrigger>
          <TabsTrigger value="learning">Обучение</TabsTrigger>
          <TabsTrigger value="domination">Доминация</TabsTrigger>
        </TabsList>
        <TabsContent value="generation">
          <AIContentPanel />
        </TabsContent>

        <TabsContent value="viral">
          <ViralGrowthDashboard />
        </TabsContent>

        <TabsContent value="telegram">
          <TelegramPromotionTester />
        </TabsContent>

        <TabsContent value="learning">
          <AILearningDashboard />
        </TabsContent>

        <TabsContent value="domination">
          <AIDominationDashboard />
        </TabsContent>
      </Tabs>
      </div>
    </Layout>
  );
}