document.addEventListener('DOMContentLoaded', function() {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const chatMessages = document.getElementById('chatMessages');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const menuItems = document.querySelectorAll('.menu-item');

    // Gemini API configuration
    const GEMINI_API_KEY = "AIzaSyBCTqGSpXXU_VERRWRQvAN19nZsMvEiR0Y"; // Replace with your actual API key
    const MODEL_NAME = "gemini-1.5-flash";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

    const systemInstructionText = `You are a Coding Instructor AI that specializes in helping with programming and Data Structures & Algorithms questions. Follow these rules:
    1. Only answer coding/programming/DSA related questions
    2. If asked non-coding questions, reply: "I specialize in programming questions. Ask me about algorithms, data structures, or coding problems."
    3. Provide clear, concise explanations with examples
    4. Include visual analogies for DSA concepts when helpful
    5. Format code with proper syntax highlighting
    6. For algorithms, explain time/space complexity
    7. Use bullet points for step-by-step explanations
    8. Provide real-world analogies for complex concepts`;

    // Add message to chat
    function addMessage(text, isUser) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = formatMessageText(text);
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Format message text with proper HTML
    function formatMessageText(text) {
        // Handle code blocks
        let formatted = text.replace(/```(\w*)\n([\s\S]*?)\n```/g, function(match, lang, code) {
            lang = lang || 'plaintext';
            return `<pre><code class="language-${lang}">${escapeHtml(code.trim())}</code></pre>`;
        });
        
        // Handle inline code
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Handle links (simple version)
        formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        
        // Split paragraphs and handle lists
        const paragraphs = formatted.split('\n\n');
        let htmlOutput = '';
        
        for (const paragraph of paragraphs) {
            if (paragraph.trim() === '') continue;
            
            if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
                htmlOutput += `<ul>${paragraph.split('\n').map(item => 
                    `<li>${item.substring(2).trim()}</li>`
                ).join('')}</ul>`;
            } else if (paragraph.match(/^\d+\. /)) {
                htmlOutput += `<ol>${paragraph.split('\n').map(item => 
                    `<li>${item.replace(/^\d+\. /, '').trim()}</li>`
                ).join('')}</ol>`;
            } else if (!paragraph.includes('<pre>')) {
                htmlOutput += `<p>${paragraph}</p>`;
            } else {
                htmlOutput += paragraph;
            }
        }
        
        return htmlOutput;
    }

    // Helper to escape HTML
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Send message to Gemini API
    async function sendMessageToAI(message) {
        loadingIndicator.style.display = 'allowed';
        
        const requestBody = {
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: message }
                    ]
                }
            ],
            systemInstruction: {
                parts: [
                    { text: systemInstructionText }
                ]
            },
            generationConfig: {
                temperature: 0.5,
                topK: 40,
                topP: 0.95
            }
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || "API request failed");
            }

            const data = await response.json();
            
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error("Unexpected response format");
            }
        } catch (error) {
            console.error("API Error:", error);
            return `Sorry, I encountered an error: ${error.message}`;
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    // Event listeners
    sendButton.addEventListener('click', async function() {
        const message = messageInput.value.trim();
        if (!message) return;

        addMessage(message, true);
        messageInput.value = '';
        
        const aiResponse = await sendMessageToAI(message);
        addMessage(aiResponse, false);
    });

    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendButton.click();
        }
    });

    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            // Add tab switching logic here
        });
    });

    // Menu items
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            // Add menu navigation logic here
        });
    });

    // Initial focus
    messageInput.focus();

    // Add some DSA-related sample questions
    setTimeout(() => {
        addMessage(`Here are some DSA topics you can ask about:
        - <code>Binary search implementation</code>
        - <code>Time complexity of merge sort</code>
        - <code>How hash tables work</code>
        - <code>DFS vs BFS differences</code>
        - <code>Dynamic programming examples</code>`, false);
    }, 2000);
});