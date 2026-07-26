const fs = require('fs');
const path = require('path');

async function run() {
  const token = process.env.GITHUB_TOKEN;
  const apiKey = process.env.GEMINI_API_KEY;
  const eventPath = process.env.GITHUB_EVENT_PATH;

  if (!token) {
    console.error("Error: GITHUB_TOKEN is not set.");
    process.exit(1);
  }
  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY is not set.");
    process.exit(1);
  }
  if (!eventPath) {
    console.error("Error: GITHUB_EVENT_PATH is not set.");
    process.exit(1);
  }

  // Load GitHub Actions event metadata
  const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  const pullRequest = event.pull_request;
  if (!pullRequest) {
    console.error("Error: This event does not contain pull_request data.");
    process.exit(0);
  }

  const pullNumber = pullRequest.number;
  const owner = event.repository.owner.login;
  const repo = event.repository.name;
  const headSha = pullRequest.head.sha;

  console.log(`Processing PR #${pullNumber} in ${owner}/${repo} at HEAD ${headSha}`);

  // Fetch pull request files list via GitHub REST API
  const filesUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/files?per_page=100`;
  const files = await githubRequest(filesUrl, 'GET', null, token);
  console.log(`Found ${files.length} file(s) in this pull request.`);

  const allComments = [];
  let reviewedFilesCount = 0;

  // Process files
  for (const file of files) {
    const filepath = file.filename;
    const status = file.status;
    const patch = file.patch;

    if (status === 'removed' || status === 'deleted' || !patch) {
      console.log(`Skipping file: ${filepath} (Status: ${status}, has patch: ${!!patch})`);
      continue;
    }

    const fileType = getFileType(filepath);
    if (!fileType) {
      console.log(`Skipping file: ${filepath} (unsupported path/type)`);
      continue;
    }

    console.log(`Reviewing ${fileType} file: ${filepath}`);
    reviewedFilesCount++;

    // Parse modified line numbers from unified diff patch
    const modifiedLines = getModifiedLines(patch);
    if (modifiedLines.length === 0) {
      console.log(`No modified or added lines found in patch for ${filepath}`);
      continue;
    }

    // Read local file contents (checked out in head commit by actions/checkout)
    const localPath = path.resolve(process.cwd(), filepath);
    if (!fs.existsSync(localPath)) {
      console.warn(`Warning: File does not exist locally: ${filepath}`);
      continue;
    }
    const fileContent = fs.readFileSync(localPath, 'utf8');

    // Load engineering/quality guidelines
    let guidelines = '';
    try {
      if (fileType === 'backend') {
        guidelines = fs.readFileSync(path.resolve(process.cwd(), '.agents/skills/backend-engineering/SKILL.md'), 'utf8');
      } else {
        const frontendStandards = fs.readFileSync(path.resolve(process.cwd(), '.agents/skills/frontend-quality/SKILL.md'), 'utf8');
        const uiConsistency = fs.readFileSync(path.resolve(process.cwd(), '.agents/rules/ui-consistency.md'), 'utf8');
        guidelines = `${frontendStandards}\n\n=== UI CONSISTENCY RULES ===\n${uiConsistency}`;
      }
    } catch (err) {
      console.error(`Error reading guidelines for ${fileType}:`, err.message);
      continue;
    }

    // Call Gemini API to review
    const fileComments = await reviewFileWithGemini(filepath, fileContent, modifiedLines, fileType, guidelines, apiKey);
    
    // Filter and collect comments
    for (const comment of fileComments) {
      const line = parseInt(comment.line, 10);
      if (modifiedLines.includes(line)) {
        allComments.push({
          path: filepath,
          line: line,
          body: comment.comment,
          side: 'RIGHT'
        });
      } else {
        console.warn(`Warning: Model proposed a comment on line ${line} for ${filepath}, which is not in the modified lines. Skipping.`);
      }
    }
  }

  console.log(`Reviewed ${reviewedFilesCount} file(s). Found ${allComments.length} code quality comment(s) to submit.`);

  // Submit PR Review
  const reviewUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`;
  let reviewPayload;

  if (allComments.length === 0) {
    reviewPayload = {
      commit_id: headSha,
      event: 'APPROVE',
      body: '🤖 **TenantApp PR Review Agent** has reviewed your changes. No violations of backend engineering or frontend quality standards were detected. Great job!'
    };
  } else {
    reviewPayload = {
      commit_id: headSha,
      event: 'COMMENT',
      body: '🤖 **TenantApp PR Review Agent** has completed the review. It found some potential issues or suggestions for improvement based on the project backend and frontend standards. Please review the comments below.',
      comments: allComments
    };
  }

  await githubRequest(reviewUrl, 'POST', reviewPayload, token);
  console.log("Successfully submitted PR review to GitHub.");
}

