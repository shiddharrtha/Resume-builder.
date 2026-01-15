
import React from 'react';
import { ResumeData } from '../types';

interface ResumePreviewProps {
  data: ResumeData;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ data }) => {
  return (
    <div 
      id="resume-preview" 
      className="bg-white p-12 shadow-2xl mx-auto w-full max-w-[8.5in] min-h-[11in] text-[10.5pt] leading-tight text-black border border-gray-200 latex-font"
    >
      {/* Header */}
      <header className="text-center mb-4">
        <h1 className="text-3xl font-bold uppercase tracking-wide mb-1">{data.personalInfo.name}</h1>
        <div className="flex justify-center gap-2 text-[9pt] flex-wrap">
          {data.personalInfo.phone && <span>{data.personalInfo.phone} |</span>}
          {data.personalInfo.email && <a href={`mailto:${data.personalInfo.email}`} className="hover:underline">{data.personalInfo.email}</a>}
          {data.personalInfo.linkedin && (
            <>
              <span>|</span>
              <a href={`https://${data.personalInfo.linkedin}`} className="hover:underline">linkedin.com/in/{data.personalInfo.linkedin.split('/').pop()}</a>
            </>
          )}
          {data.personalInfo.github && (
            <>
              <span>|</span>
              <a href={`https://${data.personalInfo.github}`} className="hover:underline">github.com/{data.personalInfo.github.split('/').pop()}</a>
            </>
          )}
        </div>
      </header>

      {/* Education */}
      <section className="mb-4">
        <h2 className="text-lg font-bold uppercase tracking-widest border-b border-black mb-1">Education</h2>
        {data.education.map((edu, i) => (
          <div key={i} className="mb-2">
            <div className="flex justify-between font-bold">
              <span>{edu.school}</span>
              <span>{edu.location}</span>
            </div>
            <div className="flex justify-between italic text-[10pt]">
              <span>{edu.degree}</span>
              <span>{edu.date}</span>
            </div>
            {edu.description && edu.description.length > 0 && (
              <ul className="list-disc ml-5 mt-1 text-[9.5pt]">
                {edu.description.map((item, j) => <li key={j}>{item}</li>)}
              </ul>
            )}
          </div>
        ))}
      </section>

      {/* Experience */}
      <section className="mb-4">
        <h2 className="text-lg font-bold uppercase tracking-widest border-b border-black mb-1">Experience</h2>
        {data.experience.map((exp, i) => (
          <div key={i} className="mb-2">
            <div className="flex justify-between font-bold">
              <span>{exp.company}</span>
              <span>{exp.location}</span>
            </div>
            <div className="flex justify-between italic text-[10pt]">
              <span>{exp.role}</span>
              <span>{exp.date}</span>
            </div>
            <ul className="list-disc ml-5 mt-1 text-[9.5pt]">
              {exp.description.map((item, j) => <li key={j}>{item}</li>)}
            </ul>
          </div>
        ))}
      </section>

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <section className="mb-4">
          <h2 className="text-lg font-bold uppercase tracking-widest border-b border-black mb-1">Projects</h2>
          {data.projects.map((proj, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between font-bold">
                <span>{proj.name} | <span className="italic font-normal">{proj.tech}</span></span>
                <span>{proj.date}</span>
              </div>
              <ul className="list-disc ml-5 mt-1 text-[9.5pt]">
                {proj.description.map((item, j) => <li key={j}>{item}</li>)}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* Technical Skills */}
      <section>
        <h2 className="text-lg font-bold uppercase tracking-widest border-b border-black mb-1">Technical Skills</h2>
        <div className="text-[10pt] space-y-0.5">
          {data.skills.languages && (
            <div>
              <span className="font-bold">Languages:</span> {data.skills.languages}
            </div>
          )}
          {data.skills.frameworks && (
            <div>
              <span className="font-bold">Frameworks:</span> {data.skills.frameworks}
            </div>
          )}
          {data.skills.tools && (
            <div>
              <span className="font-bold">Developer Tools:</span> {data.skills.tools}
            </div>
          )}
          {data.skills.libraries && (
            <div>
              <span className="font-bold">Libraries:</span> {data.skills.libraries}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ResumePreview;
