import { Case, Message } from '@/lib/types';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000/api';

// Helper to map DB Case to Frontend Case
const mapDBCaseToFrontend = (dbCase: any): Case => {
  return {
    ...dbCase,
    location_text: dbCase.location_text || dbCase.location || null,
    location_source: dbCase.location_source || null,
    latitude: dbCase.latitude || null,
    longitude: dbCase.longitude || null,
  } as Case;
};

// Helper to map DB Message to Frontend Message
const mapDBMessageToFrontend = (dbMsg: any): Message => {
  return {
    ...dbMsg,
    sender: dbMsg.sender === 'user' ? 'user' : 'assistant', // DB uses text 'user'/'assistant', ensure match
  } as Message;
};

export const getCases = async (): Promise<Case[]> => {
  try {
    const response = await axios.get(`${API_BASE}/cases/`);
    return (response.data || []).map(mapDBCaseToFrontend);
  } catch (error) {
    console.error("API Error getCases:", error);
    throw error;
  }
};

export const getCase = async (id: string): Promise<Case> => {
  try {
    const response = await axios.get(`${API_BASE}/cases/${id}/`);
    const caseData = response.data;
    const messages = caseData.messages || []; 
    return { ...mapDBCaseToFrontend(caseData), messages: messages.map(mapDBMessageToFrontend) };
  } catch (error) {
     console.error("API Error getCase:", error);
     throw error;
  }
};

export const createCase = async (
    language: string, 
    location?: string,
    latitude?: number,
    longitude?: number
): Promise<Case> => {
    try {
        const response = await axios.post(`${API_BASE}/cases/`, {
            language,
            location: location || "Unknown Location",
            status: 'active',
            urgency_score: 0, 
            category: 'other',
            latitude,
            longitude
        });
        return mapDBCaseToFrontend(response.data);
    } catch (error) {
        console.error("API Error createCase:", error);
        throw error;
    }
};

export const addMessage = async (
  caseId: string, 
  content: string, 
  location?: string,
  latitude?: number, 
  longitude?: number
) => {
    try {
        const response = await axios.post(`${API_BASE}/cases/${caseId}/messages/`, {
            content,
            location,
            latitude,
            longitude
        });
        return {
            reply: response.data.reply,
            triage: response.data.triage
        };
    } catch (error) {
        console.error("API Error addMessage:", error);
        throw error;
    }
};

export const resolveCase = async (id: string) => {
    const response = await axios.patch(`${API_BASE}/cases/${id}/resolve/`);
    return response.data;
};

export const updateCase = async (id: string, updates: Partial<Case>) => {
    const response = await axios.patch(`${API_BASE}/cases/${id}/`, updates);
    return mapDBCaseToFrontend(response.data);
};

export const assignCase = async (id: string, assignedTo: string) => {
    const response = await axios.patch(`${API_BASE}/cases/${id}/assign/`, { assigned_to: assignedTo });
    return response.data;
};

export const transcribeAudio = async (audioBlob: Blob, language: string): Promise<string> => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('language', language);
  
  try {
      const response = await axios.post(`${API_BASE}/transcribe/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.text || "";
  } catch (error) {
      console.warn("API Error transcribe:", error);
      return "Error: Transcription service unavailable.";
  }
};

export default {
    getCases,
    getCase,
    addMessage,
    createCase,
    resolveCase,
    updateCase,
    assignCase,
    transcribeAudio
};
