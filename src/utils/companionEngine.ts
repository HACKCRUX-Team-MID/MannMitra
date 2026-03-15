/**
 * Companion Engine - The AI Guide Interface
 * Ported from Flutter llm_service.dart (generateRemix and insights generation)
 * 
 * Provides context-aware, non-generic responses to the user's journal entries
 * based on detected emotion, specific word triggers, and health data (like sleep).
 */

import { detectEmotion } from './emotionEngine';
import type { HealthContext } from './emotionEngine';

export interface CompanionResponse {
  message: string;
  type: 'reflection' | 'encouragement' | 'health_alert' | 'validation';
  suggestedActions: string[];
}

export async function generateCompanionResponse(
  journalText: string, 
  userFirstName: string = 'there',
  healthData?: HealthContext
): Promise<CompanionResponse> {
  if (!journalText || journalText.trim().length === 0) {
    return {
      message: `Hi ${userFirstName}, I'm here when you're ready to share. Even a single word can be a good start.`,
      type: 'encouragement',
      suggestedActions: ['Take a deep breath', 'Check in later']
    };
  }

  // 1. Analyze the text using the advanced emotion engine
  const analysis = await detectEmotion(journalText, undefined, healthData);
  const primaryEmotion = analysis.primaryEmotion;
  const triggers = analysis.triggers;
  
  // 2. Extract context
  let sleepHours = 8;
  if (healthData && healthData.sleep_duration_hours !== undefined) {
    sleepHours = healthData.sleep_duration_hours;
  }

  // Use the strongest non-negated trigger to ground the response
  const validTriggers = triggers.filter(t => !t.negated && t.weight > 0).sort((a,b) => b.weight - a.weight);
  const keyPhrase = validTriggers.length > 0 ? validTriggers[0].word : '';
  const userRef = keyPhrase ? `When you wrote about "${keyPhrase}", ` : '';

  let message = '';
  let type: CompanionResponse['type'] = 'reflection';
  const suggestedActions: string[] = [];
  const randomMath = Math.random();

  // 3. Generate response based on emotion category (Ported directly from Flutter)
  switch (primaryEmotion) {
    case 'Apprehension':
      if (sleepHours < 6) {
        message = `${userRef}the dread you're carrying makes even more sense on ${sleepHours} hours of sleep. Sleep deprivation amplifies anxiety by up to 30%. You're not falling apart — you're exhausted. That's different.`;
        type = 'health_alert';
        suggestedActions.push('Try a 10-minute digital sunset', 'Listen to a sleep cast', 'Prioritize rest tonight');
      } else if (randomMath > 0.66) {
        message = `[Perspective] ${userRef}it revealed real pressure you're carrying. But pressure and capacity are two different things. Sometimes acknowledging "this is hard" is more powerful than trying to push through. You're allowed to pause.`;
        type = 'validation';
        suggestedActions.push('Do a 4-7-8 breathing cycle', 'Acknowledge what is out of your control');
      } else if (randomMath > 0.33) {
        message = `[Clarity] ${userRef}the anxiety beneath those words is visible. Your nervous system is doing its job — scanning for threats. But not every signal is a real emergency. What would it feel like to let just one worry go tonight?`;
        type = 'reflection';
        suggestedActions.push('Write down the worries', 'Grounding exercise (5-4-3-2-1)');
      } else {
        message = `[Growth] ${userRef}it sounds like your mind is overloaded. Would you like to try a 3-minute experiment? Write down the three things worrying you most, then circle the one you can actually influence today. Just one.`;
        type = 'encouragement';
        suggestedActions.push('Identify one actionable step', 'Set a tiny boundary');
      }
      break;

    case 'Sadness':
      if (randomMath > 0.66) {
        message = `[Clarity] ${userRef}what you're feeling sounds like genuine grief or heaviness. That's a sign of depth, not weakness. Having a tough chapter is just that — a chapter, not your entire story.`;
        type = 'validation';
      } else if (randomMath > 0.33) {
        message = `[Perspective] ${userRef}the weight in your words is real. But consider: the people who feel most deeply are also the ones who love most deeply. This heaviness isn't a flaw — it's the cost of caring.`;
        type = 'reflection';
      } else {
        message = `[Growth] ${userRef}there's real tenderness here. Would you like to try something? Write one sentence starting with "What I actually need right now is..." — sometimes naming the need is the first step toward meeting it.`;
        type = 'encouragement';
      }
      suggestedActions.push('Be gentle with yourself today', 'Listen to a comforting playlist', 'Reach out to a safe person');
      break;

    case 'Joy':
      if (randomMath > 0.66) {
        message = `[Growth] ${userRef}this is a beautiful moment to anchor. You might try writing down one specific sensory detail about what made this good — the sound, the light, someone's expression. Revisiting details like these becomes a wellbeing tool over time.`;
        type = 'reflection';
      } else if (randomMath > 0.33) {
        message = `[Perspective] ${userRef}your energy here is contagious even on paper. This isn't just a "good day" — it's evidence of what's possible when things align. How might you create more conditions like these?`;
        type = 'reflection';
      } else {
        message = `[Clarity] ${userRef}the warmth here is genuine. Positive moments are neurologically sticky when we pay attention to them. You're literally rewiring your brain's default narrative by writing this down.`;
        type = 'validation';
      }
      suggestedActions.push('Savor the feeling', 'Share the good news with someone');
      break;

    case 'Anger':
      if (sleepHours < 6) {
        message = `[Perspective] ${userRef}with only ${sleepHours} hours of sleep, your frustration threshold is fundamentally different. Sleep debt makes our emotional skin thinner. Would you like to try not judging the anger today and revisit this feeling tomorrow with fresh eyes?`;
        type = 'health_alert';
        suggestedActions.push('Step away from the situation', 'Get physical rest first');
      } else if (randomMath > 0.66) {
        message = `[Perspective] ${userRef}your frustration makes complete sense. Instead of judging the anger, you might try asking: what boundary is this feeling trying to protect? Anger often guards our most important values.`;
        type = 'reflection';
        suggestedActions.push('Identify the boundary that was crossed');
      } else if (randomMath > 0.33) {
        message = `[Clarity] ${userRef}the intensity here is striking. Your anger isn't irrational — it's information. Something important is being threatened or crossed. The question isn't whether the anger is valid (it is), but what it's pointing toward.`;
        type = 'validation';
        suggestedActions.push('Journal out the uncensored thoughts');
      } else {
        message = `[Growth] ${userRef}this energy needs somewhere constructive to go. Would you like to try writing a "letter you'll never send" — say everything you need to say, uncensored, then close the page? Sometimes the release is the medicine.`;
        type = 'encouragement';
        suggestedActions.push('Write a letter you will never send', 'Do intense physical exercise');
      }
      break;

    case 'Fatigue':
      if (randomMath > 0.66) {
        message = `[Growth] ${userRef}when energy is this low, even micro-actions count. Would you like a small experiment — one glass of water, five minutes of eyes-closed silence, or moving your bedtime up by 20 minutes tonight?`;
        type = 'encouragement';
      } else if (randomMath > 0.33) {
        message = `[Perspective] ${userRef}the exhaustion you're describing isn't laziness — it's your system's emergency brake. Sometimes the most productive thing you can do is absolutely nothing. Permission granted.`;
        type = 'validation';
      } else {
        message = `[Clarity] ${userRef}fatigue at this level isn't just physical. Emotional exhaustion, decision fatigue, and social depletion all draw from the same well. What would it look like to protect your energy for the next 24 hours?`;
        type = 'reflection';
      }
      if (sleepHours < 6) type = 'health_alert';
      suggestedActions.push('Take a guilt-free nap', 'Say NO to one non-essential task today', 'Drink a glass of water');
      break;

    default: // Contemplation
      message = `[Clarity] ${userRef}your reflection carries nuance that resists easy labels. The fact that you're putting words to your inner experience — even imperfect ones — is itself a meaningful act. Keep noticing.`;
      type = 'reflection';
      suggestedActions.push('Continue reflecting without pressure', 'Let the thoughts settle naturally');
  }

  // If there's an awareness insight from the emotionEngine, we can occasionally append it
  if (analysis.awarenessInsight && Math.random() > 0.7) {
    message += `\n\n${analysis.awarenessInsight}`;
  }

  return { message, type, suggestedActions };
}

/* ── UI Adapter Functions for React Pages ── */

export interface CompanionMessage {
  id: string;
  role: 'user' | 'companion';
  text: string;
  emotion?: string;
  timestamp: Date;
}

export function getGreeting(entries: any[]): string {
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return entries.length === 0
    ? `${timeGreeting}. I'm here to listen. What's on your mind today?`
    : `${timeGreeting}. I'm here for you. How are you feeling right now?`;
}

export function generateJournalEntry(emotion: string, userMsgs: string[]): string {
  return `I chatted with my companion about feeling ${emotion}. Here is what I shared:\n\n` + userMsgs.map(m => "- " + m).join("\n");
}
