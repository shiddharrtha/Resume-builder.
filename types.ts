
export interface Education {
  school: string;
  degree: string;
  location: string;
  date: string;
  description: string[];
}

export interface Experience {
  company: string;
  role: string;
  location: string;
  date: string;
  description: string[];
}

export interface Project {
  name: string;
  tech: string;
  date: string;
  description: string[];
}

export interface TechnicalSkills {
  languages: string;
  frameworks: string;
  tools: string;
  libraries: string;
}

export interface ResumeData {
  personalInfo: {
    name: string;
    phone: string;
    email: string;
    linkedin: string;
    github: string;
  };
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: TechnicalSkills;
}

export const initialResumeData: ResumeData = {
  personalInfo: {
    name: "JAKE DOE",
    phone: "123-456-7890",
    email: "jake@example.com",
    linkedin: "linkedin.com/in/jakedoe",
    github: "github.com/jakedoe"
  },
  education: [
    {
      school: "Southwestern University",
      degree: "Bachelor of Science in Computer Science",
      location: "Georgetown, TX",
      date: "Aug. 2018 -- May 2021",
      description: []
    }
  ],
  experience: [
    {
      company: "Starbucks",
      role: "Software Engineer Intern",
      location: "Seattle, WA",
      date: "May 2020 -- Aug. 2020",
      description: [
        "Worked on the mobile app using React Native and TypeScript",
        "Improved performance by 20% by optimizing database queries"
      ]
    }
  ],
  projects: [
    {
      name: "Git-it-done",
      tech: "Node.js, Express, MongoDB",
      date: "June 2020",
      description: [
        "Developed a CLI tool to automate git workflows",
        "Used by over 500 developers weekly"
      ]
    }
  ],
  skills: {
    languages: "Java, Python, C/C++, SQL (Postgres), JavaScript, HTML/CSS",
    frameworks: "React, Node.js, Flask, JUnit, WordPress",
    tools: "Git, Docker, Google Cloud Platform, VS Code, PyCharm, IntelliJ, Eclipse",
    libraries: "pandas, NumPy, Matplotlib"
  }
};
