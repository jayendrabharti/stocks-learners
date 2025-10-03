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
  Activity,
  Brain,
  Lightbulb,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const features = [
    {
      icon: <PiggyBank className="text-chart-1 h-8 w-8" />,
      title: "₹10 Lakh Virtual Money",
      description:
        "Start with ₹10,00,000 virtual cash to practice trading. Learn without any financial risk to your real money.",
    },
    {
      icon: <Activity className="text-chart-2 h-8 w-8" />,
      title: "Live Market Data",
      description:
        "Access real-time stock prices, market movements, and live data from NSE and BSE exchanges.",
    },
    {
      icon: <Target className="text-chart-4 h-8 w-8" />,
      title: "Portfolio Management",
      description:
        "Track your virtual investments, monitor profit/loss, and analyze your trading performance in real-time.",
    },
    {
      icon: <Brain className="text-chart-5 h-8 w-8" />,
      title: "Trading Education",
      description:
        "Learn stock market fundamentals, trading strategies, and risk management without losing real money.",
    },
    {
      icon: <BarChart3 className="text-chart-1 h-8 w-8" />,
      title: "Real Market Conditions",
      description:
        "Experience actual market volatility, price movements, and trading scenarios in a safe environment.",
    },
    {
      icon: <Lightbulb className="text-chart-2 h-8 w-8" />,
      title: "Strategy Testing",
      description:
        "Test different trading strategies and investment approaches before applying them with real money.",
    },
  ];

  const benefits = [
    "Practice trading with ₹10 lakh virtual money completely risk-free",
    "Learn from real market data and live price movements",
    "Build confidence and develop trading skills before investing real money",
    "Test and refine your investment strategies without financial consequences",
    "Understand market volatility and timing without real losses",
    "Access comprehensive portfolio tracking and performance analytics",
    "Experience real trading scenarios in a safe learning environment",
    "No registration fees, hidden costs, or financial commitments required",
  ];

  const learningStats = [
    {
      icon: <Shield className="text-chart-1 h-8 w-8" />,
      title: "100% Risk-Free",
      description:
        "Learn trading without any financial risk to your real money",
      highlight: "Safe Learning",
    },
    {
      icon: <Activity className="text-chart-2 h-8 w-8" />,
      title: "Real Market Data",
      description:
        "Practice with live stock prices and actual market conditions",
      highlight: "Live Data",
    },
    {
      icon: <Award className="text-chart-4 h-8 w-8" />,
      title: "Comprehensive Training",
      description:
        "Build skills from basic concepts to advanced trading strategies",
      highlight: "Full Education",
    },
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="from-muted/30 via-background to-muted/20 relative overflow-hidden bg-gradient-to-br px-6 pt-16 pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-foreground text-4xl leading-tight font-bold md:text-6xl">
                  Practice Stock Trading with{" "}
                  <span className="text-chart-1">Virtual Money</span>
                </h1>
                <p className="text-muted-foreground text-xl leading-relaxed">
                  Master the art of stock trading without risking real money.
                  Start with ₹10,00,000 virtual cash and learn from real market
                  conditions.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="bg-chart-1 hover:bg-chart-1/90"
                  asChild
                >
                  <Link href="/login">
                    Start Trading Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-chart-1 text-chart-1 hover:bg-chart-1/5"
                  asChild
                >
                  <Link href="#features">Learn More</Link>
                </Button>
              </div>

              <div className="text-muted-foreground flex items-center space-x-8 text-sm">
                <div className="flex items-center space-x-2">
                  <Shield className="text-chart-1 h-4 w-4" />
                  <span>100% Safe</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="text-chart-2 h-4 w-4" />
                  <span>Real-time Data</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="text-chart-4 h-4 w-4" />
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
      {/* Features Section */}
      <section id="features" className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 space-y-4 text-center">
            <h2 className="text-foreground text-3xl font-bold md:text-5xl">
              Everything You Need to{" "}
              <span className="text-chart-1">Learn Trading</span>
            </h2>
            <p className="text-muted-foreground text-xl">
              Professional-grade tools and features to accelerate your trading
              education.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group border-border bg-background hover:border-chart-1/20 transition-all duration-300 hover:shadow-lg"
              >
                <CardHeader className="pb-4">
                  <div className="bg-chart-1/10 text-chart-1 group-hover:bg-chart-1 mb-4 flex h-16 w-16 items-center justify-center rounded-lg transition-colors group-hover:text-white">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-foreground text-xl">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/30 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-foreground text-3xl font-bold md:text-4xl">
                  Why Choose Our{" "}
                  <span className="text-chart-1">Trading Platform?</span>
                </h2>
                <p className="text-muted-foreground text-lg">
                  Master stock trading with our comprehensive virtual trading
                  platform designed for learners and practice.
                </p>
              </div>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="text-chart-1 h-6 w-6 flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                className="bg-chart-1 hover:bg-chart-1/90"
                asChild
              >
                <Link href="/login">
                  Get Started Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            <div className="hidden lg:block">
              <div className="from-chart-1/10 to-chart-2/10 relative rounded-2xl bg-gradient-to-br p-8">
                <div className="from-chart-1/5 absolute inset-0 rounded-2xl bg-gradient-to-br to-transparent" />
                <div className="relative">
                  <BarChart3 className="text-chart-1 mb-6 h-24 w-24" />
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="bg-chart-1 h-3 w-20 rounded-full" />
                      <div className="bg-chart-2 h-3 w-16 rounded-full" />
                      <div className="bg-chart-4 h-3 w-12 rounded-full" />
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="bg-chart-2 h-3 w-16 rounded-full" />
                      <div className="bg-chart-1 h-3 w-24 rounded-full" />
                      <div className="bg-chart-5 h-3 w-8 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Benefits Section */}
      <section className="bg-background py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-foreground mb-4 text-3xl font-bold md:text-4xl">
              Why Learn Trading with Virtual Money?
            </h2>
            <p className="text-muted-foreground text-lg">
              Master the stock market without risking your hard-earned money.
              Build skills and confidence first.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
            {learningStats.map((stat, index) => (
              <Card
                key={index}
                className="border-border bg-background text-center transition-shadow hover:shadow-lg"
              >
                <CardContent className="pt-8 pb-6">
                  <div className="mb-6 flex justify-center">
                    <div className="bg-chart-1/10 rounded-full p-4">
                      {stat.icon}
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-chart-1/10 text-chart-1 mb-4"
                  >
                    {stat.highlight}
                  </Badge>
                  <h3 className="text-foreground mb-3 text-xl font-bold">
                    {stat.title}
                  </h3>
                  <p className="text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16 text-center">
            <div className="mx-auto max-w-3xl space-y-6">
              <h3 className="text-foreground text-2xl font-bold">
                Perfect for Beginners and Experienced Traders
              </h3>
              <p className="text-muted-foreground text-lg">
                Whether you're completely new to trading or an experienced
                investor looking to test new strategies, our virtual trading
                platform provides a safe environment to learn, practice, and
                improve your skills without any financial risk.
              </p>
              <Button
                size="lg"
                className="bg-chart-1 hover:bg-chart-1/90"
                asChild
              >
                <Link href="/login">
                  Start Learning Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="from-chart-1/10 via-chart-2/5 to-chart-4/10 bg-gradient-to-br px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-foreground text-3xl font-bold md:text-5xl">
                Ready to Start Your Trading Journey?
              </h2>
              <p className="text-muted-foreground text-xl">
                Begin learning with ₹10 lakh virtual money today. No credit card
                required, completely free to start.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="bg-chart-1 hover:bg-chart-1/90"
                asChild
              >
                <Link href="/login">
                  Start Virtual Trading
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-chart-1 text-chart-1 hover:bg-chart-1/5"
                asChild
              >
                <Link href="#features">Learn More</Link>
              </Button>
            </div>

            <div className="text-muted-foreground flex items-center justify-center space-x-8 text-sm">
              <div className="flex items-center space-x-2">
                <Shield className="text-chart-1 h-4 w-4" />
                <span>100% Risk-Free</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="text-chart-2 h-4 w-4" />
                <span>Instant Setup</span>
              </div>
              <div className="flex items-center space-x-2">
                <PiggyBank className="text-chart-4 h-4 w-4" />
                <span>Virtual Money</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
