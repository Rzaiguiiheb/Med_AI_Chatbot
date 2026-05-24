from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

#This dictionary acts as the "instruction manual" for the AI. Depending on who is using the app, the AI changes its personality
SYSTEM_PROMPTS = {
    "patient": """You are MedAI, a compassionate and knowledgeable medical assistant designed to help patients understand health topics. 

Your role:
- Explain medical concepts in simple, clear language that non-medical people can understand
- Help patients understand symptoms, conditions, medications, and general health advice
- Always emphasize the importance of consulting a real doctor for diagnosis and treatment
- Be empathetic, supportive, and non-alarmist
- Provide evidence-based information
- Avoid technical medical jargon unless you explain it clearly

Important disclaimers to remember:
- You are NOT a replacement for professional medical advice
- Always recommend consulting a healthcare provider for specific medical concerns
- In emergencies, always direct to emergency services (call 15 in Tunisia, or local emergency number)

Format your responses clearly with:
- Short paragraphs for readability
- Bullet points when listing symptoms or steps
- Bold key terms when helpful
- Always end serious symptom discussions with a recommendation to seek professional care""",

    "doctor": """You are MedAI, an advanced clinical decision support assistant for healthcare professionals.

Your role:
- Provide evidence-based clinical information, differential diagnoses, and treatment options
- Reference current medical guidelines (WHO, FDA, EMA, etc.)
- Assist with drug interactions, dosing calculations, and pharmacology
- Support clinical reasoning with structured differential diagnoses
- Provide information on lab values, imaging interpretation guidance, and clinical scoring systems
- Discuss recent research and clinical trials when relevant

You are speaking with a medical professional, so you can use:
- Medical terminology and abbreviations
- Clinical reasoning frameworks (SOAP, clinical decision rules)
- Drug names (generic and brand)
- Laboratory reference ranges and clinical significance
- Evidence levels (Level A/B/C evidence)

Format your responses professionally:
- Use structured clinical formatting when appropriate
- Reference guidelines with specificity (e.g., "Per 2023 ACC/AHA guidelines...")
- Include relevant scoring systems (CHADS2, Wells criteria, etc.) when applicable
- Differential diagnoses in order of likelihood
- Always note when recommendations require clinical judgment

Reminder: This tool supports clinical decision-making but does not replace clinical judgment."""
}


class MedicalChatEngine:
    def __init__(self, role: str = "patient", model: str = "llama3.2"):
        self.role = role
        self.model = model

        #If role = "doctor", it goes into the dictionary, grabs the long doctor prompt, 
        # and assigns it to self.system_prompt. 
        # If role = "patient", it grabs the patient prompt.

        self.system_prompt = SYSTEM_PROMPTS.get(role, SYSTEM_PROMPTS["patient"])


        #initialize the Ollama chat model with specified parameters. 
        # temperature is set to 0.3 for more focused responses, 
        # which is important in a medical context to ensure accuracy and consistency.

        self.llm = ChatOllama(
            model=self.model,
            temperature=0.3, 
            base_url="http://localhost:11434",
        )

#This method constructs the message history for the chat. It starts with the system prompt to set the context, 
# then adds the conversation history (up to the last 20 messages) and finally appends the current user message.


    def _build_messages(self, user_message: str, history: list) -> list:
        messages = [SystemMessage(content=self.system_prompt)]

        # Add conversation history (up to the last 20 messages to keep context without overwhelming the model)
        for msg in history[-20:]:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))

#If the message was from the user, it labels it a HumanMessage.
# If the message was from the AI, it labels it an AIMessage.

        #The New Input: The User’s Message
        messages.append(HumanMessage(content=user_message))
        return messages
    
#chat (Standard) It sends the full prompt and waits. 
# stream_chat (Streaming) It yields chunks of the response as they are generated, 
# allowing for a more dynamic user experience. 

    def chat(self, user_message: str, history: list) -> str:
        try:
            messages = self._build_messages(user_message, history)
            response = self.llm.invoke(messages)
            return response.content
        except Exception as e:
            error_msg = str(e)
            if "connection" in error_msg.lower() or "refused" in error_msg.lower():
                return (
                    "⚠️ **Connection Error**: Unable to reach the Ollama server. "
                    "Please ensure Ollama is running locally with:\n\n"
                    "```\nollama serve\n```\n\n"
                    "And that the model is downloaded:\n\n"
                    "```\nollama pull llama3.2\n```"
                )
            return f"⚠️ **Error**: An unexpected error occurred: {error_msg}"

    def stream_chat(self, user_message: str, history: list):
        """Generator for streaming responses"""
        try:
            messages = self._build_messages(user_message, history)
            for chunk in self.llm.stream(messages):
                yield chunk.content
        except Exception as e:
            yield f"⚠️ Error: {str(e)}"



#Structure of the messages:
#messages = [
    # 1. THE SYSTEM PROMPT (Always index 0)
    #SystemMessage(content="You are MedAI, a compassionate and knowledgeable medical assistant..."),

    # 2. THE HISTORICAL BACK-AND-FORTH (Up to 20 messages maximum)
    #HumanMessage(content="Hello, my stomach hurts."),
    #AIMessage(content="I'm sorry to hear that. Where exactly does it hurt, and for how long?"),
    #HumanMessage(content="It's near the upper middle part, started this morning."),
    #AIMessage(content="Upper central pain can be linked to indigestion or acid reflux..."),
    
    # ... more history objects can sit here ...

    # 3. THE BRAND NEW USER MESSAGE (Always the very last item)
    #HumanMessage(content="I also feel slightly nauseous now.")


    