async function githubRequest(url, method = 'GET', body = null, token) {
  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'tenantapp-pr-reviewer',
  };
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`GitHub API request failed: ${method} ${url} -> ${response.status} ${errText}`);
  }
  return response.json();
}

function getFileType(filepath) {
  if (filepath.includes('node_modules/') || filepath.includes('target/') || filepath.includes('.git/')) {
    return null;
  }
  const ext = filepath.split('.').pop().toLowerCase();
  
  // Check backend
  if (filepath.startsWith('backend/') || filepath.startsWith('ai-service/')) {
    if (ext === 'java' || ext === 'sql') {
      return 'backend';
    }
  }
  
  // Check frontend
  if (filepath.startsWith('TenantAppFE/') || filepath.startsWith('TenantAppTenantFE/')) {
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
      return 'frontend';
    }
  }
  
  return null;
}

function getModifiedLines(patch) {
  if (!patch) return [];
  const lines = patch.split('\n');
  const modifiedLines = [];
  let currentLine = 0;
  for (const line of lines) {
    if (line.startsWith('@@')) {
      const match = line.match(/\+(\d+)/);
      if (match) {
        currentLine = parseInt(match[1], 10) - 1;
      }
    } else if (line.startsWith('+')) {
      currentLine++;
      modifiedLines.push(currentLine);
    } else if (line.startsWith('-')) {
      // deleted line does not affect new file structure
    } else {
      currentLine++;
    }
  }
  return modifiedLines;
}

async function reviewFileWithGemini(filepath, fileContent, modifiedLines, fileType, guidelines, apiKey) {
  const language = fileType === 'backend' ? 'Java' : 'TypeScript/React Native';
  const promptText = `You are a Senior Software Engineer conducting a pull request code review for the TenantApp project.
Your task is to review the following ${language} file changes against the project's ${fileType === 'backend' ? 'Backend Engineering' : 'Frontend Quality & UI Consistency'} standards.

=== RULES AND STANDARDS ===
${guidelines}

=== FILE TO REVIEW ===
Path: ${filepath}
Content:
\`\`\`
${fileContent}
\`\`\`

The following line numbers were added or modified in this pull request. You MUST ONLY point out violations and place comments on these line numbers:
${modifiedLines.join(', ')}

=== INSTRUCTIONS ===
1. Analyze the modified code on the specified line numbers.
2. Check if they violate the provided standards (e.g. naming conventions, direct database repository calls inside loops, direct stylesheet usage when layout primitives are available, React hook order, API response envelopes, etc.).
3. For each violation, produce a constructive comment. The comment should explain exactly what standard is violated and how to rewrite the code to comply.
4. ONLY return comments for the modified line numbers listed above. Do not comment on unmodified lines.
5. If there are no violations or improvements required on the modified lines, return an empty array.

Your output must be a JSON array of objects conforming to the requested schema.`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: promptText
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            line: {
              type: "INTEGER",
              description: "The line number in the head file where the violation occurs. This MUST be one of the modified line numbers."
            },
            comment: {
              type: "STRING",
              description: "The detailed code review comment explaining the violation and suggestion/fix."
            }
          },
          required: ["line", "comment"]
        }
      }
    }
  };

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Gemini API error for ${filepath}: ${response.status} ${errText}`);
      return [];
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.warn(`Empty response from Gemini API for ${filepath}`);
      return [];
    }

    const comments = JSON.parse(text);
    if (!Array.isArray(comments)) {
      console.warn(`Model did not return a valid array for ${filepath}.`);
      return [];
    }
    return comments;
  } catch (err) {
    console.error(`Failed to review ${filepath} with Gemini:`, err.message);
    return [];
  }
}

run().catch(err => {
  console.error("Fatal error running PR reviewer:", err);
  process.exit(1);
});
