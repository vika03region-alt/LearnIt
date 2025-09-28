import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  Brain, 
  BarChart3, 
  Clock,
  Instagram,
  Youtube,
  LogIn
} from "lucide-react";
import { SiTiktok, SiTelegram } from "react-icons/si";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Lucifer Trading</h1>
              <p className="text-muted-foreground">Social Media Automation Hub</p>
            </div>
          </div>

          <h2 className="text-5xl font-bold text-foreground mb-6">
            Automate Your Trading Content
            <span className="block text-primary">Across All Platforms</span>
          </h2>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            AI-powered social media automation platform designed for trading professionals. 
            Generate engaging content, schedule posts, and monitor performance with advanced safety controls.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg"
              className="text-lg px-8 py-6"
              onClick={() => window.location.href = '/api/auth/login'} // Changed to correct login endpoint
              data-testid="button-login"
            >
              Get Started Free
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="text-lg px-8 py-6"
              data-testid="button-learn-more"
            >
              Learn More
            </Button>
          </div>

          {/* Platform Icons */}
          <div className="flex items-center justify-center gap-6 mb-16">
            <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2">
              <Instagram className="w-5 h-5 text-pink-600" />
              Instagram
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2">
              <SiTiktok className="w-5 h-5 text-red-600" />
              TikTok
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2">
              <Youtube className="w-5 h-5 text-red-600" />
              YouTube
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2">
              <SiTelegram className="w-5 h-5 text-blue-600" />
              Telegram
            </Badge>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>AI Content Generation</CardTitle>
              <CardDescription>
                Powered by OpenAI GPT-5, generate engaging trading content tailored for each platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Trading signals & market analysis</li>
                <li>• Educational content creation</li>
                <li>• Platform-specific optimization</li>
                <li>• Multi-language support</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Advanced Safety Controls</CardTitle>
              <CardDescription>
                Comprehensive rate limiting and safety monitoring to prevent account bans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Real-time rate limit monitoring</li>
                <li>• Platform-specific safety rules</li>
                <li>• Automatic emergency stops</li>
                <li>• Compliance tracking</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Comprehensive Analytics</CardTitle>
              <CardDescription>
                Track engagement, reach, and performance across all connected platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Real-time engagement tracking</li>
                <li>• Cross-platform analytics</li>
                <li>• Performance insights</li>
                <li>• Growth trend analysis</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle>Smart Scheduling</CardTitle>
              <CardDescription>
                Automated posting with optimal timing and intelligent queue management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Optimal timing algorithms</li>
                <li>• Bulk content scheduling</li>
                <li>• Time zone optimization</li>
                <li>• Queue management</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle>Multi-Platform Support</CardTitle>
              <CardDescription>
                Seamless integration with Instagram, TikTok, YouTube, and Telegram
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Native API integrations</li>
                <li>• Platform-specific features</li>
                <li>• Unified content management</li>
                <li>• Cross-posting capabilities</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <CardTitle>Enterprise Security</CardTitle>
              <CardDescription>
                Bank-level security with encrypted data storage and secure API handling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• End-to-end encryption</li>
                <li>• Secure token management</li>
                <li>• GDPR compliance</li>
                <li>• Regular security audits</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Automate Your Trading Content?</CardTitle>
              <CardDescription className="text-lg">
                Join thousands of traders who trust Lucifer Trading for their social media automation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                size="lg" 
                className="text-lg px-12 py-6"
                onClick={() => window.location.href = '/api/auth/login'} // Changed to correct login endpoint
                data-testid="button-get-started"
              >
                Start Your Free Trial
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                No credit card required • 7-day free trial • Cancel anytime
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}