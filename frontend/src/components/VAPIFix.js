// Simple VAPI integration fix
export const startVAPICall = async (vapiInstance, assistantId, prompt, additionalData) => {
  try {
    console.log('=== STARTING VAPI CALL ===');
    console.log('Assistant ID:', assistantId);
    console.log('Prompt length:', prompt?.length || 0);
    console.log('Additional Data:', additionalData);
    
    // Try the simple approach first
    await vapiInstance.start(assistantId);
    
    return true;
  } catch (error) {
    console.error('VAPI call failed:', error);
    
    // Try alternative approach with assistant object
    try {
      console.log('Trying alternative VAPI configuration...');
      await vapiInstance.start({
        assistant: {
          transcriber: {
            provider: "deepgram",
            model: "nova-2",
            language: "en-US"
          },
          voice: {
            provider: "11labs",
            voiceId: "21m00Tcm4TlvDq8ikWAM"
          },
          model: {
            provider: "openai",
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: prompt || "You are an experienced hiring manager conducting a mock product management interview. Ask relevant questions about product management skills, experience, and scenarios."
              }
            ]
          },
          firstMessage: "Hello! I'm excited to conduct this mock product management interview with you. Let's start - could you please introduce yourself and tell me briefly about your current role?"
        }
      });
      
      return true;
    } catch (altError) {
      console.error('Alternative VAPI call also failed:', altError);
      throw new Error('Both VAPI call methods failed');
    }
  }
};