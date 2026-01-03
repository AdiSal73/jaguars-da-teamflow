import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Users, TrendingUp, BookOpen, ChevronRight, Trophy, Target, BarChart3 } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img 
                src="https://ssprodst.blob.core.windows.net/logos/58/2821a300-9ff6-46d2-a00b-73be4dc4f316-04-02-2025-07-54-52-995.png" 
                alt="Michigan Jaguars" 
                className="w-10 h-10 rounded-xl shadow-lg object-contain"
              />
              <div>
                <h1 className="font-bold text-slate-900 text-lg">Michigan Jaguars</h1>
                <p className="text-[10px] text-emerald-600 font-medium -mt-1">Player and Team Development</p>
              </div>
            </div>
            <Button onClick={() => base44.auth.redirectToLogin()} className="bg-emerald-600 hover:bg-emerald-700">
              Login / Register
            </Button>
          </div>
        </div>
      </header>

      {/* Split Screen */}
      <div className="grid lg:grid-cols-2 min-h-[calc(100vh-64px)]">
        {/* Left Side - Links */}
        <div className="flex flex-col justify-center p-8 lg:p-16">
          <div className="max-w-xl mx-auto w-full">
            <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Welcome to Michigan Jaguars IDP
            </h2>
            <p className="text-slate-600 text-lg mb-8">
              The complete player and team development platform for youth soccer
            </p>

            <div className="space-y-4">
              <Link to={createPageUrl('About')}>
                <Card className="border-2 border-slate-200 hover:border-emerald-400 hover:shadow-xl transition-all cursor-pointer group">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">About Us</h3>
                        <p className="text-sm text-slate-600">Learn about our mission and values</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                  </CardContent>
                </Card>
              </Link>

              <Link to={createPageUrl('Features')}>
                <Card className="border-2 border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all cursor-pointer group">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">Features</h3>
                        <p className="text-sm text-slate-600">Explore our comprehensive platform</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </CardContent>
                </Card>
              </Link>

              <Link to={createPageUrl('FAQ')}>
                <Card className="border-2 border-slate-200 hover:border-purple-400 hover:shadow-xl transition-all cursor-pointer group">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">FAQ</h3>
                        <p className="text-sm text-slate-600">Find answers to common questions</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Feature Highlights */}
            <div className="mt-12 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="text-xs font-semibold text-slate-700">Team Management</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-xs font-semibold text-slate-700">Performance Analytics</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-xs font-semibold text-slate-700">Player Development</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login */}
        <div className="bg-gradient-to-br from-emerald-600 via-blue-600 to-purple-600 flex items-center justify-center p-8 lg:p-16">
          <Card className="w-full max-w-md shadow-2xl border-none">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h3>
                <p className="text-slate-600">Access your IDP dashboard</p>
              </div>

              <div className="space-y-6">
                <Button 
                  onClick={() => base44.auth.redirectToLogin()} 
                  className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-semibold py-6 text-lg shadow-lg"
                >
                  Login with Base44
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-slate-500">New to IDP?</span>
                  </div>
                </div>

                <Button 
                  onClick={() => base44.auth.redirectToLogin()} 
                  variant="outline"
                  className="w-full border-2 border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 py-6 text-lg font-semibold"
                >
                  Create Account
                </Button>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200">
                <p className="text-xs text-slate-500 text-center">
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}