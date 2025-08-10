// public/js/career-compass.js - FINAL DEFINITIVE VERSION - All features, including user feedback, are restored and working.

import { PROFILE_DATABASE, SKILL_KNOWLEDGE_BASE, ALL_SKILLS } from './common/data.js';

// --- DOM ELEMENT REFERENCES ---
const elements = {
    searchBtn: document.getElementById('search-analyze-button'),
    jobTitleInput: document.getElementById('job-title'),
    locationInput: document.getElementById('location'),
    jobResultsDiv: document.getElementById('job-results'),
    analysisSection: document.getElementById('analysis-section'),
    generateAiBtn: document.getElementById('generate-ai-analysis-btn'),
    aiAdvisorContent: document.getElementById('ai-advisor-content'),
    internshipCard: document.getElementById('internship-finder-card'),
    internshipBtn: document.getElementById('find-internships-button'),
    skillGapResultsDiv: document.getElementById('skill-gap-results'),
    courseRecsDiv: document.getElementById('course-recommendations'),
};

// --- HELPER FUNCTIONS ---
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// --- CORE LOGIC ---

// Handles the main job search
async function handleJobSearch() {
    const desiredJobTitle = elements.jobTitleInput.value.trim();
    const location = elements.locationInput.value.trim();
    if (!desiredJobTitle || !location) {
        alert('Please enter both a desired job and location.');
        return;
    }

    // --- THIS IS THE RESTORED FEEDBACK ---
    elements.jobResultsDiv.innerHTML = '<p>Searching for jobs...</p>';
    elements.analysisSection.classList.add('hidden');
    elements.generateAiBtn.disabled = true;
    elements.aiAdvisorContent.innerHTML = '';

    try {
        const response = await fetch(`/api/jobs?query=${desiredJobTitle}&location=${location}`);
        if (response.status === 401) {
            alert('Your session has expired. Please log in again.');
            window.location.href = '/login.html';
            return;
        }
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || `Server error: ${response.status}`);
        }
        
        const data = await response.json();
        const { jobs, userProfile } = data;

        elements.jobResultsDiv.innerHTML = '';
        if (!jobs || jobs.length === 0) {
            elements.jobResultsDiv.innerHTML = '<p>No jobs found for this search. Please try different keywords.</p>';
            return;
        }

        performAndDisplayAnalysis(jobs[0], userProfile);
        elements.analysisSection.classList.remove('hidden');
        elements.generateAiBtn.disabled = false;
        
        elements.jobResultsDiv.innerHTML = '<h4>Full-Time Job Results</h4>';
        jobs.forEach(job => {
            const jobCard = document.createElement('div');
            jobCard.className = 'card';
            jobCard.innerHTML = `<h3>${job.job_title ?? 'No Title'}</h3><p><strong>Company:</strong> ${job.employer_name ?? 'N/A'}</p><a href="${job.job_apply_link}" class="btn btn-primary" target="_blank">View & Apply</a>`;
            elements.jobResultsDiv.appendChild(jobCard);
        });
    } catch (error) {
        console.error('Error fetching jobs:', error);
        elements.jobResultsDiv.innerHTML = `<p class="error-message">Failed to load jobs: ${error.message}</p>`;
    }
}

// Handles the separate, dedicated AI analysis request
async function handleGenerateAiAnalysis() {
    const desiredJobTitle = elements.jobTitleInput.value.trim();
    const location = elements.locationInput.value.trim();
    
    elements.aiAdvisorContent.innerHTML = '<p>🧠 Thinking... Our AI is generating your detailed career analysis...</p>';
    elements.generateAiBtn.disabled = true;

    try {
        const response = await fetch('/api/ai/career-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ desiredJobTitle, location })
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Failed to get AI analysis from the server.');
        }

        const result = await response.json();
        elements.aiAdvisorContent.innerHTML = result.advice.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

    } catch (error) {
        console.error('Error generating AI advice:', error);
        elements.aiAdvisorContent.innerHTML = `<p class="error-message">${error.message}</p>`;
    } finally {
        elements.generateAiBtn.disabled = false;
    }
}

