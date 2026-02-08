'use client'

import { useState, FormEvent, ChangeEvent, useEffect } from 'react'
import axios from 'axios'

interface GenerateResult {
  success: boolean
  message: string
  filename: string
  slides_count?: number
  total_slides?: number
  chapters_detected?: number
  timestamp?: string
}

interface RecentPresentation {
  id: string
  filename: string
  title: string
  slides: number
  template: string
  timestamp: string
}

// PowerPoint-style template designs
const PRESENTATION_TEMPLATES = [
  {
    id: 'executive',
    name: 'Executive Brief',
    preview: '/api/placeholder/300/200',
    description: 'Clean, corporate design for business presentations',
    colors: ['#1e40af', '#ffffff', '#f3f4f6'],
    icon: '📊'
  },
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    preview: '/api/placeholder/300/200',
    description: 'Sleek and contemporary with bold typography',
    colors: ['#000000', '#ffffff', '#3b82f6'],
    icon: '🎯'
  },
  {
    id: 'vibrant-creative',
    name: 'Vibrant Creative',
    preview: '/api/placeholder/300/200',
    description: 'Colorful and energetic for creative projects',
    colors: ['#ec4899', '#8b5cf6', '#f59e0b'],
    icon: '🎨'
  },
  {
    id: 'academic',
    name: 'Academic Pro',
    preview: '/api/placeholder/300/200',
    description: 'Professional layout for educational content',
    colors: ['#047857', '#ffffff', '#d1fae5'],
    icon: '📚'
  },
  {
    id: 'tech-startup',
    name: 'Tech Startup',
    preview: '/api/placeholder/300/200',
    description: 'Bold gradients perfect for tech presentations',
    colors: ['#6366f1', '#ec4899', '#14b8a6'],
    icon: '🚀'
  },
  {
    id: 'elegant-dark',
    name: 'Elegant Dark',
    preview: '/api/placeholder/300/200',
    description: 'Sophisticated dark theme with gold accents',
    colors: ['#1f2937', '#f59e0b', '#ffffff'],
    icon: '✨'
  },
  {
    id: 'detailed-brief',
    name: 'Detailed Brief',
    preview: '/api/placeholder/300/200',
    description: 'Comprehensive overview with detailed topic information',
    colors: ['#0891b2', '#06b6d4', '#ffffff'],
    icon: '📋'
  }
]

const COLOR_SCHEMES = [
  { id: 'ocean', name: 'Ocean Blue', primary: '#0ea5e9', secondary: '#06b6d4', accent: '#3b82f6' },
  { id: 'forest', name: 'Forest Green', primary: '#10b981', secondary: '#059669', accent: '#34d399' },
  { id: 'sunset', name: 'Sunset Orange', primary: '#f97316', secondary: '#ea580c', accent: '#fb923c' },
  { id: 'royal', name: 'Royal Purple', primary: '#9333ea', secondary: '#7c3aed', accent: '#a855f7' },
  { id: 'rose', name: 'Rose Pink', primary: '#ec4899', secondary: '#db2777', accent: '#f472b6' },
  { id: 'amber', name: 'Amber Gold', primary: '#f59e0b', secondary: '#d97706', accent: '#fbbf24' },
  { id: 'teal', name: 'Teal Aqua', primary: '#14b8a6', secondary: '#0d9488', accent: '#2dd4bf' },
  { id: 'crimson', name: 'Crimson Red', primary: '#dc2626', secondary: '#b91c1c', accent: '#ef4444' },
  { id: 'slate', name: 'Slate Gray', primary: '#475569', secondary: '#334155', accent: '#64748b' },
  { id: 'violet', name: 'Deep Violet', primary: '#7c3aed', secondary: '#6d28d9', accent: '#8b5cf6' }
]

