// public/js/script.js - V8 (DEFINITIVE & ACTIONABLE) - WITH DYNAMIC COURSE LINKS

// ---= 1. DATA AND CONFIGURATION =---
const PROFILE_DATABASE = {
    'student': { title: 'Student / New Graduate', skills: ['communication', 'teamwork', 'microsoft office', 'research', 'problem solving'] },
    'data analyst': { title: 'Data Analyst', skills: ['sql', 'excel', 'power bi', 'tableau', 'data analysis', 'statistics', 'quantitative analysis', 'ssrs'] },
    'economist': { title: 'Economist', skills: ['statistics', 'econometrics', 'stata', 'r', 'macroeconomics', 'microeconomics', 'excel', 'quantitative analysis', 'research'] },
    'software developer': { title: 'Software Developer', skills: ['javascript', 'python', 'git', 'sql', 'react', 'node.js', 'html', 'css', 'aws', 'docker', 'ci/cd', 'agile'] },
    'accountant': { title: 'Accountant', skills: ['bookkeeping', 'excel', 'quickbooks', 'financial reporting', 'gaap', 'auditing', 'sap', 'erp', 'financial modeling'] },
    'product manager': { title: 'Product Manager', skills: ['agile', 'scrum', 'jira', 'product roadmap', 'market research', 'user stories', 'confluence'] }
};

const SKILL_KNOWLEDGE_BASE = {
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

const ALL_SKILLS = Object.values(SKILL_KNOWLEDGE_BASE).flat();

// ---= 2. HELPER FUNCTIONS =---
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---= 3. INITIALIZATION & EVENT LISTENERS =---
document.addEventListener('DOMContentLoaded', () => {
    const pagePath = window.location.pathname;
    if (pagePath.includes('opportunity-engine.html')) {
        fetchAndDisplaySchemes();
    }
    if (pagePath.includes('career-compass.html')) {
        populateCurrentRoleDropdown();
        const searchButton = document.querySelector('.btn-accent');
        if (searchButton) {
            searchButton.addEventListener('click', handleJobSearch);
        }
    }
});

function populateCurrentRoleDropdown() {
    const dropdown = document.getElementById('current-role');
    if (!dropdown) return;
    for (const key in PROFILE_DATABASE) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = PROFILE_DATABASE[key].title;
        dropdown.appendChild(option);
    }
}

// ---= 4. CORE LOGIC =---
function handleJobSearch() {
    const currentRoleKey = document.getElementById('current-role').value;
    const desiredJobTitle = document.getElementById('job-title').value;
    const location = document.getElementById('location').value;
    const resultsDiv = document.getElementById('job-results');
    const analysisSection = document.getElementById('analysis-section');
    resultsDiv.innerHTML = '<p>Searching for jobs...</p>';
    analysisSection.classList.add('hidden');

    fetch(`/api/jobs?query=${desiredJobTitle}&location=${location}`)
        .then(response => { if (!response.ok) throw new Error(`Server error: ${response.status}`); return response.json(); })
        .then(jobs => {
            resultsDiv.innerHTML = '';
            if (!jobs || jobs.length === 0) {
                resultsDiv.innerHTML = '<p>No jobs found for this search.</p>';
                return;
            }
            const userProfile = PROFILE_DATABASE[currentRoleKey];
            const topJob = jobs[0];
            performAndDisplayAnalysis(topJob, userProfile);
            analysisSection.classList.remove('hidden');
            jobs.forEach(job => {
                const jobCard = document.createElement('div');
                jobCard.className = 'card';
                jobCard.innerHTML = `<h3>${job.job_title ?? 'No Title'}</h3><p><strong>Company:</strong> ${job.employer_name ?? 'N/A'}</p><a href="${job.job_apply_link}" class="btn btn-primary" target="_blank">View & Apply</a>`;
                resultsDiv.appendChild(jobCard);
            });
        })
        .catch(error => {
            console.error('Error fetching jobs:', error);
            resultsDiv.innerHTML = '<p style="color: red;">Failed to load jobs.</p>';
        });
}