// Handles the internship search
async function handleInternshipSearch() {
    const desiredJobTitle = elements.jobTitleInput.value.trim();
    const location = elements.locationInput.value.trim();
    if (!desiredJobTitle || !location) {
        alert('Please enter a job title and location before searching for internships.');
        return;
    }
    
    // --- THIS IS THE RESTORED FEEDBACK ---
    elements.jobResultsDiv.innerHTML = '<p>Searching for internships...</p>';
    const internshipQuery = `${desiredJobTitle} internship`;

    try {
        const response = await fetch(`/api/jobs?query=${internshipQuery}&location=${location}`);
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const data = await response.json();
        const jobs = data.jobs;
        
        elements.jobResultsDiv.innerHTML = '';
        if (!jobs || jobs.length === 0) {
            elements.jobResultsDiv.innerHTML = '<h4>Internship Results</h4><p>No internships found for this title. Try a broader search like "Marketing Internship".</p>';
            return;
        }
        
        elements.jobResultsDiv.innerHTML = '<h4>Internship Results</h4>';
        jobs.forEach(job => {
            const jobCard = document.createElement('div');
            jobCard.className = 'card';
            jobCard.innerHTML = `<h3>${job.job_title ?? 'No Title'}</h3><p><strong>Company:</strong> ${job.employer_name ?? 'N/A'}</p><a href="${job.job_apply_link}" class="btn btn-primary" target="_blank">View & Apply</a>`;
            elements.jobResultsDiv.appendChild(jobCard);
        });
    } catch (error) {
        console.error('Error fetching internships:', error);
        elements.jobResultsDiv.innerHTML = '<p class="error-message">Failed to load internships.</p>';
    }
}

// This function ONLY handles the non-AI analysis (Skill Gap & Courses)
function performAndDisplayAnalysis(job, userProfile) {
    const userRoleTitle = PROFILE_DATABASE[userProfile.currentRole]?.title || userProfile.currentRole;
    
    if (userRoleTitle.toLowerCase().includes('student')) {
        elements.internshipCard.classList.remove('hidden');
    } else {
        elements.internshipCard.classList.add('hidden');
    }

    const jobText = ((job.job_highlights?.Qualifications?.join(' ') ?? '') + ' ' + (job.job_description ?? '')).toLowerCase();
    let requiredSkills = new Set();
    ALL_SKILLS.forEach(skill => {
        const regex = new RegExp(`\\b${escapeRegex(skill)}\\b`, 'gi');
        if (regex.test(jobText)) requiredSkills.add(skill);
    });

    const userSkills = new Set(PROFILE_DATABASE[userProfile.currentRole]?.skills || []);
    const skillGap = Array.from(requiredSkills).filter(skill => !userSkills.has(skill));
    
    let gapContent = `<p><strong>Your Profile ("From"):</strong> ${userRoleTitle}<br><strong>Target Role ("To"):</strong> ${job.job_title}</p><hr>`;
    if (requiredSkills.size === 0) {
        gapContent += `<p>Could not automatically identify specific skills for this role.</p>`;
    } else if (skillGap.length === 0) {
        gapContent += `<p class="success-message">Excellent Match! Your skills cover all identified requirements.</p>`;
    } else {
        gapContent += `<p>To bridge the gap, you need to develop <strong>${skillGap.length}</strong> key skill(s):</p><ul>`;
        skillGap.forEach(skill => { gapContent += `<li>${skill.charAt(0).toUpperCase() + skill.slice(1)}</li>`; });
        gapContent += `</ul>`;
    }
    elements.skillGapResultsDiv.innerHTML = gapContent;
    
    let courseContent = '';
    if (skillGap.length > 0) {
        courseContent += '<ul>';
        skillGap.forEach(skill => {
            const encodedSkill = encodeURIComponent(skill);
            courseContent += `<li><span>${skill.charAt(0).toUpperCase() + skill.slice(1)}:</span><a href="https://www.udemy.com/courses/search/?q=${encodedSkill}" target="_blank">Find on Udemy</a> | <a href="https://www.coursera.org/search?query=${encodedSkill}" target="_blank">Find on Coursera</a></li>`;
        });
        courseContent += '</ul>';
    } else if (requiredSkills.size > 0) {
        courseContent = `<p class="success-message">No new courses are essential.</p>`;
    } else {
        courseContent = `<p>Review the analysis above.</p>`;
    }
    elements.courseRecsDiv.innerHTML = courseContent;
}

// --- INITIALIZATION ---
// This robust listener attaches all necessary events when the page is ready.
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.contains(elements.searchBtn)) {
        elements.searchBtn.addEventListener('click', handleJobSearch);
        elements.generateAiBtn.addEventListener('click', handleGenerateAiAnalysis);
        if (elements.internshipBtn) {
            elements.internshipBtn.addEventListener('click', handleInternshipSearch);
        }
    }
});