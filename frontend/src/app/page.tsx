'use client';
import React from 'react';
import {
  ArrowRight,
  Package,
  Truck,
  Clock,
  Users,
  BarChart3,
  Zap,
  Shield,
  CheckCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ShipStationLanding() {
  const router = useRouter();
  const handleGetStarted = () => {
    router.push('/pick-lists');
  };

  const features = [
    {
      icon: <Package className="w-6 h-6" />,
      title: 'Smart Pick Lists',
      description: 'AI-powered optimization reduces walking time by 40%',
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Real-Time Tracking',
      description: 'Live updates and instant notifications',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Advanced Analytics',
      description: 'Actionable insights to boost performance',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Team Management',
      description: 'Streamlined task assignment and monitoring',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Enterprise Security',
      description: 'SOC 2 compliant with bank-level encryption',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Lightning Fast',
      description: 'Process 1000+ orders per minute',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900">
      {/* Ambient Background */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-white/5 backdrop-blur-xl">
        <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              ShipStation
            </span>
          </div>
          <button
            onClick={handleGetStarted}
            className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/30 text-white px-6 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2"
          >
            <span className="font-medium">Go to Pick Lists</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300 text-sm font-medium backdrop-blur-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                Revolutionary Dispatching
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                <span className="text-white">Transform Your</span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Dispatch Flow
                </span>
              </h1>

              <p className="text-xl text-gray-300 leading-relaxed max-w-lg">
                Intelligent pick-list generation with real-time tracking that
                scales effortlessly with your business growth.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleGetStarted}
                  className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/25 hover:-translate-y-1 flex items-center justify-center gap-3"
                >
                  <span>Start Dispatching</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                </button>

                <button className="group border-2 border-gray-600 hover:border-gray-400 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:bg-white/5 hover:-translate-y-1">
                  <span>Watch Demo</span>
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                    99.9%
                  </div>
                  <div className="text-gray-400 text-sm font-medium">
                    Uptime
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    50M+
                  </div>
                  <div className="text-gray-400 text-sm font-medium">
                    Orders
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    10K+
                  </div>
                  <div className="text-gray-400 text-sm font-medium">
                    Customers
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="relative">
              {/* Floating indicators */}
              <div className="absolute -top-6 -right-6 w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-xl animate-bounce">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -bottom-6 -left-6 w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-xl animate-pulse">
                <Truck className="w-7 h-7 text-white" />
              </div>

              {/* Main Dashboard */}
              <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <h3 className="text-white font-semibold text-lg">
                      Live Dashboard
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-sm font-medium">
                        Online
                      </span>
                    </div>
                  </div>

                  {/* Pick Lists */}
                  <div className="space-y-3">
                    {[
                      {
                        id: '1001',
                        items: 5,
                        status: 'Ready',
                        color: 'from-green-500 to-emerald-600',
                      },
                      {
                        id: '1002',
                        items: 8,
                        status: 'Processing',
                        color: 'from-blue-500 to-cyan-600',
                      },
                      {
                        id: '1003',
                        items: 3,
                        status: 'Complete',
                        color: 'from-purple-500 to-pink-600',
                      },
                    ].map((list, i) => (
                      <div
                        key={i}
                        className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02]"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 bg-gradient-to-br ${list.color} rounded-xl flex items-center justify-center shadow-lg`}
                            >
                              <Package className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="text-white font-medium">
                                Pick List #{list.id}
                              </div>
                              <div className="text-gray-400 text-sm">
                                {list.items} items
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-300 font-medium">
                              {list.status}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Progress */}
                  <div className="pt-2">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300 font-medium">
                        Today&apos;s Progress
                      </span>
                      <span className="text-white font-semibold">87%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: '87%' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold text-white">
              Built for Scale
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Everything you need to optimize shipping operations with
              enterprise-grade reliability
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white mb-4 group-hover:shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
