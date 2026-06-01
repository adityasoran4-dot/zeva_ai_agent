"use client";
import React, { useState } from 'react';
import { FileText, PenTool, Image, Send, CheckCircle, AlertCircle, Globe, BarChart3, Clock, Users, Heart } from 'lucide-react';

const WriteBlogGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState("overview");

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header Section */}
      <div className="flex items-center gap-3 mb-8">
        <FileText className="w-10 h-10 text-teal-600" />
        <h2 className="text-3xl font-bold text-gray-900">Write Blog - Content & SEO</h2>
      </div>
      
      <div className="prose max-w-none">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Content Management - Complete Blog Creation Guide</h3>
        <p className="text-base text-gray-600 mb-8 leading-relaxed">
          The Write Blog module enables clinics to create, manage, and publish SEO-optimized blog content 
          to share health information, treatment updates, and clinic news. This comprehensive guide covers 
          the complete blog creation workflow with all features and best practices.
        </p>

        {/* Quick Navigation Tabs */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Quick Navigation - All Sections Explained
          </h4>
          <div className="grid md:grid-cols-3 gap-3">
            {[
              { id: "overview", label: "Overview", icon: FileText },
              { id: "editor", label: "Blog Editor", icon: PenTool },
              { id: "seo", label: "SEO Tools", icon: Globe },
              { id: "media", label: "Media Management", icon: Image },
              { id: "publishing", label: "Publishing Options", icon: Send },
              { id: "analytics", label: "Analytics", icon: BarChart3 },
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  activeSection === section.id
                    ? "border-teal-500 bg-teal-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <section.icon className="w-5 h-5 text-teal-600" />
                  <span className="text-sm font-medium text-gray-900">{section.label}</span>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-semibold mb-2">🎯 Key Features:</p>
            <ul className="list-disc list-inside ml-4 space-y-1 text-xs text-blue-700">
              <li><strong>Rich Text Editor:</strong> Advanced formatting with WYSIWYG interface</li>
              <li><strong>SEO Optimization:</strong> Built-in tools for search engine visibility</li>
              <li><strong>Media Library:</strong> Image upload and management</li>
              <li><strong>Scheduling:</strong> Plan and automate content publishing</li>
              <li><strong>Analytics:</strong> Track performance and engagement</li>
            </ul>
          </div>
        </div>

        {/* Overview Section */}
        {activeSection === "overview" && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
              <h4 className="font-bold text-lg text-blue-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">1</span>
                Blog Module Overview
              </h4>
              <div className="ml-10 space-y-4">
                <p className="text-base text-blue-800 leading-relaxed">
                  The Blog Writing system provides a complete content creation platform for healthcare facilities. 
                  From drafting informative articles to publishing SEO-optimized content, all content marketing 
                  activities are streamlined in one intuitive interface.
                </p>
                
                <div className="bg-white rounded-lg border border-blue-200 p-4">
                  <h5 className="font-semibold text-blue-900 mb-3">Core Capabilities:</h5>
                  <ul className="space-y-2 text-sm text-blue-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span><strong>Content Creation:</strong> Professional rich text editor with advanced formatting tools</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span><strong>SEO Integration:</strong> Real-time optimization suggestions and meta tag management</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span><strong>Media Management:</strong> Drag-and-drop image uploads with alt text support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span><strong>Workflow Control:</strong> Draft, schedule, and publish with version history</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span><strong>Performance Tracking:</strong> Built-in analytics for views, engagement, and SEO rankings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span><strong>Multi-Author Support:</strong> Assign authors and manage contributor permissions</span>
                    </li>
                  </ul>
                </div>

                {/* Screenshot Upload Area */}
                <div className="mt-6 bg-white rounded-lg border-2 border-dashed border-blue-300 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h5 className="font-semibold text-blue-900 text-base">Screenshot Upload Area</h5>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-8 text-center border-2 border-dashed border-blue-200">
                    <p className="text-blue-700 text-sm mb-2"><strong>Upload:</strong> /write-blog-overview.png</p>
                    <p className="text-blue-600 text-xs">Drag & drop or click to upload screenshot of main blog creation interface showing all sections</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Use Cases */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-6 rounded-r-lg">
              <h4 className="font-bold text-lg text-green-900 mb-4 flex items-center gap-2">
                <Heart className="w-6 h-6" />
                Common Blog Use Cases
              </h4>
              <div className="ml-10 space-y-3">
                <ul className="list-disc list-inside space-y-2 text-base text-green-700">
                  <li><strong>Health Education:</strong> Explain medical conditions, treatments, and prevention tips</li>
                  <li><strong>Clinic Updates:</strong> Announce new services, staff members, or facility improvements</li>
                  <li><strong>Seasonal Health Tips:</strong> Flu season advice, summer safety, allergy management</li>
                  <li><strong>Patient Success Stories:</strong> Share testimonials and case studies (with consent)</li>
                  <li><strong>FAQ Articles:</strong> Answer common patient questions and debunk myths</li>
                  <li><strong>Procedure Guides:</strong> Step-by-step explanations of treatments</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Blog Editor Section */}
        {activeSection === "editor" && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 p-6 rounded-r-lg">
              <h4 className="font-bold text-lg text-purple-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full text-sm font-bold">2</span>
                Rich Text Editor Interface
              </h4>
              <div className="ml-10 space-y-4">
                <p className="text-base text-purple-800 leading-relaxed">
                  The heart of the blog creation system is the advanced rich text editor. 
                  It provides a WYSIWYG (What You See Is What You Get) interface with professional formatting tools.
                </p>
                
                <div className="bg-white rounded-lg border border-purple-200 p-4">
                  <h5 className="font-semibold text-purple-900 mb-3">Editor Layout Components:</h5>
                  
                  <div className="space-y-4">
                    <div>
                      <h6 className="font-semibold text-purple-800 mb-2">1. Title Section (Top)</h6>
                      <ul className="list-disc list-inside ml-5 space-y-1 text-sm text-purple-700">
                        <li><strong>Main Title Field:</strong> Large input for blog post title</li>
                        <li><strong>Character Counter:</strong> Shows title length (recommended: 50-60 chars)</li>
                        <li><strong>Auto-save Indicator:</strong> Displays draft status</li>
                      </ul>
                    </div>

                    <div>
                      <h6 className="font-semibold text-purple-800 mb-2">2. Formatting Toolbar</h6>
                      <ul className="list-disc list-inside ml-5 space-y-1 text-sm text-purple-700">
                        <li><strong>Text Formatting:</strong> Bold, Italic, Underline, Strikethrough</li>
                        <li><strong>Headings:</strong> H1, H2, H3, H4, H5, H6 dropdown</li>
                        <li><strong>Alignment:</strong> Left, Center, Right, Justify</li>
                        <li><strong>Lists:</strong> Bullet points, Numbered lists, Indentation</li>
                        <li><strong>Colors:</strong> Text color, Background highlight</li>
                        <li><strong>Insert:</strong> Links, Images, Videos, Tables, Horizontal rules</li>
                        <li><strong>Tools:</strong> Undo/Redo, Remove formatting, Fullscreen mode</li>
                      </ul>
                    </div>

                    <div>
                      <h6 className="font-semibold text-purple-800 mb-2">3. Main Content Area</h6>
                      <ul className="list-disc list-inside ml-5 space-y-1 text-sm text-purple-700">
                        <li><strong>Writing Space:</strong> Large editable area for blog content</li>
                        <li><strong>Spell Check:</strong> Real-time grammar and spelling correction</li>
                        <li><strong>Word Count:</strong> Live counter showing total words</li>
                        <li><strong>Readability Score:</strong> Flesch-Kincaid grade level indicator</li>
                      </ul>
                    </div>

                    <div>
                      <h6 className="font-semibold text-purple-800 mb-2">4. Excerpt/Summary Field</h6>
                      <ul className="list-disc list-inside ml-5 space-y-1 text-sm text-purple-700">
                        <li><strong>Brief Summary:</strong> 2-3 sentence overview of blog post</li>
                        <li><strong>Meta Description:</strong> Used for search engine results</li>
                        <li><strong>Character Limit:</strong> 150-160 characters recommended</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h5 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Best Practices:
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-sm text-purple-700">
                    <li>Use H2 for main sections and H3 for subsections</li>
                    <li>Keep paragraphs short (2-3 sentences for readability)</li>
                    <li>Include bullet points and lists to break up text</li>
                    <li>Add internal links to related services and blog posts</li>
                    <li>Use bold text sparingly to emphasize key points</li>
                    <li>Maintain consistent tone and voice throughout</li>
                  </ul>
                </div>

                {/* Screenshot Upload */}
                <div className="mt-6 bg-white rounded-lg border-2 border-dashed border-purple-300 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h5 className="font-semibold text-purple-900 text-base">Screenshot Upload Area</h5>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-8 text-center border-2 border-dashed border-purple-200">
                    <p className="text-purple-700 text-sm mb-2"><strong>Upload:</strong> /blog-editor-interface.png</p>
                    <p className="text-purple-600 text-xs">Drag & drop or click to upload screenshot of rich text editor with toolbar and content area</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEO Tools Section */}
        {activeSection === "seo" && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-l-4 border-cyan-500 p-6 rounded-r-lg">
              <h4 className="font-bold text-lg text-cyan-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-cyan-600 text-white rounded-full text-sm font-bold">3</span>
                SEO Optimization Panel
              </h4>
              <div className="ml-10 space-y-4">
                <p className="text-base text-cyan-800 leading-relaxed">
                  The integrated SEO tools help optimize your blog content for search engines, 
                  improving visibility and driving organic traffic to your clinic's website.
                </p>
                
                <div className="bg-white rounded-lg border border-cyan-200 p-4">
                  <h5 className="font-semibold text-cyan-900 mb-3">SEO Fields Explained:</h5>
                  
                  <div className="space-y-4">
                    <div>
                      <h6 className="font-semibold text-cyan-800 mb-2">1. Focus Keyword</h6>
                      <ul className="list-disc list-inside ml-5 space-y-1 text-sm text-cyan-700">
                        <li><strong>Primary Search Term:</strong> Main keyword you want to rank for</li>
                        <li><strong>Keyword Analysis:</strong> System checks usage throughout content</li>
                        <li><strong>Density Indicator:</strong> Shows if keyword appears 1-2% of total words</li>
                        <li><strong>Example:</strong> "dental implants", "teeth whitening", "cardiologist near me"</li>
                      </ul>
                    </div>

                    <div>
                      <h6 className="font-semibold text-cyan-800 mb-2">2. Meta Title</h6>
                      <ul className="list-disc list-inside ml-5 space-y-1 text-sm text-cyan-700">
                        <li><strong>Search Engine Title:</strong> Appears in Google search results</li>
                        <li><strong>Optimal Length:</strong> 50-60 characters (including spaces)</li>
                        <li><strong>Preview:</strong> Shows how it looks in SERPs</li>
                        <li><strong>Best Practice:</strong> Include focus keyword near beginning</li>
                      </ul>
                    </div>

                    <div>
                      <h6 className="font-semibold text-cyan-800 mb-2">3. Meta Description</h6>
                      <ul className="list-disc list-inside ml-5 space-y-1 text-sm text-cyan-700">
                        <li><strong>Search Summary:</strong> Brief description under title in search results</li>
                        <li><strong>Character Limit:</strong> 150-160 characters</li>
                        <li><strong>Call-to-Action:</strong> Encourage clicks with compelling copy</li>
                        <li><strong>Keyword Inclusion:</strong> Naturally incorporate focus keyword</li>
                      </ul>
                    </div>

                    <div>
                      <h6 className="font-semibold text-cyan-800 mb-2">4. URL Slug</h6>
                      <ul className="list-disc list-inside ml-5 space-y-1 text-sm text-cyan-700">
                        <li><strong>Custom URL:</strong> Web address for this blog post</li>
                        <li><strong>Format:</strong> yourclinic.com/blog/{`[your-slug-here]`}</li>
                        <li><strong>Best Practice:</strong> Short, descriptive, includes keyword</li>
                        <li><strong>Example:</strong> /benefits-of-dental-implants</li>
                      </ul>
                    </div>

                    <div>
                      <h6 className="font-semibold text-cyan-800 mb-2">5. SEO Score Dashboard</h6>
                      <ul className="list-disc list-inside ml-5 space-y-1 text-sm text-cyan-700">
                        <li><strong>Real-Time Analysis:</strong> Color-coded score (0-100)</li>
                        <li><strong>Green (80-100):</strong> Excellent optimization</li>
                        <li><strong>Yellow (50-79):</strong> Needs improvement</li>
                        <li><strong>Red (0-49):</strong> Poor optimization</li>
                        <li><strong>Action Items:</strong> Specific recommendations to improve score</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                  <h5 className="font-semibold text-cyan-900 mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    SEO Checklist:
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-sm text-cyan-700">
                    <li>✓ Focus keyword in title</li>
                    <li>✓ Focus keyword in first paragraph</li>
                    <li>✓ Focus keyword in at least one H2 heading</li>
                    <li>✓ Focus keyword appears 2-5 times in content</li>
                    <li>✓ Meta title includes keyword and is under 60 chars</li>
                    <li>✓ Meta description is compelling and under 160 chars</li>
                    <li>✓ URL slug is short and includes keyword</li>
                    <li>✓ At least 2-3 internal links to service pages</li>
                    <li>✓ Images have alt text with keywords</li>
                    <li>✓ Content is 800+ words for comprehensive coverage</li>
                  </ul>
                </div>

                {/* Screenshot Upload */}
                <div className="mt-6 bg-white rounded-lg border-2 border-dashed border-cyan-300 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h5 className="font-semibold text-cyan-900 text-base">Screenshot Upload Area</h5>
                  </div>
                  <div className="bg-cyan-50 rounded-lg p-8 text-center border-2 border-dashed border-cyan-200">
                    <p className="text-cyan-700 text-sm mb-2"><strong>Upload:</strong> /blog-seo-panel.png</p>
                    <p className="text-cyan-600 text-xs">Drag & drop or click to upload screenshot of SEO optimization panel with all fields</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Media Management Section */}
        {activeSection === "media" && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 p-6 rounded-r-lg">
              <h4 className="font-bold text-lg text-orange-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-orange-600 text-white rounded-full text-sm font-bold">4</span>
                Media Management System
              </h4>
              <div className="ml-10 space-y-4">
                <p className="text-base text-orange-800 leading-relaxed">
                  The media library allows you to upload, organize, and insert images into your blog posts. 
                  Proper image optimization improves page load speed and accessibility.
                </p>
                
                <div className="bg-white rounded-lg border border-orange-200 p-4">
                  <h5 className="font-semibold text-orange-900 mb-3">Media Features:</h5>
                  
                  <div className="space-y-4">
                    <div>
                      <h6 className="font-semibold text-orange-800 mb-2">1. Featured Image Upload</h6>
                      <ul className="list-disc list-inside ml-5 space-y-1 text-sm text-orange-700">
                        <li><strong>Main Visual:</strong> Primary image representing the blog post</li>
                        <li><strong>Display Locations:</strong> Blog listing page, social media shares, email newsletters</li>
                        <li><strong>Recommended Size:</strong> 1200x630 pixels (minimum 600x315)</li>
                        <li><strong>Aspect Ratio:</strong> 1.91:1 (Facebook/Twitter standard)</li>
                        <li><strong>File Formats:</strong> JPG for photos, PNG for graphics with transparency</li>
                        <li><strong>File Size:</strong> Optimized under 200KB for fast loading</li>
                      </ul>
                    </div>

                    <div>
                      <h6 className="font-semibold text-orange-800 mb-2">2. In-Content Images</h6>
                      <ul className="list-disc list-inside ml-5 space-y-1 text-sm text-orange-700">
                        <li><strong>Multiple Uploads:</strong> Add unlimited images within blog content</li>
                        <li><strong>Drag-and-Drop:</strong> Easy positioning in the editor</li>
                        <li><strong>Image Gallery:</strong> Create grid layouts and carousels</li>
                        <li><strong>Captions:</strong> Add descriptive text below images</li>
                        <li><strong>Alignment:</strong> Left, center, right, or full-width</li>
                        <li><strong>Responsive:</strong> Auto-resize for mobile devices</li>
                      </ul>
                    </div>

                    <div>
                      <h6 className="font-semibold text-orange-800 mb-2">3. Image Optimization Tools</h6>
                      <ul className="list-disc list-inside ml-5 space-y-1 text-sm text-orange-700">
                        <li><strong>Alt Text:</strong> Descriptive text for accessibility and SEO</li>
                        <li><strong>Title Attribute:</strong> Tooltip text on hover</li>
                        <li><strong>Lazy Loading:</strong> Images load as user scrolls</li>
                        <li><strong>Auto-Compression:</strong> System optimizes file size automatically</li>
                        <li><strong>CDN Delivery:</strong> Fast image serving via content delivery network</li>
                      </ul>
                    </div>

                    <div>
                      <h6 className="font-semibold text-orange-800 mb-2">4. Video Embedding</h6>
                      <ul className="list-disc list-inside ml-5 space-y-1 text-sm text-orange-700">
                        <li><strong>Supported Platforms:</strong> YouTube, Vimeo, Wistia</li>
                        <li><strong>Embed Method:</strong> Paste video URL directly into editor</li>
                        <li><strong>Responsive Player:</strong> Adapts to screen size</li>
                        <li><strong>Autoplay Settings:</strong> Configure play behavior</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h5 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Image Best Practices:
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-sm text-orange-700">
                    <li>Use high-quality, relevant images that enhance content</li>
                    <li>Always add descriptive alt text (include keywords naturally)</li>
                    <li>Compress images before upload for faster page loads</li>
                    <li>Use original photos when possible (avoid generic stock images)</li>
                    <li>Ensure proper lighting and composition</li>
                    <li>Include people in images when appropriate (builds connection)</li>
                    <li>Maintain consistent visual style across all blogs</li>
                  </ul>
                </div>

                {/* Screenshot Upload */}
                <div className="mt-6 bg-white rounded-lg border-2 border-dashed border-orange-300 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h5 className="font-semibold text-orange-900 text-base">Screenshot Upload Area</h5>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-8 text-center border-2 border-dashed border-orange-200">
                    <p className="text-orange-700 text-sm mb-2"><strong>Upload:</strong> /blog-media-library.png</p>
                    <p className="text-orange-600 text-xs">Drag & drop or click to upload screenshot of media upload interface with featured image and gallery</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Publishing Options Section */}
        {activeSection === "publishing" && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-teal-50 to-green-50 border-l-4 border-teal-500 p-6 rounded-r-lg">
              <h4 className="font-bold text-lg text-teal-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-teal-600 text-white rounded-full text-sm font-bold">5</span>
                Publishing & Scheduling
              </h4>
              <div className="ml-10 space-y-4">
                <p className="text-base text-teal-800 leading-relaxed">
                  The publishing panel provides flexible options for making your blog live, 
                  including immediate publication, scheduled posting, and draft management.
                </p>
                
                <div className="bg-white rounded-lg border border-teal-200 p-4">
                  <h5 className="font-semibold text-teal-900 mb-3">Publishing Options Explained:</h5>
                  
                  <div className="space-y-4">
                    <div>
                      <h6 className="font-semibold text-teal-800 mb-2">1. Save as Draft</h6>
                      <ul className="list-disc list-inside ml-5 space-y-1 text-sm text-teal-700">
                        <li><strong>Work in Progress:</strong> Save without publishing</li>
                        <li><strong>Auto-Save:</strong> System saves every 30 seconds automatically</li>
                        <li><strong>Private:</strong> Only visible to authorized users</li>
                        <li><strong>Edit Anytime:</strong> Return to complete later</li>
                        <li><strong>Version History:</strong> Track changes over time</li>
                      </ul>
                    </div>

                    <div>
                      <h6 className="font-semibold text-teal-800 mb-2">2. Preview Mode</h6>
                      <ul className="list-disc list-inside ml-5 space-y-1 text-sm text-teal-700">
                        <li><strong>Live Preview:</strong> See exactly how blog will appear</li>
                        <li><strong>New Tab:</strong> Opens in separate browser tab</li>
                        <li><strong>Responsive Views:</strong> Desktop, tablet, and mobile previews</li>
                        <li><strong>Shareable Link:</strong> Send preview URL to colleagues</li>
                        <li><strong>Edit from Preview:</strong> Return to editing mode easily</li>
                      </ul>
                    </div>

                    <div>
                      <h6 className="font-semibold text-teal-800 mb-2">3. Publish Immediately</h6>
                      <ul className="list-disc list-inside ml-5 space-y-1 text-sm text-teal-700">
                        <li><strong>Instant Go-Live:</strong> Blog appears on website immediately</li>
                        <li><strong>Public Visibility:</strong> Accessible to all website visitors</li>
                        <li><strong>Search Indexing:</strong> Submitted to search engines</li>
                        <li><strong>Social Sharing:</strong> Auto-post to connected social accounts</li>
                        <li><strong>Email Notification:</strong> Subscribers alerted to new content</li>
                      </ul>
                    </div>

                    <div>
                      <h6 className="font-semibold text-teal-800 mb-2">4. Schedule for Later</h6>
                      <ul className="list-disc list-inside ml-5 space-y-1 text-sm text-teal-700">
                        <li><strong>Calendar Picker:</strong> Select future publish date</li>
                        <li><strong>Time Selection:</strong> Choose specific publish time</li>
                        <li><strong>Timezone:</strong> Auto-detects or manual selection</li>
                        <li><strong>Automated Publishing:</strong> No manual intervention needed</li>
                        <li><strong>Schedule Management:</strong> View/edit scheduled posts calendar</li>
                        <li><strong>Batch Scheduling:</strong> Plan content weeks in advance</li>
                      </ul>
                    </div>

                    <div>
                      <h6 className="font-semibold text-teal-800 mb-2">5. Author & Categories</h6>
                      <ul className="list-disc list-inside ml-5 space-y-1 text-sm text-teal-700">
                        <li><strong>Author Attribution:</strong> Select blog author from dropdown</li>
                        <li><strong>Category Assignment:</strong> Choose primary category</li>
                        <li><strong>Tags:</strong> Add multiple relevant tags</li>
                        <li><strong>Series:</strong> Group related posts together</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                  <h5 className="font-semibold text-teal-900 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Optimal Publishing Times:
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-sm text-teal-700">
                    <li>Tuesday-Thursday: 9-11 AM (highest engagement)</li>
                    <li>Avoid weekends for professional/medical content</li>
                    <li>Early morning (7-8 AM) for health tips</li>
                    <li>Lunch hours (12-1 PM) for general wellness</li>
                    <li>Consistency matters more than perfect timing</li>
                  </ul>
                </div>

                {/* Screenshot Upload */}
                <div className="mt-6 bg-white rounded-lg border-2 border-dashed border-teal-300 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h5 className="font-semibold text-teal-900 text-base">Screenshot Upload Area</h5>
                  </div>
                  <div className="bg-teal-50 rounded-lg p-8 text-center border-2 border-dashed border-teal-200">
                    <p className="text-teal-700 text-sm mb-2"><strong>Upload:</strong> /blog-publishing-panel.png</p>
                    <p className="text-teal-600 text-xs">Drag & drop or click to upload screenshot of publish/schedule options with calendar picker</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Section */}
        {activeSection === "analytics" && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 p-6 rounded-r-lg">
              <h4 className="font-bold text-lg text-indigo-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-indigo-600 text-white rounded-full text-sm font-bold">6</span>
                Performance Analytics
              </h4>
              <div className="ml-10 space-y-4">
                <p className="text-base text-indigo-800 leading-relaxed">
                  Track your blog's performance with comprehensive analytics dashboard showing 
                  traffic, engagement, and SEO metrics to measure content success.
                </p>
                
                <div className="bg-white rounded-lg border border-indigo-200 p-4">
                  <h5 className="font-semibold text-indigo-900 mb-3">Analytics Dashboard Metrics:</h5>
                  
                  <div className="space-y-4">
                    <div>
                      <h6 className="font-semibold text-indigo-800 mb-2">1. Traffic Metrics</h6>
                      <ul className="list-disc list-inside ml-5 space-y-1 text-sm text-indigo-700">
                        <li><strong>Page Views:</strong> Total number of times blog was viewed</li>
                        <li><strong>Unique Visitors:</strong> Individual people who read the post</li>
                        <li><strong>Traffic Sources:</strong> Where visitors came from (Google, social, direct)</li>
                        <li><strong>Referral Sites:</strong> Websites that linked to your blog</li>
                        <li><strong>Geographic Data:</strong> Visitor locations by city/country</li>
                      </ul>
                    </div>

                    <div>
                      <h6 className="font-semibold text-indigo-800 mb-2">2. Engagement Metrics</h6>
                      <ul className="list-disc list-inside ml-5 space-y-1 text-sm text-indigo-700">
                        <li><strong>Average Time on Page:</strong> How long visitors stay</li>
                        <li><strong>Bounce Rate:</strong> Percentage who leave without action</li>
                        <li><strong>Scroll Depth:</strong> How far down page visitors read</li>
                        <li><strong>Social Shares:</strong> Facebook, Twitter, LinkedIn shares count</li>
                        <li><strong>Comments:</strong> Number of reader comments and responses</li>
                        <li><strong>Click-Through Rate:</strong> CTA button clicks</li>
                      </ul>
                    </div>

                    <div>
                      <h6 className="font-semibold text-indigo-800 mb-2">3. SEO Performance</h6>
                      <ul className="list-disc list-inside ml-5 space-y-1 text-sm text-indigo-700">
                        <li><strong>Search Rankings:</strong> Position for target keywords</li>
                        <li><strong>Organic Traffic:</strong> Visitors from search engines</li>
                        <li><strong>Impressions:</strong> How often shown in search results</li>
                        <li><strong>Click-Through from SERPs:</strong> Search result clicks</li>
                        <li><strong>Backlinks:</strong> Other sites linking to your content</li>
                        <li><strong>Domain Authority Impact:</strong> SEO score contribution</li>
                      </ul>
                    </div>

                    <div>
                      <h6 className="font-semibold text-indigo-800 mb-2">4. Conversion Tracking</h6>
                      <ul className="list-disc list-inside ml-5 space-y-1 text-sm text-indigo-700">
                        <li><strong>Appointment Requests:</strong> Bookings from blog CTA</li>
                        <li><strong>Contact Form Submissions:</strong> Inquiry forms filled</li>
                        <li><strong>Phone Calls:</strong> Click-to-call button taps</li>
                        <li><strong>Email Signups:</strong> Newsletter subscriptions</li>
                        <li><strong>Service Page Visits:</strong> Clicks to service pages</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                  <h5 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Understanding Your Audience:
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-sm text-indigo-700">
                    <li>Track which topics resonate most with readers</li>
                    <li>Identify peak reading times and days</li>
                    <li>Understand device preferences (mobile vs desktop)</li>
                    <li>Monitor returning visitor rate</li>
                    <li>Analyze which CTAs perform best</li>
                  </ul>
                </div>

                {/* Screenshot Upload */}
                <div className="mt-6 bg-white rounded-lg border-2 border-dashed border-indigo-300 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h5 className="font-semibold text-indigo-900 text-base">Screenshot Upload Area</h5>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-8 text-center border-2 border-dashed border-indigo-200">
                    <p className="text-indigo-700 text-sm mb-2"><strong>Upload:</strong> /blog-analytics-dashboard.png</p>
                    <p className="text-indigo-600 text-xs">Drag & drop or click to upload screenshot of analytics dashboard with charts and metrics</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complete Workflow Section */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-l-4 border-slate-500 p-6 rounded-r-lg mt-8">
          <h4 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6" />
            Complete Blog Creation Workflow - Step by Step
          </h4>
          <div className="ml-10 space-y-3">
            <ol className="list-decimal list-inside space-y-3 text-base text-slate-700">
              <li><strong>Access Blog Module:</strong> Navigate to Content & SEO → Write Blog</li>
              <li><strong>Enter Compelling Title:</strong> Create SEO-friendly, attention-grabbing headline</li>
              <li><strong>Write Excerpt:</strong> Craft 2-3 sentence summary for meta description</li>
              <li><strong>Select Focus Keyword:</strong> Choose primary search term to target</li>
              <li><strong>Create Content:</strong> Write blog post using rich text editor with proper headings</li>
              <li><strong>Add Media:</strong> Upload featured image and insert in-content images/videos</li>
              <li><strong>Optimize SEO:</strong> Complete meta title, description, and URL slug</li>
              <li><strong>Assign Categories & Tags:</strong> Organize content for navigation and search</li>
              <li><strong>Internal Linking:</strong> Add 2-5 links to related service pages and blogs</li>
              <li><strong>Preview:</strong> Review appearance on desktop, tablet, and mobile</li>
              <li><strong>Choose Publishing Option:</strong> Publish now, schedule for later, or save as draft</li>
              <li><strong>Monitor Performance:</strong> Track analytics and engagement after publishing</li>
            </ol>
          </div>
        </div>

        {/* Integration Note */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-6 rounded-r-lg mt-8">
          <h4 className="font-bold text-lg text-green-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6" />
            How Blogs Integrate with Other ZEVA Modules
          </h4>
          <div className="ml-10 space-y-3">
            <p className="text-base text-green-800 leading-relaxed">
              Blog content connects seamlessly with various clinic management features:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-green-700">
              <li><strong>Services:</strong> Link blog posts to specific treatment pages</li>
              <li><strong>Appointments:</strong> Include booking CTAs within blog content</li>
              <li><strong>Doctors:</strong> Attribute posts to specific practitioners</li>
              <li><strong>Social Media:</strong> Auto-share published blogs to platforms</li>
              <li><strong>Email Marketing:</strong> Feature blogs in newsletter campaigns</li>
              <li><strong>SEO:</strong> Improve overall site search rankings</li>
              <li><strong>Analytics:</strong> Unified reporting across all modules</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WriteBlogGuide;
