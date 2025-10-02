import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Send, Plus, Trash2, Edit2, Sparkles, Bot, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/Layout";

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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Sidebar с разговорами */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Разговоры</CardTitle>
                <Button
                  size="sm"
                  onClick={() => createConversation.mutate()}
                  disabled={createConversation.isPending}
                  data-testid="button-new-conversation"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="p-4 space-y-2">
                  {loadingConversations ? (
                    <div className="text-center text-gray-500 py-4">Загрузка...</div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      Нет разговоров.
                      <br />
                      Создайте новый!
                    </div>
                  ) : (
                    conversations.map((conversation: Conversation) => (
                      <div
                        key={conversation.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                          selectedConversationId === conversation.id
                            ? "bg-blue-100 dark:bg-blue-900"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                        onClick={() => setSelectedConversationId(conversation.id)}
                        data-testid={`conversation-${conversation.id}`}
                      >
                        <div className="flex items-center justify-between">
                          {isEditing === conversation.id ? (
                            <div className="flex-1 flex gap-1">
                              <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    handleUpdateTitle(conversation.id);
                                  }
                                }}
                                className="h-6 text-sm"
                                data-testid={`input-edit-title-${conversation.id}`}
                              />
                              <Button
                                size="sm"
                                className="h-6 px-2"
                                onClick={() => handleUpdateTitle(conversation.id)}
                                data-testid={`button-save-title-${conversation.id}`}
                              >
                                ✓
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1">
                                <p className="text-sm font-medium truncate">{conversation.title}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(conversation.updatedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsEditing(conversation.id);
                                    setEditTitle(conversation.title);
                                  }}
                                  data-testid={`button-edit-${conversation.id}`}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteConversation.mutate(conversation.id);
                                  }}
                                  data-testid={`button-delete-${conversation.id}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Основная область чата */}
          <Card className="lg:col-span-3 flex flex-col">
            {!selectedConversationId ? (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Выберите разговор</h3>
                  <p>Выберите существующий разговор или создайте новый</p>
                </div>
              </CardContent>
            ) : (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-blue-600" />
                    Чат с AI-ассистентом
                    <Badge variant="outline" className="ml-auto">
                      ID: {selectedConversationId}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Сообщения */}
                  <ScrollArea className="flex-1 p-4">
                    {loadingMessages ? (
                      <div className="text-center text-gray-500 py-4">Загрузка сообщений...</div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <Bot className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="mb-2">Начните разговор с AI-ассистентом</p>
                        <p className="text-sm">Задайте любой вопрос о контенте, аналитике или платформе</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message: Message) => (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${
                              message.role === "user" ? "flex-row-reverse" : "flex-row"
                            }`}
                            data-testid={`message-${message.id}`}
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className={message.role === "user" ? "bg-blue-100" : "bg-green-100"}>
                                {message.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className={`flex-1 max-w-[80%] p-3 rounded-lg ${
                                message.role === "user"
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{message.content}</p>
                              <p className={`text-xs mt-2 ${
                                message.role === "user" ? "text-blue-100" : "text-gray-500"
                              }`}>
                                {new Date(message.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  <Separator />

                  {/* Ввод сообщения */}
                  <div className="p-4">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Напишите ваш вопрос..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 min-h-[80px] resize-none"
                        disabled={sendMessage.isPending}
                        data-testid="input-message"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() || sendMessage.isPending}
                        className="px-4"
                        data-testid="button-send"
                      >
                        {sendMessage.isPending ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  </Layout>
  );
}