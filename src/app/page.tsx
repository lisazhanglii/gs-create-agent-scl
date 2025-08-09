"use client";

import { useCoAgent, useCopilotAction } from "@copilotkit/react-core";
import { CopilotKitCSSProperties, CopilotSidebar } from "@copilotkit/react-ui";
import { useState } from "react";
import { LinkedInPostState as LinkedInPostStateSchema } from "@/mastra/agents";
import { z } from "zod";

// Simplified state type
type LinkedInPostState = z.infer<typeof LinkedInPostStateSchema> & {
  generatedPosts: Array<{
    goal: string;
    brand: string;
    topic: string;
    timestamp: string;
  }>;
};

export default function CopilotKitPage() {
  const [themeColor, setThemeColor] = useState("#6366f1");

  useCopilotAction({
    name: "setThemeColor",
    parameters: [{
      name: "themeColor",
      description: "The theme color to set. Make sure to pick nice colors.",
      required: true, 
    }],
    handler({ themeColor }) {
      setThemeColor(themeColor);
    },
  });

  return (
    <main style={{ "--copilot-kit-primary-color": themeColor } as CopilotKitCSSProperties}>
      <YourMainContent themeColor={themeColor} />
      <CopilotSidebar
        clickOutsideToClose={false}
        defaultOpen={true}
        labels={{
          title: "LinkedIn Content Assistant",
          initial: "👋 Hi! I'm your LinkedIn content creation assistant.\n\n🎯 **What I can do:**\n- Create professional LinkedIn posts with custom HTML UI\n- Generate engaging content based on your goals\n- Build LinkedIn-style sponsored post components\n\n📝 **Try asking me:**\n- \"Create a LinkedIn post for TechCorp about AI innovation to showcase thought leadership\"\n- \"Generate a post for our startup about remote work culture\"\n- \"Make a business post about digital transformation\"\n\nI'll create beautiful LinkedIn-style UI components with professional content!"
        }}
      />
    </main>
  );
}

function YourMainContent({ themeColor }: { themeColor: string }) {
  // Shared State with simplified schema
  const {state, setState} = useCoAgent<LinkedInPostState>({
    name: "linkedInPostAgent",
    initialState: {
      generatedPosts: [],
    },
  })

  // Single action for LinkedIn post generation
  useCopilotAction({
    name: "linkedInPostTool",
    description: "Generate a LinkedIn post with HTML UI component",
    available: "frontend", 
    parameters: [
      { name: "goal", type: "string", required: true },
      { name: "brand", type: "string", required: true },
      { name: "topic", type: "string", required: true },
    ],
    render: ({ args }) => {
      return <LinkedInPostCard 
        goal={args.goal}
        brand={args.brand}
        topic={args.topic}
        themeColor={themeColor} 
      />
    },
    handler: ({ goal, brand, topic }) => {
      // Update the shared state when a new post is generated
      const newPost = {
        goal,
        brand,
        topic,
        timestamp: new Date().toISOString(),
      };

      setState(prevState => ({
        ...prevState,
        generatedPosts: [...(prevState.generatedPosts || []), newPost]
      }));
    },
  });

  useCopilotAction({
    name: "updateWorkingMemory",
    available: "frontend",
    render: ({ args }) => {
      return <div style={{ backgroundColor: themeColor }} className="rounded-2xl max-w-md w-full text-white p-4">
        <p>✨ Memory updated</p>
        <details className="mt-2">
          <summary className="cursor-pointer text-white">See updates</summary>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }} className="overflow-x-auto text-sm bg-white/20 p-4 rounded-lg mt-2">
            {JSON.stringify(args, null, 2)}
          </pre>
        </details>
      </div>
    },
  });

  return (
    <div className="h-screen w-screen flex">
      {/* Left Panel - Generated Posts Display */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Generated LinkedIn Posts</h1>
            <p className="text-gray-600">Real-time preview of your AI-generated LinkedIn content</p>
          </div>
          
          {state.generatedPosts && state.generatedPosts.length > 0 ? (
            <div className="space-y-6">
              {state.generatedPosts.map((post, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Post metadata header */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">Post #{state.generatedPosts.length - index}</h3>
                        <p className="text-sm text-gray-500">
                          Generated {new Date(post.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">{post.brand}</span> • {post.topic}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actual LinkedIn Post Component */}
                  <div className="p-4">
                    <LinkedInPostCard
                      goal={post.goal}
                      brand={post.brand}
                      topic={post.topic}
                      themeColor={themeColor}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts generated yet</h3>
                <p className="text-gray-500 mb-4">
                  Use the AI assistant on the right to create LinkedIn posts.
                </p>
                <div className="text-sm text-gray-400">
                  Try saying: "Create a LinkedIn post for TechCorp about AI innovation"
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side spacer for sidebar */}
      <div className="w-96"></div>
    </div>
  );
}

// Simplified LinkedIn Post Card component
function LinkedInPostCard({ goal, brand, topic, themeColor }: { 
  goal?: string, 
  brand?: string, 
  topic?: string, 
  themeColor: string 
}) {
  const introText = `Discover how ${brand} is revolutionizing ${topic}. ${goal}`;
  const headline = `Transform Your Business with ${topic}`;
  const website = `${brand?.toLowerCase().replace(/\s+/g, '') || 'example'}.com`;
  const imageText = `${topic} Innovation`;

  // Use default professional image
  const imagePath = '/assets/AdobeStock_122578479.png';

  return (
    <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
      {/* LinkedIn Post Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black flex items-center justify-content-center">
            <div className="w-8 h-8 bg-white flex items-center justify-center text-black font-bold text-sm">
              {brand?.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase() || 'BR'}
            </div>
          </div>
          <div>
            <div className="font-semibold text-gray-900">{brand || 'Brand Name'}</div>
            <div className="text-sm text-gray-500">Promoted</div>
          </div>
        </div>
      </div>
      
      {/* Intro Text */}
      <div className="p-4 border-b border-gray-200">
        <p className="text-gray-900">{introText}</p>
      </div>
      
      {/* Image Section with Default Background */}
      <div className="relative h-64 overflow-hidden">
        <img 
          src={imagePath}
          alt="LinkedIn post background"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDUwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjYjhiOGI4Ii8+Cjx0ZXh0IHg9IjI1MCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZvbnQtd2VpZ2h0PSI2MDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pgo8L3N2Zz4=';
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-lg">
            <span className="text-white text-lg font-semibold text-shadow">
              {imageText}
            </span>
          </div>
        </div>
      </div>
      
      {/* Bottom Section */}
      <div className="p-4 flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">{headline}</h3>
          <p className="text-gray-500 text-sm">{website}</p>
        </div>
        <button 
          style={{ backgroundColor: themeColor }}
          className="ml-4 px-4 py-2 text-white rounded font-medium hover:opacity-90 transition-opacity"
        >
          Learn More
        </button>
      </div>
    </div>
  );
}