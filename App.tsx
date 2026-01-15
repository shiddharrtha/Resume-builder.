
import React, { useState, useCallback, useRef } from 'react';
import { extractResumeData } from './services/geminiService';
import { ResumeData, initialResumeData } from './types';
import ResumePreview from './components/ResumePreview';

// External libraries loaded via CDN in index.html
declare const mammoth: any;
declare const pdfjsLib: any;

const App: React.FC = () => {
  const [input, setInput] = useState<string>('');
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isReadingFile, setIsReadingFile] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPdf = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    // PDF.js worker setup
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await extractResumeData(input);
      setResumeData(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate resume. Please try again with more details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsReadingFile(true);
    setError(null);

    const reader = new FileReader();

    if (file.name.endsWith('.docx')) {
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        try {
          const result = await mammoth.extractRawText({ arrayBuffer });
          setInput(result.value);
        } catch (err) {
          setError("Could not read .docx file. Try copy-pasting the text instead.");
        } finally {
          setIsReadingFile(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (file.name.endsWith('.pdf')) {
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        try {
          const text = await extractTextFromPdf(arrayBuffer);
          setInput(text);
        } catch (err) {
          console.error(err);
          setError("Could not read .pdf file. Try copy-pasting the text instead.");
        } finally {
          setIsReadingFile(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Treat as plain text (.txt, .md, .csv etc)
      reader.onload = (e) => {
        setInput(e.target?.result as string);
        setIsReadingFile(false);
      };
      reader.onerror = () => {
        setError("Error reading file.");
        setIsReadingFile(false);
      };
      reader.readAsText(file);
    }
    
    // Reset file input so same file can be uploaded again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const updatePersonalInfo = (field: keyof ResumeData['personalInfo'], value: string) => {
    setResumeData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const updateSkills = (field: keyof ResumeData['skills'], value: string) => {
    setResumeData(prev => ({
      ...prev,
      skills: { ...prev.skills, [field]: value }
    }));
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-100 overflow-hidden">
      {/* Sidebar / Input Section */}
      <aside className="no-print w-full md:w-[450px] bg-white border-r border-slate-200 flex flex-col h-screen overflow-y-auto">
        <header className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Jake's AI Resume
          </h1>
          <p className="text-sm text-slate-500 mt-1">Transform any text into a professional resume.</p>
        </header>

        <div className="p-6 space-y-6 flex-1">
          {/* Main Input Area */}
          <section>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-slate-700">Source Document</label>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isReadingFile}
                className="text-xs flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors font-medium border border-blue-100"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {isReadingFile ? 'Reading...' : 'Upload Doc'}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".txt,.md,.docx,.pdf"
                onChange={handleFileUpload}
              />
            </div>
            
            <div className="relative">
              <textarea
                className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                placeholder="Paste your Bio / LinkedIn / Old CV or upload a document..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              {isReadingFile && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
                   <div className="flex flex-col items-center gap-2">
                      <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-xs font-semibold text-slate-600">Reading file...</span>
                   </div>
                </div>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading || isReadingFile || !input.trim()}
              className="w-full mt-3 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-lg shadow-lg shadow-blue-200 transition-all flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>Generate Resume</>
              )}
            </button>
            {error && <p className="text-red-500 text-xs mt-2 text-center bg-red-50 p-2 rounded border border-red-100">{error}</p>}
            <p className="text-[10px] text-slate-400 mt-2 text-center">Supports .txt, .md, .docx, and .pdf files</p>
          </section>

          <hr className="border-slate-100" />

          {/* Quick Edit Section */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Quick Edit</h3>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                {isEditing ? 'Collapse' : 'Expand Details'}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                <input 
                  type="text"
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                  value={resumeData.personalInfo.name}
                  onChange={(e) => updatePersonalInfo('name', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                <input 
                  type="text"
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                  value={resumeData.personalInfo.email}
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                />
              </div>

              {isEditing && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Phone</label>
                    <input 
                      type="text"
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                      value={resumeData.personalInfo.phone}
                      onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">GitHub</label>
                    <input 
                      type="text"
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                      value={resumeData.personalInfo.github}
                      onChange={(e) => updatePersonalInfo('github', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Skills: Languages</label>
                    <textarea 
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded text-sm h-16 focus:ring-2 focus:ring-blue-200 outline-none"
                      value={resumeData.skills.languages}
                      onChange={(e) => updateSkills('languages', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <footer className="p-6 border-t border-slate-100 bg-slate-50">
          <button
            onClick={handlePrint}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg shadow-lg transition-all flex justify-center items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print to PDF
          </button>
        </footer>
      </aside>

      {/* Preview Section */}
      <main className="flex-1 overflow-y-auto bg-slate-200/50 p-4 md:p-12 flex justify-center items-start">
        <ResumePreview data={resumeData} />
      </main>
    </div>
  );
};

export default App;
