"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";

export default function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showArrows, setShowArrows] = useState(false);
  const sliderRef = useRef(null);

  /* ---------------- helpers ---------------- */
  const extractFirstImageFromContent = (htmlContent = "") => {
    const imgRegex = /<img[^>]+src="([^">]+)"/i;
    const match = htmlContent.match(imgRegex);
    return match ? match[1] : null;
  };

  const getDisplayImage = (blog) => {
    if (blog.image) return { src: blog.image, isPlaceholder: false };
    const contentImage = extractFirstImageFromContent(blog.content || "");
    if (contentImage) return { src: contentImage, isPlaceholder: false };
    return { src: "", isPlaceholder: true };
  };

  const limitContentToWords = (htmlContent = "", wordLimit = 22) => {
    const textContent = htmlContent.replace(/<[^>]*>/g, "");
    const words = textContent.trim().split(/\s+/);
    return (
      words.slice(0, wordLimit).join(" ") +
      (words.length > wordLimit ? "..." : "")
    );
  };

  // Helper: create SEO-friendly slug from blog title with full ID
  const createBlogSlug = (title, blogId) => {
    if (!title || !blogId) return blogId || '';
    const titleSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 60);
    return `${titleSlug}-${blogId}`;
  };

  const checkIfArrowsNeeded = () => {
    if (sliderRef.current) {
      setShowArrows(
        sliderRef.current.scrollWidth > sliderRef.current.clientWidth
      );
    }
  };

  /* ---------------- slider controls ---------------- */
  const slideLeft = () => {
    if (!sliderRef.current) return;
    const container = sliderRef.current;
    const cardWidth = container.querySelector('article')?.clientWidth || container.clientWidth;
    const scrollAmount = cardWidth + 24; // 24 is gap-6
    container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    setCurrentSlide((p) => Math.max(0, p - 1));
  };

  const slideRight = () => {
    if (!sliderRef.current) return;
    const container = sliderRef.current;
    const cardWidth = container.querySelector('article')?.clientWidth || container.clientWidth;
    const scrollAmount = cardWidth + 24;
    const maxScroll = container.scrollWidth - container.clientWidth;
    
    if (container.scrollLeft >= maxScroll - 50) {
      container.scrollTo({ left: 0, behavior: "smooth" });
      setCurrentSlide(0);
    } else {
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setCurrentSlide((p) => Math.min(blogs.length - 1, p + 1));
    }
  };

  /* ---------------- data fetch ---------------- */
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch("/api/blog/getAllBlogs");
        const json = await res.json();
        if (res.ok && json.success) {
          const allBlogs = json.blogs || json.data || [];
          const sorted = allBlogs.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setBlogs(sorted);
        } else {
          setError("Failed to fetch blogs");
        }
      } catch {
        setError("Network error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  useEffect(() => {
    checkIfArrowsNeeded();
    window.addEventListener("resize", checkIfArrowsNeeded);
    return () => window.removeEventListener("resize", checkIfArrowsNeeded);
  }, [blogs]);

  /* ---------------- states ---------------- */
  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        ⚠️ Unable to load blogs.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-16 px-4">
        <div className="max-w-7xl mx-auto flex gap-6 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="min-w-[320px] h-96 bg-gray-200 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!blogs.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        📭 No blogs available.
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <section className="py-16 px-4 md:px-12 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-100/40 rounded-full blur-[100px] -z-10"></div>
      
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12 text-center">
        {/* <div className="inline-block mb-4 px-4 py-2 bg-blue-100 rounded-full"> */}
          {/* <span className="text-blue-600 font-semibold text-sm">✨ Latest Updates</span> */}
        {/* </div> */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          Health Blogs{" "}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            & Articles
          </span>
        </h2>
        <p className="text-gray-600 mb-9 max-w-2xl mx-auto">
          Discover expert insights, wellness tips, and the latest health trends
        </p>
      </div>

      {/* Slider */}
      <div className="relative mt-4 max-w-7xl mx-auto">
        {/* Previous Arrow */}
        {blogs.length > 3 && (
          <button
            onClick={slideLeft}
            className={`absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 z-40 bg-white/90 backdrop-blur-sm shadow-xl rounded-full w-12 h-12 flex items-center justify-center transition-all hover:scale-110 border border-white text-blue-600 hover:text-blue-700 ${
              currentSlide === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Next Arrow */}
        {blogs.length > 3 && (
          <button
            onClick={slideRight}
            className={`absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 z-40 bg-white/90 backdrop-blur-sm shadow-xl rounded-full w-12 h-12 flex items-center justify-center text-blue-600 hover:text-blue-700 transition-all hover:scale-110 border border-white ${
              (currentSlide >= blogs.length - 3) && blogs.length > 3 ? 'md:opacity-100' : 'opacity-100'
            }`}
            aria-label="Next slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        <div
          ref={sliderRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-12 pt-4 px-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {blogs.map((blog) => {
            const imageInfo = getDisplayImage(blog);
            return (
              <article
                key={blog._id}
                className="flex-shrink-0 w-[85%] md:w-[calc((100%-48px)/3)] snap-start bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-500 overflow-hidden group border border-gray-100 hover:border-blue-200"
              >
                {/* Image */}
                <div className="relative h-44 bg-gradient-to-br from-blue-100 via-purple-50 to-cyan-100 overflow-hidden">
                  {imageInfo.isPlaceholder ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                      <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">No Image</span>
                    </div>
                  ) : (
                    <img
                      src={imageInfo.src}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="bg-white/95 backdrop-blur-sm text-blue-600 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-md">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      Health
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">Latest Article</span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                    {blog.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {limitContentToWords(blog.content)}
                  </p>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(blog.createdAt).toLocaleDateString()}
                    </div>
                    <Link
                      href={`/blogs/${blog.paramlink || createBlogSlug(blog.title, blog._id)}`}
                      className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1.5 group-hover:gap-2.5 transition-all"
                    >
                      Read
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* View all */}
      <div className="text-center mt-12">
        <Link
          href="/blogs/viewBlogs"
          className="inline-flex items-center gap-2 bg-yellow-400  text-white font-semibold px-8 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
        >
          View All Blogs
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </section>
  );
}