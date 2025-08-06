// public/js/career-compass.js - FINAL PROFESSIONAL VERSION

import { PROFILE_DATABASE, SKILL_KNOWLEDGE_BASE, ALL_SKILLS } from './common/data.js';

// Helper function to escape special characters for Regex
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function markdownToHtml(text) {
    // Basic markdown conversion for bolding and newlines
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Convert **text** to <strong>text</strong>
        .replace(/\n/g, '<br>'); // Convert newlines to <br> tags
}
// Main controller for the job search process
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

    // NEW: We pass the user's profile to the backend so the AI knows who they are.
    const userProfile = PROFILE_DATABASE[loggedInUserKey];
    const encodedProfile = encodeURIComponent(JSON.stringify(userProfile));

    fetch(`/api/jobs?query=${desiredJobTitle}&location=${location}&userProfile=${encodedProfile}`)
        .then(response => { if (!response.ok) throw new Error(`Server error: ${response.status}`); return response.json(); })
        .then(data => {
            // The 'data' object now contains both 'jobs' and 'aiAdvice'
            const jobs = data.jobs;
            const aiAdvice = data.aiAdvice;

            resultsDiv.innerHTML = '';
            if (!jobs || jobs.length === 0) {
                resultsDiv.innerHTML = '<p>No jobs found for this search.</p>';
                aiAdvisorContent.innerHTML = '<p>Could not generate advice. Please try a different job title.</p>';
                return;
            }

            // Display the AI advice by converting markdown to HTML
            aiAdvisorContent.innerHTML = markdownToHtml(aiAdvice);

            // The rest of the logic remains the same
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
            resultsDiv.innerHTML = '<p class="error-message">Failed to load jobs.</p>';
            aiAdvisorContent.innerHTML = '<p class="error-message">Could not generate AI advice due to an error.</p>';
        });
}

// Performs the analysis and updates the right-hand column
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

    let gapContent = `<p><strong>Your Profile ("From"):</strong> ${userProfile.title}<br><strong>Target Role ("To"):</strong> ${job.job_title}</p><div>${jobDetailsHtml}</div><hr>`;
    if (requiredSkills.size === 0) {
        gapContent += `<p>Could not automatically identify specific skills. Please review the job description manually.</p>`;
    } else if (skillGap.length === 0) {
        gapContent += `<p class="success-message">Excellent Match! You have all the identified skills required for this role.</p>`;
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
        courseContent = `<p class="success-message">No new courses are essential. You are ready to apply!</p>`;
    } else {
        courseContent = `<p>Review the analysis above to see your path.</p>`;
    }
    courseRecsDiv.innerHTML = courseContent;
}

// --- THIS IS THE FIXED EVENT LISTENER ---
// It now looks for the specific ID of the search button.
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('career-compass.html')) {
        // Use the more specific getElementById to guarantee we get the right button
        const searchButton = document.getElementById('search-analyze-button');
        if (searchButton) {
            searchButton.addEventListener('click', handleJobSearch);
        }
    }
});