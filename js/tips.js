import { dom } from './dom.js';

const TIPS = [
  'Close all unnecessary browser tabs. Each open tab is a potential distraction pulling at your attention.',
  "Try the 'one thing' rule: before starting, write down the single most important task to accomplish.",
  'Put your phone in another room or in a drawer. Out of sight, out of mind.',
  'Take 3 deep breaths before starting. Inhale for 4 counts, hold for 4, exhale for 4.',
  "Set a clear micro-goal for this session. Instead of 'work on project', try 'write the intro paragraph'.",
  'Play white noise or lo-fi music to create a consistent audio environment.',
  'Clear your desk of everything except what you need for the current task.',
  'Drink a glass of water before starting. Even mild dehydration impacts concentration.',
  'Use the 2-minute rule: if a distracting thought takes less than 2 minutes, jot it down for later.',
  'Stand up and stretch for 30 seconds to reset your body and refocus your mind.',
  'Try working in a different spot. A change of environment can refresh your focus.',
  'Break your task into smaller chunks. Clarity reduces resistance to starting.',
  'Close your email client. Batch checking email 2-3 times per day preserves deep focus.',
  "Set your status to 'Do Not Disturb' on all messaging apps during focus time.",
  "If a task feels overwhelming, commit to just 2 minutes. Starting is the hardest part.",
  "Write down any intrusive thoughts on a 'parking lot' list to address later.",
  'Ensure your workspace is well-lit. Good lighting reduces eye strain and mental fatigue.',
  'Try body doubling — work alongside someone (even virtually) to boost accountability.',
  'Reward yourself after this session with something small you enjoy.',
  'Visualize completing the task before you start. Mental rehearsal primes your brain for action.',
];

export function getFocusTip() {
  if (!dom.getTipBtn || !dom.tipDisplay) return;

  dom.getTipBtn.innerHTML = 'Loading<span class="loader-inline"></span>';
  dom.getTipBtn.disabled = true;

  setTimeout(() => {
    const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
    dom.tipDisplay.textContent = `"${tip}"`;
    dom.getTipBtn.innerHTML = 'Get Another Tip';
    dom.getTipBtn.disabled = false;
  }, 600);
}
