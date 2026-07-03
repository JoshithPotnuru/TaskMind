import React, { useState } from 'react';
import { Sparkles, Mic, Code, Send, BrainCircuit, X, MessageSquare, ListTodo, Clipboard, HelpCircle } from 'lucide-react';
import api from '../services/api.js';
import { toast } from 'react-toastify';

const AICopilot = ({ projectId, onTaskGenerated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ask'); // 'ask' | 'search' | 'taskGen' | 'code' | 'meeting'
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);

  // Speech Recognition (Voice to Task)
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.warning('Browser Speech Recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.start();

    toast.info('Listening for instruction...', { autoClose: 2000 });

    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setInput(speechToText);
      toast.success('Speech captured!');
    };

    recognition.onerror = () => {
      toast.error('Voice input failed. Try speaking clearly.');
    };
  };

  const handleSendPrompt = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setAiResponse(null);

    try {
      if (activeTab === 'ask') {
        const { data } = await api.post('/ai/chat', { question: input });
        setAiResponse(data);
      } else if (activeTab === 'search') {
        const { data } = await api.post('/ai/search', { query: input, projectId });
        setAiResponse(data);
        if (data.tasks) {
          toast.success(`Found ${data.tasks.length} matching tasks`);
        }
      } else if (activeTab === 'taskGen') {
        const { data } = await api.post('/ai/generate', { prompt: input });
        setAiResponse(data);
      } else if (activeTab === 'code') {
        const { data } = await api.post('/ai/code', { request: input, code: '// Copy code snippet here' });
        setAiResponse(data);
      } else if (activeTab === 'meeting') {
        const { data } = await api.post('/ai/meeting', { transcript: input, projectId });
        setAiResponse(data);
        if (onTaskGenerated) onTaskGenerated();
      }
    } catch (error) {
      toast.error('AI call failed. Please verify API configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGeneratedTask = async () => {
    if (!aiResponse || activeTab !== 'taskGen') return;
    setLoading(true);
    try {
      await api.post('/tasks', {
        title: aiResponse.title,
        description: aiResponse.description,
        estimatedTime: aiResponse.estimatedTime,
        checklist: (aiResponse.checklist || []).map(t => ({ text: t })),
        project: projectId,
      });
      toast.success('Task created from AI plan!');
      setAiResponse(null);
      setInput('');
      if (onTaskGenerated) onTaskGenerated();
    } catch (error) {
      toast.error('Failed to create AI task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-600 to-violet-600 text-white flex items-center justify-center hover:scale-105 transition-all shadow-xl shadow-brand-500/30 cursor-pointer"
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} className="animate-pulse" />}
      </button>

      {/* Main Panel */}
      {isOpen && (
        <div className="absolute right-0 bottom-16 w-[420px] h-[550px] border shadow-2xl glass-dark rounded-3xl p-4 flex flex-col justify-between text-white overflow-hidden backdrop-blur-2xl">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-2">
            <div className="flex items-center space-x-2.5">
              <BrainCircuit className="text-brand-400" />
              <div>
                <span className="font-extrabold text-sm block">Taskmind Copilot</span>
                <span className="text-[10px] text-gray-400">OpenAI Integrated Intelligent Engine</span>
              </div>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="grid grid-cols-5 gap-1 bg-white/5 p-1 rounded-xl mb-3">
            {[
              { id: 'ask', label: 'Q&A', icon: HelpCircle },
              { id: 'search', label: 'Search', icon: MessageSquare },
              { id: 'taskGen', label: 'Gen Task', icon: ListTodo },
              { id: 'code', label: 'Code', icon: Code },
              { id: 'meeting', label: 'Meeting', icon: Clipboard },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => { setActiveTab(t.id); setAiResponse(null); }}
                className={`py-2 rounded-lg flex flex-col items-center text-[9px] font-bold transition-all cursor-pointer ${
                  activeTab === t.id ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                <t.icon size={13} className="mb-0.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Content Field */}
          <div className="flex-1 overflow-y-auto pr-1 text-xs space-y-2 mb-3">
            {aiResponse ? (
              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl space-y-2 max-h-[300px] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-brand-400">AI Response</span>
                  <button onClick={() => setAiResponse(null)} className="text-[10px] text-gray-400 hover:underline cursor-pointer">Clear</button>
                </div>
                
                {/* Ask Q&A Output view */}
                {activeTab === 'ask' && (
                  <div className="space-y-1.5 leading-relaxed text-gray-200">
                    <span className="block font-bold text-brand-400">AI Answer:</span>
                    <p className="whitespace-pre-wrap">{aiResponse.answer}</p>
                  </div>
                )}

                {/* Gen Task Output view */}
                {activeTab === 'taskGen' && (
                  <div className="space-y-1.5">
                    <span className="block font-semibold text-sm">{aiResponse.title}</span>
                    <p className="text-gray-300 leading-relaxed">{aiResponse.description}</p>
                    <div className="text-[10px] text-gray-400">Est. Time: {aiResponse.estimatedTime}h | Skills: {aiResponse.requiredSkills?.join(', ')}</div>
                    {aiResponse.checklist?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/5">
                        <span className="block font-bold text-gray-300 mb-1">Checklist items:</span>
                        <ul className="list-disc pl-4 space-y-1">
                          {aiResponse.checklist.map((item, idx) => (
                            <li key={idx} className="text-gray-400">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <button
                      onClick={handleCreateGeneratedTask}
                      className="w-full bg-brand-600 hover:bg-brand-700 py-2 rounded-xl mt-3 font-semibold transition-colors cursor-pointer"
                    >
                      Save Task to Board
                    </button>
                  </div>
                )}

                {/* Search Output view */}
                {activeTab === 'search' && (
                  <div className="space-y-2">
                    <span className="font-semibold block text-gray-300">Matching Tasks Found:</span>
                    {aiResponse.tasks?.length === 0 ? (
                      <div className="text-gray-400 py-4 text-center">No tasks match filter queries</div>
                    ) : (
                      <div className="space-y-1">
                        {aiResponse.tasks?.map((t) => (
                          <div key={t._id} className="p-2 rounded bg-white/5 border border-white/5 flex items-center justify-between">
                            <span className="font-medium">{t.title}</span>
                            <span className="text-[10px] bg-brand-500/20 text-brand-300 px-1.5 py-0.5 rounded-full">{t.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Code view */}
                {activeTab === 'code' && (
                  <div className="space-y-1.5">
                    <span className="block font-semibold">Suggested Code:</span>
                    <pre className="p-2 rounded bg-black/60 font-mono text-[10px] overflow-x-auto text-emerald-400">{aiResponse.suggestedCode}</pre>
                    <span className="block font-semibold mt-1">Explanation:</span>
                    <p className="text-gray-300">{aiResponse.explanation}</p>
                  </div>
                )}

                {/* Meeting Summary view */}
                {activeTab === 'meeting' && (
                  <div className="space-y-2">
                    <span className="block font-semibold text-brand-400">Meeting Summary:</span>
                    <p className="text-gray-300 leading-relaxed">{aiResponse.summary}</p>
                    {aiResponse.actionItems?.length > 0 && (
                      <div>
                        <span className="block font-bold text-gray-200 mt-2">Action Items:</span>
                        <ul className="list-disc pl-4 space-y-1 text-gray-400">
                          {aiResponse.actionItems.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-center p-6 text-gray-400">
                <Sparkles size={36} className="text-brand-500 mb-2 animate-bounce" />
                <span className="font-bold text-gray-300">How can I assist you?</span>
                <p className="text-[10px] max-w-[250px] mt-1 text-gray-500 leading-relaxed">
                  {activeTab === 'ask' && 'Type any questions (e.g. "How do I build database integrations?") to get direct AI answers.'}
                  {activeTab === 'search' && 'Enter filters like "show overdue backends" to find matching tasks.'}
                  {activeTab === 'taskGen' && 'Type "Create Authentication flow" to generate a sprint plan outline.'}
                  {activeTab === 'code' && 'Paste code snippet requesting bug fixes, formatting, or speed optimizations.'}
                  {activeTab === 'meeting' && 'Paste meeting transcripts to parse summaries and extract tasks.'}
                </p>
              </div>
            )}
          </div>

          {/* Form Input Control */}
          <div className="flex items-center space-x-2 border-t border-white/10 pt-3">
            <button
              onClick={handleVoiceInput}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white cursor-pointer"
              title="Voice-to-Task listener"
            >
              <Mic size={18} />
            </button>
            
            <input
              type="text"
              placeholder={
                activeTab === 'meeting' ? 'Paste transcript text...' :
                activeTab === 'code' ? 'Paste code query...' : 'Type instructions here...'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-brand-500 placeholder-gray-500 text-xs text-white"
              onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
            />
            
            <button
              onClick={handleSendPrompt}
              disabled={loading}
              className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 transition-colors cursor-pointer"
            >
              <Send size={18} />
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default AICopilot;
