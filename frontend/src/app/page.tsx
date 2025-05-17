"use client";

import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import {
  MessageSquare,
  BookmarkPlus,
  GitFork,
  Zap,
  Activity,
  Heart,
} from "lucide-react";

export default function Home() {
  return (
    <MainLayout>
      <section className="py-20 md:py-28 bg-secondary/50">
        <div className="container mx-auto text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Share your thoughts, <br className="hidden md:block" />
            <span className="text-primary">thread by thread</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10">
            ThreadSpire helps you create, connect, and share your ideas in
            structured threads that engage readers and build communities.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 text-lg"
            >
              Get Started
            </Link>
            <Link
              href="/explore"
              className="bg-secondary text-secondary-foreground px-6 py-3 rounded-md hover:bg-secondary/80 text-lg"
            >
              Explore Threads
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why use ThreadSpire?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card p-6 rounded-lg border">
            <div className="flex items-center mb-4">
              <MessageSquare className="h-6 w-6 text-primary mr-2" />
              <h3 className="text-xl font-semibold">Structured Thinking</h3>
            </div>
            <p className="text-muted-foreground">
              Break down complex ideas into connected segments that flow
              logically and keep readers engaged. Create well-organized content
              that's easy to follow.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <div className="flex items-center mb-4">
              <Heart className="h-6 w-6 text-primary mr-2" />
              <h3 className="text-xl font-semibold">Targeted Reactions</h3>
            </div>
            <p className="text-muted-foreground">
              Get specific feedback on each segment of your thread with
              meaningful reactions. Understand exactly which parts resonate with
              your audience.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <div className="flex items-center mb-4">
              <GitFork className="h-6 w-6 text-primary mr-2" />
              <h3 className="text-xl font-semibold">Remix and Evolve</h3>
            </div>
            <p className="text-muted-foreground">
              Build on others' ideas by forking threads and adding your own
              perspective. Create a collaborative environment where good ideas
              grow better.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Powerful Features
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            ThreadSpire comes packed with everything you need to create, share,
            and discover thought-provoking content
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-center mb-4">
                <Zap className="h-6 w-6 text-primary mr-2" />
                <h3 className="text-xl font-semibold">
                  Seamless Thread Creation
                </h3>
              </div>
              <p className="text-muted-foreground">
                Create beautiful, segmented threads with our intuitive editor.
                Add formatting, save drafts, and publish when you're ready.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-center mb-4">
                <GitFork className="h-6 w-6 text-primary mr-2" />
                <h3 className="text-xl font-semibold">Thread Forking</h3>
              </div>
              <p className="text-muted-foreground">
                Take any published thread and create your own version. Add your
                perspective while maintaining attribution to the original
                author.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-center mb-4">
                <BookmarkPlus className="h-6 w-6 text-primary mr-2" />
                <h3 className="text-xl font-semibold">Bookmarking</h3>
              </div>
              <p className="text-muted-foreground">
                Save threads you love to your personal bookmarks for easy access
                later. Organize content that matters to you.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-center mb-4">
                <Activity className="h-6 w-6 text-primary mr-2" />
                <h3 className="text-xl font-semibold">Analytics Dashboard</h3>
              </div>
              <p className="text-muted-foreground">
                Track how your threads perform with detailed analytics. See
                bookmark counts, reactions, and engagement metrics.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-center mb-4">
                <Heart className="h-6 w-6 text-primary mr-2" />
                <h3 className="text-xl font-semibold">Segment Reactions</h3>
              </div>
              <p className="text-muted-foreground">
                Express yourself with meaningful reactions to specific segments
                of a thread. Show exactly which ideas resonated with you.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-center mb-4">
                <MessageSquare className="h-6 w-6 text-primary mr-2" />
                <h3 className="text-xl font-semibold">Structured Content</h3>
              </div>
              <p className="text-muted-foreground">
                Organize your thoughts in logical segments that make complex
                ideas easier to understand and engage with.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 container mx-auto px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Join our community of thinkers and creators today. Start creating
            threads that inspire, inform, and engage.
          </p>
          <Link
            href="/register"
            className="bg-primary text-primary-foreground px-8 py-3 rounded-md hover:bg-primary/90 text-lg inline-block"
          >
            Sign up for free
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
