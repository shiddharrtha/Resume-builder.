
import React, { useState, useCallback, useRef } from 'react';
import { extractResumeData } from './services/geminiService';
import { ResumeData, initialResumeData, Education, Experience, Project } from './types';
import ResumePreview from './components/ResumePreview';

// External libraries loaded via CDN in index.html
declare const mammoth: any;
declare const pdfjsLib: any;

const App: React.FC = () => {
  const [input, setInput] = useState<string>('');
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isReadingFile, setIsReadingFile] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'edit'>('generate');
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('personal');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPdf = async (arrayBuffer: ArrayBuffer): Promise<string> => {
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
      setActiveTab('edit'); // Switch to editor once generated
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
        } catch (err) { setError("Could not read .docx file."); }
        finally { setIsReadingFile(false); }
      };
      reader.readAsArrayBuffer(file);
    } else if (file.name.endsWith('.pdf')) {
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        try {
          const text = await extractTextFromPdf(arrayBuffer);
          setInput(text);
        } catch (err) { setError("Could not read .pdf file."); }
        finally { setIsReadingFile(false); }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (e) => {
        setInput(e.target?.result as string);
        setIsReadingFile(false);
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePrint = useCallback(() => window.print(), []);

  // Editor Update Logic
  const updatePersonalInfo = (field: keyof ResumeData['personalInfo'], value: string) => {
    setResumeData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, [field]: value } }));
  };

  const updateSection = <T extends Education | Experience | Project>(
    section: 'education' | 'experience' | 'projects',
    index: number,
    updates: Partial<T>
  ) => {
    setResumeData(prev => {
      const list = [...prev[section]] as any[];
      list[index] = { ...list[index], ...updates };
      return { ...prev, [section]: list };
    });
  };

  const addItem = (section: 'education' | 'experience' | 'projects') => {
    const newItem = section === 'education' 
      ? { school: '', degree: '', location: '', date: '', description: [] }
      : section === 'experience'
      ? { company: '', role: '', location: '', date: '', description: [] }
      : { name: '', tech: '', date: '', description: [] };
    setResumeData(prev => ({ ...prev, [section]: [...prev[section], newItem] }));
  };

  const removeItem = (section: 'education' | 'experience' | 'projects', index: number) => {
    setResumeData(prev => ({ ...prev, [section]: prev[section].filter((_, i) => i !== index) }));
  };

  const updateDescription = (section: 'education' | 'experience' | 'projects', itemIndex: number, descIndex: number, value: string) => {
    setResumeData(prev => {
      const list = [...prev[section]] as any[];
      const descs = [...list[itemIndex].description];
      descs[descIndex] = value;
      list[itemIndex] = { ...list[itemIndex], description: descs };
      return { ...prev, [section]: list };
    });
  };

  const addDescription = (section: 'education' | 'experience' | 'projects', itemIndex: number) => {
    setResumeData(prev => {
      const list = [...prev[section]] as any[];
      list[itemIndex] = { ...list[itemIndex], description: [...list[itemIndex].description, ''] };
      return { ...prev, [section]: list };
    });
  };

  const removeDescription = (section: 'education' | 'experience' | 'projects', itemIndex: number, descIndex: number) => {
    setResumeData(prev => {
      const list = [...prev[section]] as any[];
      list[itemIndex] = { ...list[itemIndex], description: list[itemIndex].description.filter((_: any, i: number) => i !== descIndex) };
      return { ...prev, [section]: list };
    });
  };

  const toggleSection = (section: string) => setExpandedSection(expandedSection === section ? null : section);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-100 overflow-hidden">
      <aside className="no-print w-full md:w-[480px] bg-white border-r border-slate-200 flex flex-col h-screen">
        <header className="p-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Jake's AI Resume</h1>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('generate')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'generate' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              1. Import Source
            </button>
            <button 
              onClick={() => setActiveTab('edit')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'edit' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              2. Review & Edit
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'generate' ? (
            <div className="space-y-4 animate-in fade-in duration-300">
               <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700">Paste Text or Upload File</label>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  Upload (.pdf, .docx, .txt)
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.md,.docx,.pdf" onChange={handleFileUpload} />
              </div>
              
              <div className="relative">
                <textarea
                  className="w-full h-80 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none font-mono"
                  placeholder="Paste LinkedIn profile, existing resume, or bio here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                {isReadingFile && <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-xl backdrop-blur-sm italic text-slate-500">Reading file...</div>}
              </div>

              <button
                onClick={handleGenerate}
                disabled={isLoading || !input.trim()}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2"
              >
                {isLoading ? 'Thinking...' : 'AI Transform to Jake\'s Template'}
              </button>
              {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            </div>
          ) : (
            <div className="space-y-2 animate-in slide-in-from-right-4 duration-300">
              {/* Personal Info */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button onClick={() => toggleSection('personal')} className="w-full px-4 py-3 flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors">
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Personal Info</span>
                  <svg className={`w-4 h-4 transition-transform ${expandedSection === 'personal' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {expandedSection === 'personal' && (
                  <div className="p-4 space-y-3 bg-white">
                    <input type="text" placeholder="Full Name" className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none" value={resumeData.personalInfo.name} onChange={(e) => updatePersonalInfo('name', e.target.value)} />
                    <input type="text" placeholder="Phone" className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none" value={resumeData.personalInfo.phone} onChange={(e) => updatePersonalInfo('phone', e.target.value)} />
                    <input type="text" placeholder="Email" className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none" value={resumeData.personalInfo.email} onChange={(e) => updatePersonalInfo('email', e.target.value)} />
                    <input type="text" placeholder="LinkedIn URL" className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none" value={resumeData.personalInfo.linkedin} onChange={(e) => updatePersonalInfo('linkedin', e.target.value)} />
                    <input type="text" placeholder="GitHub URL" className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none" value={resumeData.personalInfo.github} onChange={(e) => updatePersonalInfo('github', e.target.value)} />
                  </div>
                )}
              </div>

              {/* Education Section */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button onClick={() => toggleSection('education')} className="w-full px-4 py-3 flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors">
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Education</span>
                  <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full">{resumeData.education.length}</span>
                </button>
                {expandedSection === 'education' && (
                  <div className="p-4 space-y-6 bg-white">
                    {resumeData.education.map((edu, idx) => (
                      <div key={idx} className="relative p-3 border border-slate-100 rounded-lg bg-slate-50/50 space-y-2">
                        <button onClick={() => removeItem('education', idx)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                        <input type="text" placeholder="School" className="w-full p-1.5 text-sm font-bold border rounded" value={edu.school} onChange={(e) => updateSection('education', idx, { school: e.target.value })} />
                        <input type="text" placeholder="Degree" className="w-full p-1.5 text-sm border rounded" value={edu.degree} onChange={(e) => updateSection('education', idx, { degree: e.target.value })} />
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" placeholder="Location" className="p-1.5 text-xs border rounded" value={edu.location} onChange={(e) => updateSection('education', idx, { location: e.target.value })} />
                          <input type="text" placeholder="Date" className="p-1.5 text-xs border rounded" value={edu.date} onChange={(e) => updateSection('education', idx, { date: e.target.value })} />
                        </div>
                      </div>
                    ))}
                    <button onClick={() => addItem('education')} className="w-full py-2 border-2 border-dashed border-slate-200 rounded text-xs font-bold text-slate-500 hover:border-blue-300 hover:text-blue-500 transition-all">+ Add Education</button>
                  </div>
                )}
              </div>

              {/* Experience Section */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button onClick={() => toggleSection('experience')} className="w-full px-4 py-3 flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors">
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Experience</span>
                  <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full">{resumeData.experience.length}</span>
                </button>
                {expandedSection === 'experience' && (
                  <div className="p-4 space-y-6 bg-white">
                    {resumeData.experience.map((exp, idx) => (
                      <div key={idx} className="relative p-3 border border-slate-100 rounded-lg bg-slate-50/50 space-y-2">
                        <button onClick={() => removeItem('experience', idx)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                        <input type="text" placeholder="Company" className="w-full p-1.5 text-sm font-bold border rounded" value={exp.company} onChange={(e) => updateSection('experience', idx, { company: e.target.value })} />
                        <input type="text" placeholder="Role" className="w-full p-1.5 text-sm border rounded" value={exp.role} onChange={(e) => updateSection('experience', idx, { role: e.target.value })} />
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" placeholder="Location" className="p-1.5 text-xs border rounded" value={exp.location} onChange={(e) => updateSection('experience', idx, { location: e.target.value })} />
                          <input type="text" placeholder="Date Range" className="p-1.5 text-xs border rounded" value={exp.date} onChange={(e) => updateSection('experience', idx, { date: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Bullet Points</p>
                          {exp.description.map((desc, dIdx) => (
                            <div key={dIdx} className="flex gap-1 group">
                              <input type="text" className="flex-1 p-1 text-xs border rounded bg-white" value={desc} onChange={(e) => updateDescription('experience', idx, dIdx, e.target.value)} />
                              <button onClick={() => removeDescription('experience', idx, dIdx)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg></button>
                            </div>
                          ))}
                          <button onClick={() => addDescription('experience', idx)} className="text-[10px] text-blue-500 hover:underline font-bold">+ Add Bullet</button>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => addItem('experience')} className="w-full py-2 border-2 border-dashed border-slate-200 rounded text-xs font-bold text-slate-500 hover:border-blue-300 hover:text-blue-500 transition-all">+ Add Experience</button>
                  </div>
                )}
              </div>

              {/* Projects Section */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button onClick={() => toggleSection('projects')} className="w-full px-4 py-3 flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors">
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Projects</span>
                  <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full">{resumeData.projects.length}</span>
                </button>
                {expandedSection === 'projects' && (
                  <div className="p-4 space-y-6 bg-white">
                    {resumeData.projects.map((proj, idx) => (
                      <div key={idx} className="relative p-3 border border-slate-100 rounded-lg bg-slate-50/50 space-y-2">
                         <button onClick={() => removeItem('projects', idx)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                        <input type="text" placeholder="Project Name" className="w-full p-1.5 text-sm font-bold border rounded" value={proj.name} onChange={(e) => updateSection('projects', idx, { name: e.target.value })} />
                        <input type="text" placeholder="Technologies (e.g. React, Node.js)" className="w-full p-1.5 text-xs italic border rounded" value={proj.tech} onChange={(e) => updateSection('projects', idx, { tech: e.target.value })} />
                        <input type="text" placeholder="Date" className="w-full p-1.5 text-xs border rounded" value={proj.date} onChange={(e) => updateSection('projects', idx, { date: e.target.value })} />
                        <div className="space-y-1">
                          {proj.description.map((desc, dIdx) => (
                            <div key={dIdx} className="flex gap-1 group">
                              <input type="text" className="flex-1 p-1 text-xs border rounded bg-white" value={desc} onChange={(e) => updateDescription('projects', idx, dIdx, e.target.value)} />
                              <button onClick={() => removeDescription('projects', idx, dIdx)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg></button>
                            </div>
                          ))}
                          <button onClick={() => addDescription('projects', idx)} className="text-[10px] text-blue-500 hover:underline font-bold">+ Add Bullet</button>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => addItem('projects')} className="w-full py-2 border-2 border-dashed border-slate-200 rounded text-xs font-bold text-slate-500 hover:border-blue-300 hover:text-blue-500 transition-all">+ Add Project</button>
                  </div>
                )}
              </div>

              {/* Skills Section */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button onClick={() => toggleSection('skills')} className="w-full px-4 py-3 flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors">
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Technical Skills</span>
                  <svg className={`w-4 h-4 transition-transform ${expandedSection === 'skills' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {expandedSection === 'skills' && (
                  <div className="p-4 space-y-3 bg-white">
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase">Languages</label><input type="text" className="w-full p-2 text-sm border rounded" value={resumeData.skills.languages} onChange={(e) => setResumeData(p => ({ ...p, skills: { ...p.skills, languages: e.target.value } }))} /></div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase">Frameworks</label><input type="text" className="w-full p-2 text-sm border rounded" value={resumeData.skills.frameworks} onChange={(e) => setResumeData(p => ({ ...p, skills: { ...p.skills, frameworks: e.target.value } }))} /></div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase">Developer Tools</label><input type="text" className="w-full p-2 text-sm border rounded" value={resumeData.skills.tools} onChange={(e) => setResumeData(p => ({ ...p, skills: { ...p.skills, tools: e.target.value } }))} /></div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase">Libraries</label><input type="text" className="w-full p-2 text-sm border rounded" value={resumeData.skills.libraries} onChange={(e) => setResumeData(p => ({ ...p, skills: { ...p.skills, libraries: e.target.value } }))} /></div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <footer className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2 shrink-0">
          <button onClick={handlePrint} className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print to PDF
          </button>
        </footer>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-200/50 p-4 md:p-12 flex justify-center items-start">
        <div className="sticky top-12 scale-90 md:scale-100 origin-top">
          <ResumePreview data={resumeData} />
        </div>
      </main>
    </div>
  );
};

export default App;
