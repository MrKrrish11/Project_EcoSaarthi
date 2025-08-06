// public/js/career-compass.js - FINAL VERSION WITH ALL LISTENERS CORRECTLY ATTACHED

import { PROFILE_DATABASE, SKILL_KNOWLEDGE_BASE, ALL_SKILLS } from './common/data.js';

// --- HELPER FUNCTIONS ---
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// --- CORE LOGIC ---

// Handles the specific internship search
function handleInternshipSearch() {
    const desiredJobTitle = document.getElementById('job-title').value;
    const location = document.getElementById('location').value;
    const resultsDiv = document.getElementById('job-results');
    resultsDiv.innerHTML = '<p>Searching for internships...</p>';

    const internshipQuery = `${desiredJobTitle} internship`;
    const loggedInUserKey = localStorage.getItem('loggedInUserKey');
    if (!loggedInUserKey) {
        alert('Could not find user profile. Please try logging in again.');
        return;
    }
    const userProfile = PROFILE_DATABASE[loggedInUserKey];
    const encodedProfile = encodeURIComponent(JSON.stringify(userProfile));

    fetch(`/api/jobs?query=${internshipQuery}&location=${location}&userProfile=${encodedProfile}`)
        .then(response => { if (!response.ok) throw new Error(`Server error: ${response.status}`); return response.json(); })
        .then(data => {
            const jobs = data.jobs; 
            resultsDiv.innerHTML = '';
            if (!jobs || jobs.length === 0) {
                resultsDiv.innerHTML = '<h4>Internship Results</h4><p>No internships found for this specific title. Try a broader search like "Marketing Internship".</p>';
                return;
            }
            resultsDiv.innerHTML = '<h4>Internship Results</h4>';
            jobs.forEach(job => {
                const jobCard = document.createElement('div');
                jobCard.className = 'card';
                jobCard.innerHTML = `<h3>${job.job_title ?? 'No Title'}</h3><p><strong>Company:</strong> ${job.employer_name ?? 'N/A'}</p><a href="${job.job_apply_link}" class="btn btn-primary" target="_blank">View & Apply</a>`;
                resultsDiv.appendChild(jobCard);
            });
        })
        .catch(error => {
            console.error('Error fetching internships:', error);
            resultsDiv.innerHTML = '<p class="error-message">Failed to load internships.</p>';
        });
}

// Main search handler
function handleJobSearch() {
    const loggedInUserKey = localStorage.getItem('loggedInUserKey');
    if (!loggedInUserKey) {
        alert('Please login to use the Career Compass.');
        window.location.href = '/login.html';
        return;
    }
    
    const desiredJobTitle = document.getElementById('job-title').value;
    const location = document.getElementById('location').value;
    const resultsDiv = document.getElementById('job-results');
    const analysisSection = document.getElementById('analysis-section');
    const aiAdvisorContent = document.getElementById('ai-advisor-content');

    resultsDiv.innerHTML = '<p>Searching for jobs...</p>';
    aiAdvisorContent.innerHTML = '<p>🧠 Thinking... Our AI is generating personalized advice for you...</p>';
    analysisSection.classList.add('hidden');

    const userProfile = PROFILE_DATABASE[loggedInUserKey];
    const encodedProfile = encodeURIComponent(JSON.stringify(userProfile));

    fetch(`/api/jobs?query=${desiredJobTitle}&location=${location}&userProfile=${encodedProfile}`)
        .then(response => { if (!response.ok) throw new Error(`Server error: ${response.status}`); return response.json(); })
        .then(data => {
            const jobs = data.jobs;
            const aiAdvice = data.aiAdvice;

            resultsDiv.innerHTML = '';
            if (!jobs || jobs.length === 0) {
                resultsDiv.innerHTML = '<p>No jobs found for this search.</p>';
                aiAdvisorContent.innerHTML = '<p>Could not generate advice. Please try a different job title.</p>';
                return;
            }

            aiAdvisorContent.innerHTML = aiAdvice.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

            const topJob = jobs[0];
            performAndDisplayAnalysis(topJob, userProfile);
            analysisSection.classList.remove('hidden');
            
            resultsDiv.innerHTML = '<h4>Full-Time Job Results</h4>';
            jobs.forEach(job => {
                const jobCard = document.createElement('div');
                jobCard.className = 'card';
                jobCard.innerHTML = `<h3>${job.job_title ?? 'No Title'}</h3><p><strong>Company:</strong> ${job.employer_name ?? 'N/A'}</p><a href="${job.job_apply_link}" class="btn btn-primary" target="_blank">View & Apply</a>`;
                resultsDiv.appendChild(jobCard);
            });
        })
        .catch(error => {
            console.error('Error fetching jobs:', error);
            resultsDiv.innerHTML = '<p class="error-message">Failed to load jobs.</p>';
            aiAdvisorContent.innerHTML = '<p class="error-message">Could not generate AI advice due to an error.</p>';
        });
}

// Analysis function now ONLY controls the visibility of the internship card
function performAndDisplayAnalysis(job, userProfile) {
    const internshipCard = document.getElementById('internship-finder-card');

    if (userProfile.title.toLowerCase().includes('student')) {
        internshipCard.classList.remove('hidden');
    } else {
        internshipCard.classList.add('hidden');
    }

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
    let gapContent = `<p><strong>Your Profile ("From"):</strong> ${userProfile.title}<br><strong>Target Role ("To"):</strong> ${job.job_title}</p><div>${jobDetailsHtml}</div><hr>`;
    if (requiredSkills.size === 0) {
        gapContent += `<p>Could not automatically identify specific skills.</p>`;
    } else if (skillGap.length === 0) {
        gapContent += `<p class="success-message">Excellent Match! You have all the identified skills.</p>`;
    } else {
        gapContent += `<p>To upgrade to this role, you need to develop <strong>${skillGap.length}</strong> key skill(s):</p><ul>`;
        skillGap.forEach(skill => { gapContent += `<li>${skill.charAt(0).toUpperCase() + skill.slice(1)}</li>`; });
        gapContent += `</ul>`;
    }
    skillGapResultsDiv.innerHTML = gapContent;
    let courseContent = '';
    if (skillGap.length > 0) {
        courseContent += '<ul>';
        skillGap.forEach(skill => {
            const encodedSkill = encodeURIComponent(skill);
            const udemyUrl = `https://www.udemy.com/courses/search/?q=${encodedSkill}`;
            const courseraUrl = `https://www.coursera.org/search?query=${encodedSkill}`;
            courseContent += `<li><span>${skill.charAt(0).toUpperCase() + skill.slice(1)}:</span><a href="${udemyUrl}" target="_blank">Find on Udemy</a> | <a href="${courseraUrl}" target="_blank">Find on Coursera</a></li>`;
        });
        courseContent += '</ul>';
    } else if (requiredSkills.size > 0) {
        courseContent = `<p class="success-message">No new courses are essential.</p>`;
    } else {
        courseContent = `<p>Review the analysis above.</p>`;
    }
    courseRecsDiv.innerHTML = courseContent;
}

// --- EVENT LISTENER ATTACHMENT ---
// This robust version handles ALL buttons on the Career Compass page.
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('career-compass.html')) {
        // Attach listener for the main search button
        const searchButton = document.getElementById('search-analyze-button');
        if (searchButton) {
            searchButton.addEventListener('click', handleJobSearch);
        }

        // Attach listener for the internship button
        const internshipButton = document.getElementById('find-internships-button');
        if (internshipButton) {
            internshipButton.addEventListener('click', handleInternshipSearch);
        }
    }
});