function performAndDisplayAnalysis(job, userProfile) {
    const skillGapResultsDiv = document.getElementById('skill-gap-results');
    const courseRecsDiv = document.getElementById('course-recommendations');
    
    const jobText = ((job.job_highlights?.Qualifications?.join(' ') ?? '') + ' ' + (job.job_highlights?.Responsibilities?.join(' ') ?? '') + ' ' + (job.job_description ?? '')).toLowerCase();
    let requiredSkills = new Set();
    ALL_SKILLS.forEach(skill => {
        const regex = new RegExp(`\\b${escapeRegex(skill)}\\b`, 'gi');
        if (regex.test(jobText)) requiredSkills.add(skill);
    });

    const userSkills = new Set(userProfile.skills);
    const skillGap = Array.from(requiredSkills).filter(skill => !userSkills.has(skill));

    let jobDetailsHtml = '<strong>Job Snapshot:</strong><ul>';
    if (job.job_title) jobDetailsHtml += `<li><strong>Title:</strong> ${job.job_title}</li>`;
    if (job.job_city) jobDetailsHtml += `<li><strong>Location:</strong> ${job.job_city}, ${job.job_state ?? ''} ${job.job_country ?? ''}</li>`;
    if (job.job_employment_type) jobDetailsHtml += `<li><strong>Type:</strong> ${job.job_employment_type}</li>`;
    const qualifications = job.job_highlights?.Qualifications;
    if (qualifications && qualifications.length > 0) jobDetailsHtml += `<li><strong>Key Qualification:</strong> ${qualifications[0]}</li>`;
    jobDetailsHtml += '</ul>';

    let gapContent = `<p style="margin-bottom: 1rem;"><strong>Your Profile ("From"):</strong> ${userProfile.title}<br><strong>Target Role ("To"):</strong> ${job.job_title}</p><div>${jobDetailsHtml}</div><hr>`;
    if (requiredSkills.size === 0) {
        gapContent += `<p>Could not automatically identify specific skills. Please review the job description manually.</p>`;
    } else if (skillGap.length === 0) {
        gapContent += `<p style="color: green; font-weight: bold;">Excellent Match! You have all the identified skills required for this role.</p>`;
    } else {
        gapContent += `<p>To upgrade to this role, you need to develop <strong>${skillGap.length}</strong> key skill(s):</p><ul>`;
        skillGap.forEach(skill => { gapContent += `<li>${skill.charAt(0).toUpperCase() + skill.slice(1)}</li>`; });
        gapContent += `</ul>`;
    }
    skillGapResultsDiv.innerHTML = gapContent;
    
    // --- FINAL UPGRADE: Generate dynamic, clickable course links ---
    let courseContent = '';
    if (skillGap.length > 0) {
        courseContent += '<ul>';
        skillGap.forEach(skill => {
            // Use encodeURIComponent to make sure skills like "c++" work correctly in a URL
            const encodedSkill = encodeURIComponent(skill);
            
            // Create the search URLs
            const udemyUrl = `https://www.udemy.com/courses/search/?q=${encodedSkill}`;
            const courseraUrl = `https://www.coursera.org/search?query=${encodedSkill}`;

            // Create the list item with links
            courseContent += `
                <li>
                    <span>${skill.charAt(0).toUpperCase() + skill.slice(1)}:</span>
                    <a href="${udemyUrl}" target="_blank" style="margin-left: 8px;">Find on Udemy</a> | 
                    <a href="${courseraUrl}" target="_blank">Find on Coursera</a>
                </li>
            `;
        });
        courseContent += '</ul>';
    } else if (requiredSkills.size > 0) {
        courseContent = `<p style="color: green;">No new courses are essential. You are ready to apply!</p>`;
    } else {
        courseContent = `<p>Review the analysis above to see your path.</p>`;
    }
    courseRecsDiv.innerHTML = courseContent;
}

function fetchAndDisplaySchemes() {
    const schemesListDiv = document.getElementById('schemes-list');
    if (!schemesListDiv) return;
    fetch('/api/schemes').then(res => res.json()).then(schemes => {
        schemesListDiv.innerHTML = '';
        schemes.forEach(scheme => {
            const schemeCard = document.createElement('div');
            schemeCard.className = 'card';
            schemeCard.innerHTML = `<h3>${scheme.title}</h3><p><strong>Description:</strong> ${scheme.description}</p><p><strong>Eligibility:</strong> ${scheme.eligibility}</p><a href="${scheme.link}" class="btn btn-primary" target="_blank">Learn More</a>`;
            schemesListDiv.appendChild(schemeCard);
        });
    }).catch(error => { console.error('Error fetching schemes:', error); });
}