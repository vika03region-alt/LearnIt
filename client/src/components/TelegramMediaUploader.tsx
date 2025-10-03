
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Upload, Send, Image, Video, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function TelegramMediaUploader() {
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const uploadToTelegram = async () => {
    if (!selectedFile) {
      toast({
        title: "Ошибка",
        description: "Выберите файл для загрузки",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('caption', caption);

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setUploadProgress((e.loaded / e.total) * 100);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          toast({
            title: "✅ Загружено!",
            description: "Медиа успешно отправлено в Telegram",
          });
          setSelectedFile(null);
          setCaption('');
          setUploadProgress(0);
        } else {
          throw new Error('Upload failed');
        }
        setIsUploading(false);
      });

      xhr.addEventListener('error', () => {
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить файл",
          variant: "destructive",
        });
        setIsUploading(false);
      });

      xhr.open('POST', '/api/telegram/upload-media');
      xhr.send(formData);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при загрузке",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return <File className="w-12 h-12 text-gray-400" />;
    if (selectedFile.type.startsWith('image/')) return <Image className="w-12 h-12 text-blue-500" />;
    if (selectedFile.type.startsWith('video/')) return <Video className="w-12 h-12 text-purple-500" />;
    return <File className="w-12 h-12 text-gray-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Загрузка в Telegram
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          {getFileIcon()}
          <p className="text-sm text-gray-600 mt-2 mb-3">
            {selectedFile ? selectedFile.name : 'Выберите файл'}
          </p>
          <label>
            <Button variant="outline" asChild>
              <span>
                Выбрать файл
                <Input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </span>
            </Button>
          </label>
        </div>

        <Textarea
          placeholder="Добавьте описание (опционально)..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
        />

        {isUploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} />
            <p className="text-sm text-center text-gray-600">
              Загрузка: {Math.round(uploadProgress)}%
            </p>
          </div>
        )}

        <Button
          onClick={uploadToTelegram}
          disabled={!selectedFile || isUploading}
          className="w-full"
        >
          <Send className="w-4 h-4 mr-2" />
          {isUploading ? 'Загрузка...' : 'Отправить в Telegram'}
        </Button>
      </CardContent>
    </Card>
  );
}