const MOTIVATIONAL_MESSAGES = [
  "🎨 Crafting your masterpiece...",
  "✨ Bringing your ideas to life...",
  "🚀 Building something amazing...",
  "💡 Your presentation is taking shape...",
  "🎯 Perfecting every detail...",
  "🌟 Creating visual magic...",
  "📊 Assembling brilliant slides...",
  "🎪 Making it spectacular..."
]
export default function Home() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeSection, setActiveSection] = useState<'create' | 'templates' | 'history'>('create')
  const [inputMode, setInputMode] = useState<'topic' | 'pdf'>('topic')
  
  // Form states
  const [topic, setTopic] = useState<string>('')
  const [numSlides, setNumSlides] = useState<number>(10)
  const [file, setFile] = useState<File | null>(null)
  const [slidesPerChapter, setSlidesPerChapter] = useState<number>(10)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('executive')
  const [selectedColorScheme, setSelectedColorScheme] = useState<string>('ocean')
  const [customPrompt, setCustomPrompt] = useState<string>('')
  const [generatePDF, setGeneratePDF] = useState<boolean>(false)
  const [generateImages, setGenerateImages] = useState<boolean>(false)
  
  // UI states
  const [loading, setLoading] = useState<boolean>(false)
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [motivationalMessage, setMotivationalMessage] = useState<string>('')
  const [progress, setProgress] = useState<number>(0)
  const [showNotification, setShowNotification] = useState<boolean>(false)
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [showUpgrade, setShowUpgrade] = useState<boolean>(false)
  
  // Settings states
  const [settings, setSettings] = useState({
    autoSave: true,
    notifications: true,
    defaultTemplate: 'executive',
    defaultColorScheme: 'ocean',
    aiQuality: 'high'
  })
  
  // Recent presentations
  const [recentPresentations, setRecentPresentations] = useState<RecentPresentation[]>([])

  const API_URL = 'http://127.0.0.1:8000/api'

  // Load recent presentations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentPresentations')
    if (saved) {
      setRecentPresentations(JSON.parse(saved))
    }
  }, [])

  // Animate motivational messages during generation
  useEffect(() => {
    if (loading) {
      let messageIndex = 0
      const messageInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % MOTIVATIONAL_MESSAGES.length
        setMotivationalMessage(MOTIVATIONAL_MESSAGES[messageIndex])
      }, 2000)

      let currentProgress = 0
      const progressInterval = setInterval(() => {
        currentProgress += Math.random() * 15
        if (currentProgress > 95) currentProgress = 95
        setProgress(currentProgress)
      }, 500)

      return () => {
        clearInterval(messageInterval)
        clearInterval(progressInterval)
      }
    } else {
      setProgress(0)
    }
  }, [loading])

  // Show notification when presentation is ready
  useEffect(() => {
    if (result && !loading) {
      setProgress(100)
      setShowNotification(true)
      
      // Add to recent presentations
      const newPresentation: RecentPresentation = {
        id: Date.now().toString(),
        filename: result.filename,
        title: inputMode === 'topic' ? topic : file?.name || 'PDF Presentation',
        slides: result.slides_count || result.total_slides || 0,
        template: selectedTemplate,
        timestamp: new Date().toISOString()
      }
      
      const updated = [newPresentation, ...recentPresentations].slice(0, 10)
      setRecentPresentations(updated)
      localStorage.setItem('recentPresentations', JSON.stringify(updated))
      
      const timer = setTimeout(() => {
        setShowNotification(false)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [result, loading])

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    setMotivationalMessage(MOTIVATIONAL_MESSAGES[0])

    try {
      const formData = new FormData()
      
      if (inputMode === 'topic') {
        formData.append('topic', topic)
        formData.append('num_slides', numSlides.toString())
      } else {
        if (file) formData.append('file', file)
        formData.append('slides_per_chapter', slidesPerChapter.toString())
      }

      formData.append('template', selectedTemplate)
      formData.append('color_scheme', selectedColorScheme)
      if (customPrompt) formData.append('custom_prompt', customPrompt)

      const endpoint = inputMode === 'topic' ? '/generate-from-topic' : '/generate-from-pdf'
      const response = await axios.post<GenerateResult>(`${API_URL}${endpoint}`, formData)
      
      setResult(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate presentation')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (filename?: string) => {
    const downloadFilename = filename || result?.filename
    if (downloadFilename) {
      window.open(`${API_URL}/download/${downloadFilename}`, '_blank')
    }
  }

  const handleDeleteRecent = (id: string) => {
    const updated = recentPresentations.filter(p => p.id !== id)
    setRecentPresentations(updated)
    localStorage.setItem('recentPresentations', JSON.stringify(updated))
  }

  const handleClearHistory = () => {
    setRecentPresentations([])
    localStorage.removeItem('recentPresentations')
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden font-['Satoshi',sans-serif]">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col ${sidebarCollapsed ? 'w-20' : 'w-72'}`}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                EduSlide
              </h1>
              <p className="text-xs text-slate-500 mt-1">AI Presentation Studio</p>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className={`w-5 h-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveSection('create')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeSection === 'create'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {!sidebarCollapsed && <span className="font-medium">Create New</span>}
          </button>

          <button
            onClick={() => setActiveSection('templates')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeSection === 'templates'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
            </svg>
            {!sidebarCollapsed && <span className="font-medium">Templates</span>}
          </button>

          <button
            onClick={() => setActiveSection('history')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeSection === 'history'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {!sidebarCollapsed && <span className="font-medium">Recent</span>}
          </button>
        </nav>

        {/* Footer */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-slate-200">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
              <p className="text-xs font-semibold text-slate-700 mb-1">💎 Pro Features</p>
              <p className="text-xs text-slate-600">Unlock advanced templates & AI features</p>
              <button 
                onClick={() => setShowUpgrade(true)}
                className="mt-3 w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs py-2 rounded-lg font-medium hover:shadow-lg transition-shadow"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-10">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {activeSection === 'create' && 'Create Presentation'}
                {activeSection === 'templates' && 'Browse Templates'}
                {activeSection === 'history' && 'Recent Presentations'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {activeSection === 'create' && 'Generate stunning presentations with AI'}
                {activeSection === 'templates' && 'Choose from professional PowerPoint-style designs'}
                {activeSection === 'history' && 'Access your previously generated presentations'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8">
          {activeSection === 'create' && (
            <div className="max-w-6xl mx-auto">
              {/* Input Mode Toggle */}
              <div className="bg-white rounded-2xl shadow-sm p-2 inline-flex mb-8">
                <button
                  onClick={() => setInputMode('topic')}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${
                    inputMode === 'topic'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📝 From Topic
                </button>
                <button
                  onClick={() => setInputMode('pdf')}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${
                    inputMode === 'pdf'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📄 From PDF
                </button>
              </div>

              <form onSubmit={handleGenerate} className="space-y-8">
                {/* Input Section */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Step 1: Content Input</h3>
                  
                  {inputMode === 'topic' ? (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-800 mb-2">
                          Presentation Topic
                        </label>
                        <input
                          type="text"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder="e.g., The Future of Artificial Intelligence in Healthcare"
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-800"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-800 mb-2">
                          Number of Slides: <span className="text-blue-600 font-bold">{numSlides}</span>
                        </label>
                        <input
                          type="range"
                          min="5"
                          max="10"
                          value={numSlides}
                          onChange={(e) => setNumSlides(Number(e.target.value))}
                          className="w-full h-3 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                          style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((numSlides - 5) / 5) * 100}%, #e2e8f0 ${((numSlides - 5) / 5) * 100}%, #e2e8f0 100%)`
                          }}
                        />
                        <div className="flex justify-between text-xs font-medium text-slate-700 mt-2">
                          <span>5 slides</span>
                          <span>10 slides (max)</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-800 mb-2">
                          Upload PDF Document
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="hidden"
                            id="pdf-upload"
                            required
                          />
                          <label
                            htmlFor="pdf-upload"
                            className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 transition-colors cursor-pointer bg-slate-50 hover:bg-blue-50"
                          >
                            <div className="text-center">
                              <svg className="w-12 h-12 mx-auto text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <p className="text-sm text-slate-800 font-medium">
                                {file ? file.name : 'Click to upload or drag and drop'}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">PDF files only</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-800 mb-2">
                          Slides per Chapter: <span className="text-blue-600 font-bold">{slidesPerChapter}</span>
                        </label>
                        <input
                          type="range"
                          min="2"
                          max="10"
                          value={slidesPerChapter}
                          onChange={(e) => setSlidesPerChapter(Number(e.target.value))}
                          className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((slidesPerChapter - 2) / 8) * 100}%, #e2e8f0 ${((slidesPerChapter - 2) / 8) * 100}%, #e2e8f0 100%)`
                          }}
                        />
                        <div className="flex justify-between text-xs font-medium text-slate-700 mt-2">
                          <span>2 slides</span>
                          <span>10 slides (max)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Template Selection */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Step 2: Choose Template</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {PRESENTATION_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`relative group text-left rounded-xl overflow-hidden transition-all ${
                          selectedTemplate === template.id
                            ? 'ring-4 ring-blue-500 shadow-xl scale-105'
                            : 'hover:shadow-lg hover:scale-102 border-2 border-slate-200'
                        }`}
                      >
                        <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 flex">
                            {template.colors.map((color, idx) => (
                              <div
                                key={idx}
                                className="flex-1"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <div className="relative text-6xl opacity-50">
                            {template.icon}
                          </div>
                        </div>
                        
                        <div className="p-4 bg-white">
                          <h4 className="font-bold text-slate-800 mb-1">{template.name}</h4>
                          <p className="text-xs text-slate-600">{template.description}</p>
                        </div>

                        {selectedTemplate === template.id && (
                          <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full p-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Scheme Selection */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Step 3: Select Color Scheme</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {COLOR_SCHEMES.map((scheme) => (
                      <button
                        key={scheme.id}
                        type="button"
                        onClick={() => setSelectedColorScheme(scheme.id)}
                        className={`relative group rounded-xl p-4 transition-all ${
                          selectedColorScheme === scheme.id
                            ? 'ring-4 ring-offset-2 ring-blue-500 scale-105'
                            : 'hover:scale-105 border-2 border-slate-200'
                        }`}
                      >
                        <div className="flex gap-2 mb-3">
                          <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: scheme.primary }} />
                          <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: scheme.secondary }} />
                          <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: scheme.accent }} />
                        </div>
                        <p className="text-sm font-semibold text-slate-800">{scheme.name}</p>
                        
                        {selectedColorScheme === scheme.id && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advanced Options */}
                <details className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 group">
                  <summary className="cursor-pointer list-none font-bold text-slate-800 flex items-center justify-between">
                    <span>⚙️ Advanced Options</span>
                    <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  
                  <div className="mt-6 space-y-6">
                    {/* Custom AI Instructions */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-2">
                        Custom AI Instructions
                      </label>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                        <p className="text-xs font-semibold text-blue-800 mb-2">💡 Example Instructions:</p>
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => setCustomPrompt("Focus on Chapter 1 only. Include introduction and detailed summary.")}
                            className="block w-full text-left text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
                          >
                            📖 "Focus on Chapter 1 only. Include introduction and detailed summary."
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomPrompt("Create detailed notes with key definitions, examples, and important formulas.")}
                            className="block w-full text-left text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
                          >
                            📝 "Create detailed notes with key definitions, examples, and formulas."
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomPrompt("Make it simple for beginners. Include real-world examples and analogies.")}
                            className="block w-full text-left text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
                          >
                            🎓 "Make it simple for beginners. Include real-world examples."
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomPrompt("Focus on practical applications and case studies with statistics.")}
                            className="block w-full text-left text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
                          >
                            💼 "Focus on practical applications and case studies."
                          </button>
                        </div>
                      </div>
                      
                      <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Enter your custom instructions here..."
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-none text-slate-800"
                        rows={6}
                      />
                      
                      {customPrompt && (
                        <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Custom instructions will be applied</span>
                        </div>
                      )}
                    </div>

                    {/* PDF Export Option */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div>
                        <label className="text-sm font-semibold text-slate-800">Generate PDF Version</label>
                        <p className="text-xs text-slate-600 mt-1">Also create a PDF file alongside PowerPoint</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={generatePDF}
                          onChange={(e) => setGeneratePDF(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </details>

                {/* Generate Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    '🚀 Generate Presentation'
                  )}
                </button>
              </form>

              {/* Loading, Error, Success states remain the same... */}
              {loading && (
                <div className="mt-8 bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                  <div className="text-center">
                    <div className="inline-block animate-bounce text-6xl mb-4">🎨</div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">{motivationalMessage}</h3>
                    <p className="text-slate-600 mb-6">This may take a moment. Your presentation will be worth the wait!</p>
                    
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-slate-500 mt-2">{Math.round(progress)}% complete</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-8 bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-red-800 mb-1">Generation Failed</h4>
                      <p className="text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {result && !loading && (
                <div className="mt-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-2xl p-8 text-white">
                  <div className="flex items-start gap-6">
                    <div className="text-6xl animate-bounce">🎉</div>
                    <div className="flex-1">
                      <h3 className="text-3xl font-bold mb-2">Presentation Ready!</h3>
                      <p className="text-emerald-100 mb-4">Your stunning presentation has been created successfully!</p>
                      
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-6 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>📁 Filename:</span>
                          <span className="font-mono font-semibold">{result.filename}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>📊 Total Slides:</span>
                          <span className="font-semibold">{result.slides_count || result.total_slides}</span>
                        </div>
                        {result.chapters_detected && (
                          <div className="flex justify-between text-sm">
                            <span>📚 Chapters:</span>
                            <span className="font-semibold">{result.chapters_detected}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDownload()}
                        className="bg-white text-emerald-600 px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-3"
                      >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Presentation
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection === 'templates' && (
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {PRESENTATION_TEMPLATES.map((template) => (
                  <div key={template.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-2xl transition-all group">
                    <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 flex">
                        {template.colors.map((color, idx) => (
                          <div key={idx} className="flex-1" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                      <div className="relative text-7xl opacity-60 group-hover:scale-110 transition-transform">
                        {template.icon}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-slate-800 mb-2">{template.name}</h3>
                      <p className="text-slate-600 mb-4">{template.description}</p>
                      <button
                        onClick={() => {
                          setSelectedTemplate(template.id)
                          setActiveSection('create')
                        }}
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                      >
                        Use Template
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'history' && (
            <div className="max-w-6xl mx-auto">
              {recentPresentations.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-8xl mb-6">📚</div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-4">No Recent Presentations</h3>
                  <p className="text-slate-600 mb-8">Your generated presentations will appear here</p>
                  <button
                    onClick={() => setActiveSection('create')}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Create Your First Presentation
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800">Your Presentations ({recentPresentations.length})</h3>
                    <button
                      onClick={handleClearHistory}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Clear All History
                    </button>
                  </div>
                  
                  <div className="grid gap-4">
                    {recentPresentations.map((pres) => (
                      <div key={pres.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-800 mb-1">{pres.title}</h4>
                            <div className="flex items-center gap-4 text-sm text-slate-600">
                              <span>📊 {pres.slides} slides</span>
                              <span>🎨 {PRESENTATION_TEMPLATES.find(t => t.id === pres.template)?.name}</span>
                              <span>🕒 {new Date(pres.timestamp).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDownload(pres.filename)}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              Download
                            </button>
                            <button
                              onClick={() => handleDeleteRecent(pres.id)}
                              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">⚙️ Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Auto Save */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <h3 className="font-semibold text-slate-800">Auto Save</h3>
                    <p className="text-sm text-slate-600">Automatically save presentations to history</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoSave}
                      onChange={(e) => setSettings({...settings, autoSave: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Notifications */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <h3 className="font-semibold text-slate-800">Notifications</h3>
                    <p className="text-sm text-slate-600">Show completion notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications}
                      onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Default Template */}
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h3 className="font-semibold text-slate-800 mb-3">Default Template</h3>
                  <select
                    value={settings.defaultTemplate}
                    onChange={(e) => setSettings({...settings, defaultTemplate: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 outline-none text-slate-800"
                  >
                    {PRESENTATION_TEMPLATES.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Default Color Scheme */}
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h3 className="font-semibold text-slate-800 mb-3">Default Color Scheme</h3>
                  <select
                    value={settings.defaultColorScheme}
                    onChange={(e) => setSettings({...settings, defaultColorScheme: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 outline-none text-slate-800"
                  >
                    {COLOR_SCHEMES.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* AI Quality */}
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h3 className="font-semibold text-slate-800 mb-3">AI Content Quality</h3>
                  <select
                    value={settings.aiQuality}
                    onChange={(e) => setSettings({...settings, aiQuality: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 outline-none text-slate-800"
                  >
                    <option value="high">High (Slower, Better Quality)</option>
                    <option value="medium">Medium (Balanced)</option>
                    <option value="fast">Fast (Quick Generation)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="mt-6 w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800">🚀 Upgrade to Pro</h2>
                <button
                  onClick={() => setShowUpgrade(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Free Plan */}
                <div className="border-2 border-slate-200 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Free Plan</h3>
                  <p className="text-3xl font-bold text-slate-600 mb-4">$0<span className="text-sm font-normal">/month</span></p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2 text-slate-600">
                      <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Up to 10 slides per presentation</span>
                    </li>
                    <li className="flex items-start gap-2 text-slate-600">
                      <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>7 professional templates</span>
                    </li>
                    <li className="flex items-start gap-2 text-slate-600">
                      <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>10 color schemes</span>
                    </li>
                    <li className="flex items-start gap-2 text-slate-600">
                      <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>PDF to PPT conversion</span>
                    </li>
                    <li className="flex items-start gap-2 text-slate-400">
                      <svg className="w-5 h-5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span>Standard AI quality</span>
                    </li>
                  </ul>
                  <button className="w-full border-2 border-slate-300 text-slate-600 py-3 rounded-xl font-semibold">
                    Current Plan
                  </button>
                </div>

                {/* Pro Plan */}
                <div className="border-2 border-blue-500 rounded-2xl p-6 bg-gradient-to-br from-blue-50 to-indigo-50 relative">
                  <div className="absolute top-4 right-4 bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                    RECOMMENDED
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Pro Plan</h3>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                    $17<span className="text-sm font-normal text-slate-600">/month</span>
                  </p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2 text-slate-800">
                      <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span><strong>Unlimited slides</strong> per presentation</span>
                    </li>
                    <li className="flex items-start gap-2 text-slate-800">
                      <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span><strong>20+ premium templates</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-slate-800">
                      <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Custom brand colors & logos</span>
                    </li>
                    <li className="flex items-start gap-2 text-slate-800">
                      <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span><strong>Advanced AI</strong> with better quality</span>
                    </li>
                    <li className="flex items-start gap-2 text-slate-800">
                      <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Export to PDF, PPT, and Google Slides</span>
                    </li>
                    <li className="flex items-start gap-2 text-slate-800">
                      <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Priority support</span>
                    </li>
                    <li className="flex items-start gap-2 text-slate-800">
                      <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Collaboration features</span>
                    </li>
                  </ul>
                  <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-xl font-semibold hover:shadow-xl transition-all">
                    Upgrade to Pro
                  </button>
                  <p className="text-xs text-center text-slate-600 mt-3">
                    Cancel anytime • 30-day money-back guarantee
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-6 text-center">
                <p className="text-slate-600 mb-4">💡 <strong>Limited Time Offer:</strong> Get 2 months free with annual billing</p>
                <p className="text-sm text-slate-500">Join 10,000+ professionals creating stunning presentations with EduSlide Pro</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {showNotification && settings.notifications && (
        <div className="fixed top-8 right-8 bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-md animate-slide-in-right z-50">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 text-4xl">✨</div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-800 mb-1">Presentation Complete!</h4>
              <p className="text-sm text-slate-600 mb-3">Your presentation is ready for download</p>
              <button
                onClick={() => handleDownload()}
                className="text-sm bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Download Now
              </button>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.4s ease-out;
        }
        
        /* Custom slider styling */
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          border: none;
        }
      `}</style>
    </div>
  )
}