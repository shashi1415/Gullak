"use client";

import Navbar from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  Target,
  MessageCircle,
  Shield,
  Zap,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import React from "react";

export default function HomePage() {
  const features = [
    {
      icon: <MessageCircle className="h-10 w-10 text-primary" />,
      title: "AI Finance Assistant",
      description:
        "Chat with Gullak AI for personalized advice on saving, investing, and budgeting.",
    },
    {
      icon: <Target className="h-10 w-10 text-primary" />,
      title: "Smart Goal Tracking",
      description:
        "Set savings goals and get daily reminders to help you reach them faster.",
    },
    {
      icon: <TrendingUp className="h-10 w-10 text-primary" />,
      title: "Investment Monitoring",
      description:
        "Track your stocks, mutual funds, and SIPs with real-time alerts and suggestions.",
    },
    {
      icon: <Shield className="h-10 w-10 text-primary" />,
      title: "Debt Management",
      description:
        "Never miss a payment with automated reminders for bills and debts.",
    },
    {
      icon: <Zap className="h-10 w-10 text-primary" />,
      title: "Automated Insights",
      description:
        "Get daily summaries and weekly reports on your spending and savings.",
    },
    {
      icon: <Wallet className="h-10 w-10 text-primary" />,
      title: "Expense Tracking",
      description:
        "Log and categorize expenses to see where your money goes.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* 🌟 Hero Section with Background Video */}
      <section className="relative w-full h-[90vh] flex items-center justify-center text-center overflow-hidden">
        {/* 🎬 Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover"
        >
          <source src="/videos/Untitled video - Made with Clipchamp.mp4" type="video/mp4" />
        </video>

        {/* 🌑 Dark Overlay */}
        <div className="absolute inset-0 bg-black/50"></div>

        {/* 💬 Foreground Hero Text */}
        <div className="relative z-10 container mx-auto px-4 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 text-balance">
              Your{" "}
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                AI-Powered
              </span>
              <br />
              Finance Companion
            </h1>
            <p className="text-lg lg:text-xl text-gray-200 mb-8">
              Meet Gullak – your humanoid financial assistant that guides you
              through budgeting, saving, investing, and achieving your money
              goals with daily support and smart insights.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/chatbot">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 bg-transparent text-white border-white hover:bg-white/10"
                >
                  <MessageCircle className="h-4 w-4" /> Chat with Gullak AI
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 💼 Features Section (Normal Background) */}
      <section className="container mx-auto px-4 py-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl lg:text-4xl font-bold text-center mb-12"
        >
          Everything You Need to Manage Your Money
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow bg-card/50 backdrop-blur-sm border-border/40">
                <CardContent className="p-6 flex flex-col items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground text-pretty">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
