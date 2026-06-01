"use client";
import React from "react";
import { FileText, CheckCircle, ImageIcon, Link as  Hash, Eye, Save } from "lucide-react";

const WriteBlogWorkflowGuide = () => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Write Blog</h1>
            <p className="text-gray-600 mt-1">Create and publish engaging blog posts with rich media content</p>
          </div>
        </div>
      </div>

      {/* Image Section */}
      <div className="w-full bg-purple-50 rounded-xl border border-purple-200 p-6 mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Blog Editor Interface
        </h3>
        <div className="bg-white rounded-lg border-2 border-purple-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '400px', maxHeight: '600px' }}>
          <img 
            src="/blog1.png" 
            alt="Write Blog Editor Screen" 
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement?.querySelector('.placeholder-blog')?.classList.remove('hidden');
            }}
          />
          <div className="placeholder-blog hidden text-center p-8">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-gray-600 font-medium">Image not found: /write-blog.png</p>
            <p className="text-gray-400 text-sm mt-2">Please ensure write-blog.png is in the public folder.</p>
          </div>
        </div>
      </div>

      {/* Detailed Explanation Section */}
      <div className="space-y-8">
        
        {/* 1. Blog Title and URL Slug */}
        <div className="bg-white rounded-xl p-6 border-l-4 border-blue-500 shadow-sm">
          <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5" />
            1. Blog Title and URL Configuration
          </h4>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Start by creating a compelling title and SEO-friendly URL slug for your blog post.
          </p>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl">•</span>
              <div>
                <strong>Title Input:</strong> Enter an attention-grabbing blog title in the large text field at the top. The title appears prominently in search results and social media shares, so make it descriptive and engaging.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl">•</span>
              <div>
                <strong>Auto-Generated URL Slug:</strong> The system automatically creates a URL-friendly slug from your title (e.g., "My Health Tips" becomes "my-health-tips"), ensuring clean, readable URLs for better SEO.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl">•</span>
              <div>
                <strong>Custom Slug Editing:</strong> Manually edit the URL slug if needed to include specific keywords or match your SEO strategy. Changes to the title won't overwrite manual slug edits.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>SEO Best Practices:</strong> Keep titles under 60 characters and slugs concise with relevant keywords for optimal search engine visibility.
              </div>
            </li>
          </ul>
        </div>

        {/* 2. Rich Text Editor with Formatting Toolbar */}
        <div className="bg-white rounded-xl p-6 border-l-4 border-green-500 shadow-sm">
          <h4 className="font-bold text-green-800 mb-4 flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5" />
            2. Rich Text Editor and Content Formatting
          </h4>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Create beautifully formatted content using the comprehensive WYSIWYG editor with floating toolbar.
          </p>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold text-xl">•</span>
              <div>
                <strong>Floating Plus Button:</strong> Access all formatting options through the circular plus button in the top-right corner of the editor. Click to expand the full toolbar with categorized formatting tools.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold text-xl">•</span>
              <div>
                <strong>Text Formatting:</strong> Apply bold, italic, underline, and strikethrough styles to emphasize key points. Use keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U) for faster editing.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold text-xl">•</span>
              <div>
                <strong>Heading Levels:</strong> Structure your content with H1, H2, and H3 headings for better readability and SEO hierarchy. Headings help break up long content into scannable sections.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold text-xl">•</span>
              <div>
                <strong>Text Alignment:</strong> Align text left, center, or right to create visually balanced layouts. Center alignment works well for quotes or call-to-action statements.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold text-xl">•</span>
              <div>
                <strong>Lists and Blockquotes:</strong> Create bulleted lists, numbered lists, and styled blockquotes to organize information and highlight important quotes or testimonials.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Real-time Preview:</strong> See formatting changes instantly as you type. The editor maintains consistent styling across all devices with responsive design.
              </div>
            </li>
          </ul>
        </div>

        {/* 3. Media Integration */}
        <div className="bg-white rounded-xl p-6 border-l-4 border-orange-500 shadow-sm">
          <h4 className="font-bold text-orange-800 mb-4 flex items-center gap-2 text-lg">
            <ImageIcon className="w-5 h-5" />
            3. Media Upload and Embedding
          </h4>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Enhance your blog posts with images, videos, and embedded media to increase engagement.
          </p>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-orange-600 font-bold text-xl">•</span>
              <div>
                <strong>Image Upload:</strong> Click the image icon in the toolbar to upload photos directly from your device. Supported formats include JPG, PNG, GIF, and WebP for optimal web performance.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-orange-600 font-bold text-xl">•</span>
              <div>
                <strong>Video Embedding:</strong> Add videos by uploading files or embedding from platforms like YouTube and Vimeo. Videos increase time-on-page and user engagement significantly.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-orange-600 font-bold text-xl">•</span>
              <div>
                <strong>Link Insertion:</strong> Select text and click the link icon to add hyperlinks to external resources, internal pages, or related blog posts. Links improve SEO and provide additional value to readers.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-orange-600 font-bold text-xl">•</span>
              <div>
                <strong>Media Removal:</strong> Hover over any inserted image or video to reveal a remove button (X icon) in the corner, allowing quick deletion of unwanted media elements.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Responsive Media:</strong> All uploaded images and videos automatically scale to fit different screen sizes, ensuring perfect display on mobile, tablet, and desktop devices.
              </div>
            </li>
          </ul>
        </div>

        {/* 4. Topics and Hashtags */}
        <div className="bg-white rounded-xl p-6 border-l-4 border-purple-500 shadow-sm">
          <h4 className="font-bold text-purple-800 mb-4 flex items-center gap-2 text-lg">
            <Hash className="w-5 h-5" />
            4. Topics and Hashtag Management
          </h4>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Categorize your blog posts with topics and hashtags for better organization and discoverability.
          </p>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-purple-600 font-bold text-xl">•</span>
              <div>
                <strong>Topic Tags:</strong> Add relevant topic tags to categorize your blog post. Topics appear as clickable badges that help readers find related content and improve site navigation.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-600 font-bold text-xl">•</span>
              <div>
                <strong>Hashtag Extraction:</strong> The system automatically extracts hashtags (#health, #wellness) from your content and converts them into topic tags, saving you time during publishing.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-600 font-bold text-xl">•</span>
              <div>
                <strong>Manual Topic Addition:</strong> Type custom topics in the input field and press Enter or click Add to include them. Remove unwanted topics by clicking the X button on each tag.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>SEO Benefits:</strong> Well-chosen topics improve internal linking, help search engines understand your content, and increase the likelihood of appearing in related searches.
              </div>
            </li>
          </ul>
        </div>

        {/* 5. Featured Image */}
        <div className="bg-white rounded-xl p-6 border-l-4 border-pink-500 shadow-sm">
          <h4 className="font-bold text-pink-800 mb-4 flex items-center gap-2 text-lg">
            <ImageIcon className="w-5 h-5" />
            5. Featured Image Setup
          </h4>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Set an eye-catching featured image that represents your blog post in listings and social shares.
          </p>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-pink-600 font-bold text-xl">•</span>
              <div>
                <strong>Image Display:</strong> The featured image appears at the top of your blog post and as the thumbnail in blog listings, social media previews, and search results.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-pink-600 font-bold text-xl">•</span>
              <div>
                <strong>Image Cropping:</strong> Images are automatically cropped to maintain consistent dimensions (128px-176px height) with object-cover scaling, ensuring no white space or distortion.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-pink-600 font-bold text-xl">•</span>
              <div>
                <strong>Remove Featured Image:</strong> Hover over the featured image to reveal a remove button in the top-right corner. Click to delete and replace with a different image.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-pink-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Best Practices:</strong> Use high-quality, relevant images (1200x630px recommended) that capture the essence of your content. Featured images increase click-through rates by up to 94%.
              </div>
            </li>
          </ul>
        </div>

        {/* 6. Preview Mode */}
        <div className="bg-white rounded-xl p-6 border-l-4 border-cyan-500 shadow-sm">
          <h4 className="font-bold text-cyan-800 mb-4 flex items-center gap-2 text-lg">
            <Eye className="w-5 h-5" />
            6. Live Preview Functionality
          </h4>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Preview your blog post before publishing to see exactly how it will appear to readers.
          </p>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-cyan-600 font-bold text-xl">•</span>
              <div>
                <strong>Toggle Preview:</strong> Click the eye icon in the header to open a split-screen preview. The left side shows the editor, while the right side displays a live preview of your formatted content.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-600 font-bold text-xl">•</span>
              <div>
                <strong>Real-time Updates:</strong> Changes made in the editor instantly reflect in the preview panel, allowing you to see formatting, images, and layout adjustments as you make them.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-600 font-bold text-xl">•</span>
              <div>
                <strong>Mobile-Responsive Preview:</strong> The preview shows how your blog will look on different devices, ensuring proper formatting and readability across all screen sizes.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-cyan-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Quality Assurance:</strong> Use preview mode to catch formatting errors, broken links, or missing images before publishing, ensuring a professional final product.
              </div>
            </li>
          </ul>
        </div>

        {/* 7. Auto-Save and Draft Management */}
        <div className="bg-white rounded-xl p-6 border-l-4 border-yellow-500 shadow-sm">
          <h4 className="font-bold text-yellow-800 mb-4 flex items-center gap-2 text-lg">
            <Save className="w-5 h-5" />
            7. Auto-Save and Draft Features
          </h4>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Never lose your work with automatic saving and draft management capabilities.
          </p>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-yellow-600 font-bold text-xl">•</span>
              <div>
                <strong>Automatic Draft Saving:</strong> The system automatically saves your progress every 30 seconds as you type, creating drafts that can be resumed later without losing any content.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-600 font-bold text-xl">•</span>
              <div>
                <strong>Draft Detection:</strong> When you return to the editor, previously saved drafts are automatically loaded, allowing you to continue writing exactly where you left off.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-600 font-bold text-xl">•</span>
              <div>
                <strong>Typing Activity Tracking:</strong> The auto-save system detects when you're actively typing and ensures drafts are only created when there's meaningful content to preserve.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Publish or Save as Draft:</strong> Choose to publish immediately or save as a draft for later review. Drafts remain editable and can be published whenever you're ready.
              </div>
            </li>
          </ul>
        </div>

        {/* 8. Publishing Options */}
        <div className="bg-white rounded-xl p-6 border-l-4 border-red-500 shadow-sm">
          <h4 className="font-bold text-red-800 mb-4 flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5" />
            8. Publishing and Social Sharing
          </h4>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Publish your blog post and share it across social media platforms to maximize reach.
          </p>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold text-xl">•</span>
              <div>
                <strong>Publish Button:</strong> Click the Publish button to make your blog post live and visible to all visitors. The system validates required fields before publishing to prevent incomplete posts.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold text-xl">•</span>
              <div>
                <strong>Social Media Sharing:</strong> After publishing, use the built-in social sharing tools to instantly share your blog on Facebook, Twitter, LinkedIn, and other platforms to drive traffic.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold text-xl">•</span>
              <div>
                <strong>Author Attribution:</strong> Your name is automatically set as the author based on your clinic profile. Readers can see who wrote each post, building credibility and trust.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold text-xl">•</span>
              <div>
                <strong>SEO Optimization:</strong> Published blogs are automatically indexed by search engines with proper meta tags, structured data, and SEO-friendly URLs for maximum visibility.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Content Management:</strong> Access all published blogs from the blog management dashboard where you can edit, delete, or view analytics for each post to track performance.
              </div>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default WriteBlogWorkflowGuide;
