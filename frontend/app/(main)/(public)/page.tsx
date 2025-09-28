"use client";

import React from "react";
import Link from "next/link";
import {
  TrendingUp,
  Shield,
  Target,
  Users,
  BookOpen,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Star,
  Zap,
  PiggyBank,
  LineChart,
} from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: <PiggyBank className="h-8 w-8 text-green-600" />,
      title: "Virtual Trading",
      description:
        "Practice with ₹10,00,000 virtual money. No real money at risk.",
    },
    {
      icon: <LineChart className="h-8 w-8 text-blue-600" />,
      title: "Real Market Data",
      description: "Live stock prices and market data from NSE and BSE.",
    },
    {
      icon: <Target className="h-8 w-8 text-purple-600" />,
      title: "Portfolio Tracking",
      description: "Monitor your investments and track P&L in real-time.",
    },
    {
      icon: <BookOpen className="h-8 w-8 text-orange-600" />,
      title: "Learn Trading",
      description: "Master stock trading without the fear of losing money.",
    },
  ];

  const benefits = [
    "Practice trading strategies risk-free",
    "Learn from real market conditions",
    "Build confidence before real trading",
    "Track performance and improve skills",
    "No registration fees or hidden costs",
    "Access to live market data",
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Engineering Student",
      content:
        "Finally learned stock trading without losing my savings. The virtual money feature is perfect for beginners!",
      rating: 5,
    },
    {
      name: "Rajesh Kumar",
      role: "Software Developer",
      content:
        "Great platform to practice investment strategies. The interface is clean and easy to use.",
      rating: 5,
    },
    {
      name: "Anita Patel",
      role: "Finance Graduate",
      content:
        "Helped me understand market dynamics before I started real trading. Highly recommend!",
      rating: 5,
    },
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 px-6 pt-16 pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl leading-tight font-bold text-gray-900 md:text-6xl">
                  Practice Stock Trading with{" "}
                  <span className="text-green-600">Virtual Money</span>
                </h1>
                <p className="text-xl leading-relaxed text-gray-600">
                  Master the art of stock trading without risking real money.
                  Start with ₹10,00,000 virtual cash and learn from real market
                  conditions.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-lg bg-green-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-green-700"
                >
                  Start Trading Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center justify-center rounded-lg border-2 border-green-600 bg-white px-8 py-4 text-lg font-semibold text-green-600 transition-colors hover:bg-green-50"
                >
                  Learn More
                </Link>
              </div>

              <div className="flex items-center space-x-8 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>100% Safe</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <span>Real-time Data</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span>Beginner Friendly</span>
                </div>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="relative">
                <img
                  src="/logos/stocks-learners-logo-with-title-original.png"
                  alt="StockLearners App Logo"
                  className="h-80 w-80 rounded-2xl object-contain"
                  style={{
                    filter: "drop-shadow(0 25px 25px rgb(0 0 0 / 0.15))",
                    background: "transparent",
                  }}
                />
                {/* Optional: Add a subtle glow effect */}
                <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-green-100 to-blue-100 opacity-30 blur-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              Why Choose Stock Learners?
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-gray-600">
              The perfect platform to learn stock trading with all the features
              you need to succeed in the market.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group rounded-2xl border border-gray-200 p-8 transition-all duration-300 hover:border-green-300 hover:shadow-xl"
              >
                <div className="mb-6 transition-transform duration-300 group-hover:scale-110">
                  {feature.icon}
                </div>
                <h3 className="mb-3 text-xl font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="leading-relaxed text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-3xl font-bold text-gray-900 md:text-4xl">
                Everything You Need to Master Stock Trading
              </h2>
              <p className="mb-8 text-lg text-gray-600">
                Our platform provides all the tools and features you need to
                learn trading effectively and build confidence in your
                investment decisions.
              </p>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-lg bg-green-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-green-700"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="rounded-xl bg-white p-6 shadow-lg">
                  <div className="mb-1 text-2xl font-bold text-green-600">
                    ₹10L
                  </div>
                  <div className="text-sm text-gray-600">
                    Virtual Starting Capital
                  </div>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-lg">
                  <div className="mb-1 text-2xl font-bold text-blue-600">
                    Live
                  </div>
                  <div className="text-sm text-gray-600">Market Data</div>
                </div>
              </div>
              <div className="mt-8 space-y-4">
                <div className="rounded-xl bg-white p-6 shadow-lg">
                  <div className="mb-1 text-2xl font-bold text-purple-600">
                    0
                  </div>
                  <div className="text-sm text-gray-600">Real Money Risk</div>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-lg">
                  <div className="mb-1 text-2xl font-bold text-orange-600">
                    24/7
                  </div>
                  <div className="text-sm text-gray-600">Learning Access</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of successful learners who started their trading
              journey with us.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="rounded-2xl bg-gray-50 p-8">
                <div className="mb-4 flex items-center">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-current text-yellow-400"
                    />
                  ))}
                </div>
                <p className="mb-6 text-gray-700 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">
            Ready to Start Your Trading Journey?
          </h2>
          <p className="mb-8 text-xl text-green-100">
            Join thousands of learners who are mastering stock trading with
            virtual money. No risk, just learning.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-lg font-semibold text-green-600 transition-colors hover:bg-gray-50"
            >
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border-2 border-white px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-white hover:text-green-600"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
