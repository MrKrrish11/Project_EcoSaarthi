// This file exports shared data structures to keep other scripts clean.

export const PROFILE_DATABASE = {
    'student': { title: 'Student / New Graduate', skills: ['communication', 'teamwork', 'microsoft office', 'research', 'problem solving'] },
    'data analyst': { title: 'Data Analyst', skills: ['sql', 'excel', 'power bi', 'tableau', 'data analysis', 'statistics', 'quantitative analysis', 'ssrs'] },
    'economist': { title: 'Economist', skills: ['statistics', 'econometrics', 'stata', 'r', 'macroeconomics', 'microeconomics', 'excel', 'quantitative analysis', 'research'] },
    'software developer': { title: 'Software Developer', skills: ['javascript', 'python', 'git', 'sql', 'react', 'node.js', 'html', 'css', 'aws', 'docker', 'ci/cd', 'agile'] },
    'accountant': { title: 'Accountant', skills: ['bookkeeping', 'excel', 'quickbooks', 'financial reporting', 'gaap', 'auditing', 'sap', 'erp', 'financial modeling'] },
    'product manager': { title: 'Product Manager', skills: ['agile', 'scrum', 'jira', 'product roadmap', 'market research', 'user stories', 'confluence'] }
};

export const SKILL_KNOWLEDGE_BASE = {
    'Technology & Programming': ['python', 'java', 'javascript', 'c++', 'c#', 'go', 'ruby', 'swift', 'typescript', 'php', 'html', 'css', 'sass'],
    'Frameworks & Libraries': ['react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', '.net', 'springboot', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch'],
    'Databases': ['sql', 'mysql', 'postgresql', 'mongodb', 'nosql', 'redis', 'firebase', 'ssrs'],
    'Cloud & DevOps': ['aws', 'azure', 'google cloud', 'gcp', 'docker', 'kubernetes', 'terraform', 'ci/cd', 'git'],
    'Business & Finance': ['excel', 'quickbooks', 'bookkeeping', 'gaap', 'financial modeling', 'financial reporting', 'auditing', 'sap', 'erp'],
    'Economics & Analysis': ['statistics', 'econometrics', 'stata', 'eviews', 'matlab', 'r', 'power bi', 'tableau', 'data analysis', 'macroeconomics', 'microeconomics', 'quantitative analysis', 'research'],
    'Logistics & Supply Chain': ['logistics', 'supply chain', 'freight', 'pricing', 'rate management', 'procurement', 'inventory management'],
    'Project Management': ['agile', 'scrum', 'jira', 'confluence', 'product roadmap', 'user stories', 'market research', 'lean', 'six sigma', 'problem solving'],
    'General': ['communication', 'teamwork', 'microsoft office']
};

export const ALL_SKILLS = Object.values(SKILL_KNOWLEDGE_BASE).flat();